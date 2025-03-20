import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function main() {
  try {
    // Create artifacts directory if it doesn't exist
    await fs.mkdir('artifacts', { recursive: true });

    console.log('Compiling contracts...');
    
    // Get list of contract files
    const contractFiles = await fs.readdir('src/contracts');
    const solFiles = contractFiles.filter(file => file.endsWith('.sol'));

    if (solFiles.length === 0) {
      throw new Error('No Solidity files found in src/contracts/');
    }

    // Compile each contract separately
    for (const file of solFiles) {
      console.log(`\nCompiling ${file}...`);
      
      const inputPath = path.join('src/contracts', file);
      const outputPath = path.join('artifacts', path.basename(file, '.sol'));
      
      await fs.mkdir(outputPath, { recursive: true });

      // Use direct Node.js execution instead of shell command
      const solc = require('solc');
      
      // Read the contract source
      const source = await fs.readFile(inputPath, 'utf8');
      
      // Prepare compiler input
      const input = {
        language: 'Solidity',
        sources: {
          [file]: {
            content: source
          }
        },
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode']
            }
          }
        }
      };

      // Compile
      const output = JSON.parse(solc.compile(JSON.stringify(input)));

      if (output.errors) {
        const errors = output.errors.filter(error => error.severity === 'error');
        if (errors.length > 0) {
          throw new Error(`Compilation errors:\n${errors.map(e => e.message).join('\n')}`);
        }
        // Log warnings
        const warnings = output.errors.filter(error => error.severity === 'warning');
        if (warnings.length > 0) {
          console.warn('Compilation warnings:', warnings.map(w => w.message).join('\n'));
        }
      }

      // Extract contract name from file name
      const contractName = path.basename(file, '.sol');
      const contract = output.contracts[file][contractName];

      // Write ABI
      await fs.writeFile(
        path.join(outputPath, `${contractName}.abi`),
        JSON.stringify(contract.abi, null, 2)
      );

      // Write bytecode
      await fs.writeFile(
        path.join(outputPath, `${contractName}.bin`),
        contract.evm.bytecode.object
      );

      console.log(`Compiled ${file} successfully`);
    }

    // Generate deployment data
    const deployData = {};
    for (const file of solFiles) {
      const contractName = path.basename(file, '.sol');
      const [abi, bytecode] = await Promise.all([
        fs.readFile(path.join('artifacts', contractName, `${contractName}.abi`), 'utf8'),
        fs.readFile(path.join('artifacts', contractName, `${contractName}.bin`), 'utf8')
      ]);

      deployData[contractName] = {
        abi: JSON.parse(abi),
        bytecode: `0x${bytecode}`
      };
    }

    // Save deployment data
    await fs.writeFile(
      path.join('artifacts', 'deploy-data.json'),
      JSON.stringify(deployData, null, 2)
    );

    console.log('\nCompilation successful! Artifacts saved to ./artifacts');
    console.log('Deployment data generated in artifacts/deploy-data.json');
    
  } catch (error) {
    console.error('Compilation failed:', error);
    process.exit(1);
  }
}

main();
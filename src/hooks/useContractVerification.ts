import { useState, useEffect } from 'react';
import { verifyContractDeployment } from '../lib/verify';

export const useContractVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<Awaited<ReturnType<typeof verifyContractDeployment>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    setIsVerifying(true);
    setError(null);
    try {
      const result = await verifyContractDeployment();
      setVerificationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verify();
  }, []);

  return {
    isVerifying,
    verificationResult,
    error,
    verify
  };
};
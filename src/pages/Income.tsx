import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { TokenImport } from "../components/TokenImport";
import { useGigFiWallet } from "../hooks/useGigFiWallet";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Wallet,
  ExternalLink,
  AlertCircle,
  QrCode,
  Coins,
  RefreshCcw,
  Info,
} from "lucide-react";
import { useWalletStore } from "../lib/store";
import { QRCodeSVG } from "qrcode.react";
import { contracts } from "../lib/contracts";
import { parseUnits, formatEther } from "viem";
import { GIGFI_TOKEN_ADDRESS } from "../lib/constants";
import { GigCoinPurchase } from "../components/GigCoinPurchase";

export const Income = () => {
  const { storeUSDC, withdrawUSDC, isLoading, error } = useGigFiWallet();
  const { address, transactions, usdcBalance, gigBalance, updateBalance } =
    useWalletStore();
  const [showQR, setShowQR] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isBuying, setIsBuying] = useState(true);
  const [tradeAmount, setTradeAmount] = useState("");
  const [isTrading, setIsTrading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = useState<{
    approvalGas: bigint;
    tradeGas: bigint;
    totalGas: bigint;
  } | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (error) {
        console.error("Failed to fetch ETH price:", error);
      }
    };
    fetchEthPrice();
  }, []);

  useEffect(() => {
    const updateGasEstimate = async () => {
      if (!tradeAmount || !address) {
        setGasEstimate(null);
        return;
      }

      try {
        const estimate = await contracts.estimateTradeGas(
          isBuying,
          tradeAmount
        );
        setGasEstimate(estimate);
      } catch (error) {
        console.error("Failed to estimate gas:", error);
        setGasEstimate(null);
      }
    };

    updateGasEstimate();
  }, [tradeAmount, isBuying, address]);

  const formatUsdValue = (ethAmount: bigint): string => {
    if (!ethPrice) return "...";
    const ethValue = parseFloat(formatEther(ethAmount));
    return (ethValue * ethPrice).toFixed(2);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendAmount || !recipientAddress) return;

    try {
      await storeUSDC(sendAmount);
      console.log(useWalletStore.getState().isConnected, "acc");
      setSendAmount("");
      setRecipientAddress("");
    } catch (error) {
      console.error("Failed to send USDC:", error);
    }
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeAmount || !address) return;

    setIsTrading(true);
    setTradeError(null);

    try {
      const amount = parseFloat(tradeAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (isBuying && parseFloat(usdcBalance) < amount) {
        throw new Error("Insufficient USDC balance");
      }
      if (!isBuying && parseFloat(gigBalance) < amount) {
        throw new Error("Insufficient GigCoin balance");
      }

      if (isBuying) {
        setIsApproving(true);
        try {
          await contracts.approveToken(
            "USDC",
            GIGFI_TOKEN_ADDRESS,
            parseUnits(tradeAmount, 6)
          );
        } catch (error) {
          if (
            error instanceof Error &&
            !error.message.includes("user rejected")
          ) {
            throw error;
          }
          return;
        } finally {
          setIsApproving(false);
        }

        await contracts.buyGigCoin(tradeAmount);
      } else {
        setIsApproving(true);
        try {
          await contracts.approveToken(
            "GIGFI",
            GIGFI_TOKEN_ADDRESS,
            parseUnits(tradeAmount, 18)
          );
        } catch (error) {
          if (
            error instanceof Error &&
            !error.message.includes("user rejected")
          ) {
            throw error;
          }
          return;
        } finally {
          setIsApproving(false);
        }

        await contracts.buyGigCoin(tradeAmount);
      }

      await updateBalance();
      setTradeAmount("");
    } catch (error) {
      console.error("Trade failed:", error);
      setTradeError(
        error instanceof Error
          ? error.message
          : "Trade failed. Please try again."
      );
    } finally {
      setIsTrading(false);
    }
  };

  const isConnected = useWalletStore.getState().isConnected;
  console.log(isConnected, "isConnected");

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Balance Overview</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-400">USDC Balance</p>
                <TokenImport type="token" />
              </div>
              <p className="text-3xl font-bold text-white">${usdcBalance}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-400">GigCoin Balance</p>
                <TokenImport type="token" />
              </div>
              <p className="text-3xl font-bold text-white">{gigBalance} GIG</p>
              <p className="text-sm text-green-400">
                ≈ ${(parseFloat(gigBalance) * 0.01).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="grid md:grid-cols-3 gap-8">
            <GigCoinPurchase />
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowUpFromLine className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-medium text-white">Send</h3>
              </div>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0x..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.000001"
                    min="0"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !sendAmount || !recipientAddress}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Send USDC"}
                </button>
              </form>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowDownToLine className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-medium text-white">Receive</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg break-all">
                  <p className="text-sm text-gray-400 mb-1">Your Address</p>
                  <p className="text-white font-mono">{address}</p>
                </div>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  {showQR ? "Hide" : "Show"} QR Code
                </button>
                {showQR && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG value={address || ""} size={200} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {
          isConnected === false &&(
            <p className="capitalize">connect your wallet or sign up to a new one and add extension to your browser</p>
          )
        }

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">
              Recent Transactions
            </h2>
          </div>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No transactions yet
              </p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 bg-gray-700 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400">
                        {transaction.type}
                      </p>
                      <p className="text-lg font-semibold text-white">
                        {transaction.amount}
                      </p>
                      <p className="text-sm text-gray-300">
                        {transaction.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {transaction.date}
                      </p>
                      <p className="text-sm text-gray-300">
                        {transaction.type === "Stored"
                          ? `From: ${transaction.from?.slice(0, 6)}...${transaction.from?.slice(-4)}`
                          : `To: ${transaction.to?.slice(0, 6)}...${transaction.to?.slice(-4)}`}
                      </p>
                      <a
                        href={`https://etherscan.io/tx/${transaction.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 justify-end mt-1"
                      >
                        View on Etherscan
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

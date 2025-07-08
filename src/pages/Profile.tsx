import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import Navbar from "../components/Navbar";
import {
  User,
  TrendingUp,
  Activity,
  DollarSign,
  ArrowDownCircle,
  IndianRupee,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Trade {
  _id: string;
  symbol: string;
  type: "buy" | "sell";
  amount: number;
  price: number;
  total: number;
  profit: number;
  createdAt: string;
}

interface Portfolio {
  _id: string;
  symbol: string;
  amount: number;
  avgPrice: number;
}

interface ProfileData {
  user: {
    username: string;
    email: string;
    balance: number;
    totalProfit: number;
    totalTrades: number;
    createdAt: string;
  };
  trades: Trade[];
  portfolio: Portfolio[];
}

const Profile: React.FC = () => {
  const { user, updateBalance, currency, toggleCurrency, formatCurrency } = useAuth();
  const { prices } = useSocket();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellModal, setSellModal] = useState<{
    portfolio: Portfolio;
    crypto: { symbol: string; name: string; shortName: string };
  } | null>(null);
  const [sellAmount, setSellAmount] = useState("");
  const [sellLoading, setSellLoading] = useState(false);

  const cryptos = [
    { symbol: "bitcoin", name: "Bitcoin", shortName: "BTC" },
    { symbol: "ethereum", name: "Ethereum", shortName: "ETH" },
    { symbol: "cardano", name: "Cardano", shortName: "ADA" },
    { symbol: "polkadot", name: "Polkadot", shortName: "DOT" },
    { symbol: "chainlink", name: "Chainlink", shortName: "LINK" },
    { symbol: "litecoin", name: "Litecoin", shortName: "LTC" },
    { symbol: "bitcoin-cash", name: "Bitcoin Cash", shortName: "BCH" },
    { symbol: "stellar", name: "Stellar", shortName: "XLM" },
    { symbol: "dogecoin", name: "Dogecoin", shortName: "DOGE" },
    { symbol: "polygon", name: "Polygon", shortName: "MATIC" },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://cryptoapp-4ftm.onrender.com/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSellClick = (portfolio: Portfolio) => {
    const crypto = cryptos.find((c) => c.symbol === portfolio.symbol);
    if (crypto) {
      setSellModal({ portfolio, crypto });
      setSellAmount("");
    }
  };

  const handleSell = async () => {
    if (!sellModal || !sellAmount) return;

    const amount = parseFloat(sellAmount);
    if (amount <= 0 || amount > sellModal.portfolio.amount) {
      toast.error("Invalid sell amount");
      return;
    }

    setSellLoading(true);

    try {
      const currentPrice = prices[sellModal.portfolio.symbol]?.usd;
      if (!currentPrice) {
        throw new Error("Price not available");
      }

      const token = localStorage.getItem("token");
      const response = await fetch("https://cryptoapp-4ftm.onrender.com/api/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: sellModal.portfolio.symbol,
          type: "sell",
          amount,
          price: currentPrice,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      updateBalance(data.balance);

      // Refresh profile data
      await fetchProfile();

      setSellModal(null);
      setSellAmount("");
      toast.success("Sell order executed successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sell failed");
    } finally {
      setSellLoading(false);
    }
  };

  const getCryptoInfo = (symbol: string) => {
    return cryptos.find((c) => c.symbol === symbol);
  };

  const getCurrentValue = (portfolio: Portfolio) => {
    const currentPrice = prices[portfolio.symbol]?.usd || 0;
    return portfolio.amount * currentPrice;
  };

  const getProfitLoss = (portfolio: Portfolio) => {
    const currentValue = getCurrentValue(portfolio);
    const investedValue = portfolio.amount * portfolio.avgPrice;
    return currentValue - investedValue;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-400">
            Failed to load profile data
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          
          {/* Add Currency Toggle Button */}
          <button 
            onClick={toggleCurrency} 
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            {currency === 'USD' ? (
              <>
                <DollarSign className="h-4 w-4" />
                <span>USD</span>
              </>
            ) : (
              <>
                <IndianRupee className="h-4 w-4" />
                <span>INR</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Current Balance</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(user?.balance || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Total Profit</p>
                <p
                  className={`text-2xl font-bold ${
                    profileData?.user.totalProfit >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {formatCurrency(profileData?.user.totalProfit || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Total Trades</p>
                <p className="text-2xl font-bold text-white">
                  {profileData.user.totalTrades}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <User className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Member Since</p>
                <p className="text-lg font-bold text-white">
                  {new Date(profileData.user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Portfolio Holdings */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              Current Holdings
            </h2>
            <div className="space-y-4">
              {profileData?.portfolio.length === 0 ? (
                <p className="text-gray-400">No holdings yet</p>
              ) : (
                profileData?.portfolio.map((holding) => {
                  const crypto = getCryptoInfo(holding.symbol);
                  const currentValue = getCurrentValue(holding);
                  const profitLoss = getProfitLoss(holding);
                  const profitLossPercentage =
                    (profitLoss / (holding.amount * holding.avgPrice)) * 100;

                  return (
                    <div
                      key={holding._id}
                      className="p-4 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {crypto?.shortName.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {crypto?.name}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {crypto?.shortName}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSellClick(holding)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors"
                        >
                          <ArrowDownCircle className="h-3 w-3" />
                          <span>Sell</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Amount</p>
                          <p className="text-white font-semibold">
                            {holding.amount.toFixed(4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Avg Price</p>
                          <p className="text-white font-semibold">
                            {formatCurrency(holding.avgPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Current Value</p>
                          <p className="text-white font-semibold">
                            {formatCurrency(currentValue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">P&L</p>
                          <p
                            className={`font-semibold ${
                              profitLoss >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {profitLoss >= 0 ? "+" : ""}{formatCurrency(profitLoss)}{" "}
                            ({profitLossPercentage.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-5 pb-2">
            <h2 className="text-xl font-bold text-white mb-4">Recent Trades</h2>
            <div className="space-y-4">
              {profileData.trades.length === 0 ? (
                <p className="text-gray-400">No trades yet</p>
              ) : (
                profileData.trades.map((trade) => {
                  const crypto = getCryptoInfo(trade.symbol);
                  const dateTime = formatDateTime(trade.createdAt);

                  return (
                    <div
                      key={trade._id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            trade.type === "buy" ? "bg-green-400" : "bg-red-400"
                          }`}
                        ></div>
                        <div>
                          <p className="text-white font-medium">
                            {crypto?.shortName}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {trade.type.toUpperCase()}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {dateTime.date} at {dateTime.time}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white">{trade.amount.toFixed(4)}</p>
                        <p className="text-gray-400 text-sm">
                          ${trade.total.toFixed(2)}
                        </p>
                        {trade.profit !== 0 && (
                          <p
                            className={`text-xs ${
                              trade.profit >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            P&L: {trade.profit >= 0 ? "+" : ""}$
                            {trade.profit.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sell Modal */}
        {sellModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                Sell {sellModal.crypto.name}
              </h3>

              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  {/* Update modal to use formatCurrency */}
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Available:</span>
                    <span className="text-white">
                      {sellModal.portfolio.amount.toFixed(4)}{" "}
                      {sellModal.crypto.shortName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Current Price:</span>
                    <span className="text-white">
                      {formatCurrency(prices[sellModal.portfolio.symbol]?.usd || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg Buy Price:</span>
                    <span className="text-white">
                      {formatCurrency(sellModal.portfolio.avgPrice)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount to Sell
                  </label>
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    max={sellModal.portfolio.amount}
                    step="0.0001"
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="0.0000"
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>Min: 0.0001</span>
                    <span>Max: {sellModal.portfolio.amount.toFixed(4)}</span>
                  </div>
                </div>

                {sellAmount && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Value:</span>
                      <span className="text-white">
                        {formatCurrency(
                          parseFloat(sellAmount) *
                          (prices[sellModal.portfolio.symbol]?.usd || 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleSell}
                    disabled={
                      sellLoading || !sellAmount || parseFloat(sellAmount) <= 0
                    }
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sellLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                    ) : (
                      "Sell"
                    )}
                  </button>
                  <button
                    onClick={() => setSellModal(null)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

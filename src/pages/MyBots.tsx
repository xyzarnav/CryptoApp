import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import {
  Bot,
  Square,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  DollarSign,
  IndianRupee
} from "lucide-react";
import { toast } from "react-hot-toast";

interface BotTrade {
  type: "buy" | "sell";
  amount: number;
  price: number;
  timestamp: string;
}

interface TradingBot {
  _id: string;
  name: string;
  strategy: string;
  investment: number;
  currentValue: number;
  profit: number;
  isActive: boolean;
  trades: BotTrade[];
  createdAt: string;
}

const MyBots: React.FC = () => {
  const { user, updateBalance, currency, toggleCurrency, formatCurrency } = useAuth();
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [newBot, setNewBot] = useState({
    name: "",
    strategy: "scalping",
    investment: "",
  });

  const strategies = [
    {
      id: "scalping",
      name: "Ethereum Scalping",
      description: "High-frequency trading on small ETH price movements",
      expectedReturn: "5-12%",
      riskLevel: "Medium",
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
    },
    {
      id: "momentum",
      name: "ETH Momentum Trading",
      description: "Follow strong Ethereum price trends and momentum",
      expectedReturn: "8-18%",
      riskLevel: "High",
      icon: <TrendingUp className="h-6 w-6 text-green-400" />,
    },
    {
      id: "mean_reversion",
      name: "ETH Mean Reversion",
      description: "Trade on Ethereum price reversals to the mean",
      expectedReturn: "3-8%",
      riskLevel: "Low",
      icon: <Activity className="h-6 w-6 text-blue-400" />,
    },
  ];

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://cryptoapp-4ftm.onrender.com/api/bots", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBots(data);
      }
    } catch (error) {
      console.error("Error fetching bots:", error);
    } finally {
      setLoading(false);
    }
  };

  const createBot = async () => {
    if (!newBot.name || !newBot.investment) {
      toast.error("Please fill in all fields");
      return;
    }

    const investment = parseFloat(newBot.investment);
    if (investment < 100) {
      toast.error("Minimum investment is $100");
      return;
    }

    if (investment > (user?.balance || 0)) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://cryptoapp-4ftm.onrender.com/api/bots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newBot.name,
          strategy: newBot.strategy,
          investment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      updateBalance(data.balance);
      setBots([data.bot, ...bots]);
      setShowCreateBot(false);
      setNewBot({ name: "", strategy: "scalping", investment: "" });
      toast.success("Trading bot created successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create bot"
      );
    }
  };

  const stopBot = async (botId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://cryptoapp-4ftm.onrender.com/api/bots/${botId}/stop`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      updateBalance(data.balance);
      setBots(
        bots.map((bot) =>
          bot._id === botId ? { ...bot, isActive: false } : bot
        )
      );
      toast.success("Bot stopped and funds returned to your balance");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to stop bot"
      );
    }
  };

  const getStrategyInfo = (strategyId: string) => {
    return strategies.find((s) => s.id === strategyId) || strategies[0];
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

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const activeBot = bots.find((bot) => bot.isActive);
  const hasActiveBot = !!activeBot;

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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              My Trading Bots
            </h1>
            <p className="text-gray-300">
              Automated Ethereum trading strategies
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-3 sm:mt-0">
            {/* Currency Toggle Button */}
            <button 
              onClick={toggleCurrency} 
              className="flex items-center space-x-1 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition-colors"
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
            
            {!hasActiveBot && (
              <button
                onClick={() => setShowCreateBot(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Create Bot</span>
              </button>
            )}
          </div>
        </div>

        {/* Ethereum Focus Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Ethereum-Exclusive Trading
              </h2>
              <p className="text-blue-100 mb-4 sm:mb-0">
                Our bots are specifically optimized for Ethereum trading,
                leveraging advanced algorithms to capitalize on ETH market
                movements and volatility patterns.
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">ETH</div>
              <div className="text-blue-100 text-sm">Only</div>
            </div>
          </div>
        </div>

        {/* Active Bot */}
        {activeBot && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Active Bot</h2>
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-green-500">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {activeBot.name}
                    </h3>
                    <p className="text-gray-400">
                      {getStrategyInfo(activeBot.strategy).name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-400 text-xs">
                        Running for {calculateDuration(activeBot.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Investment
                  </div>
                  <div className="text-white font-bold text-lg sm:text-xl">
                    {formatCurrency(activeBot.investment)}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Current Value
                  </div>
                  <div className="text-white font-bold text-lg sm:text-xl">
                    {formatCurrency(activeBot.currentValue)}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Profit/Loss
                  </div>
                  <div
                    className={`font-bold text-lg sm:text-xl ${
                      activeBot.profit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {activeBot.profit >= 0 ? "+" : ""}{formatCurrency(activeBot.profit)}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
                  <div className="text-gray-400 text-xs sm:text-sm">ROI</div>
                  <div
                    className={`font-bold text-lg sm:text-xl ${
                      activeBot.profit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {((activeBot.profit / activeBot.investment) * 100).toFixed(
                      2
                    )}
                    %
                  </div>
                </div>
              </div>

              {/* Recent Trades */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Recent Trades</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {activeBot.trades
                    .slice(-5)
                    .reverse()
                    .map((trade, index) => {
                      const dateTime = formatDateTime(trade.timestamp);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-700 rounded p-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                trade.type === "buy"
                                  ? "bg-green-400"
                                  : "bg-red-400"
                              }`}
                            ></div>
                            <span className="text-white text-sm font-medium">
                              {trade.type.toUpperCase()}{" "}
                              {trade.amount.toFixed(4)} ETH
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-white text-sm">
                              {formatCurrency(trade.price)}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {dateTime.time}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {activeBot.trades.length === 0 && (
                    <div className="text-gray-400 text-center py-4">
                      No trades yet
                    </div>
                  )}
                </div>
              </div>

              {/* Stop Bot Button */}
              <button
                onClick={() => stopBot(activeBot._id)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Square className="h-4 w-4" />
                <span>Stop Bot & Withdraw Funds</span>
              </button>
            </div>
          </div>
        )}

        {/* Create Bot Modal */}
        {showCreateBot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">
                Create Trading Bot
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    value={newBot.name}
                    onChange={(e) =>
                      setNewBot({ ...newBot, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="My ETH Trading Bot"
                  />
                </div>

                <div>
                  <label htmlFor="strategy-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Strategy
                  </label>
                  <select
                    id="strategy-select"
                    value={newBot.strategy}
                    onChange={(e) =>
                      setNewBot({ ...newBot, strategy: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    {strategies.map((strategy) => (
                      <option key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 p-3 bg-gray-700 rounded-md">
                    <div className="text-sm text-gray-300">
                      {getStrategyInfo(newBot.strategy).description}
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-gray-400">
                        Expected Return:{" "}
                        {getStrategyInfo(newBot.strategy).expectedReturn}
                      </span>
                      <span
                        className={`${
                          getStrategyInfo(newBot.strategy).riskLevel === "Low"
                            ? "text-green-400"
                            : getStrategyInfo(newBot.strategy).riskLevel ===
                              "Medium"
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        Risk: {getStrategyInfo(newBot.strategy).riskLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Investment Amount
                  </label>
                  <input
                    type="number"
                    value={newBot.investment}
                    onChange={(e) =>
                      setNewBot({ ...newBot, investment: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="100"
                    min="100"
                  />
                  <div className="mt-1 text-xs text-gray-400">
                    Minimum: {formatCurrency(100)} | Available: {formatCurrency(user?.balance || 0)}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={createBot}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Create Bot
                </button>
                <button
                  onClick={() => setShowCreateBot(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bot History */}
        {bots.length > 0 && (
          <div className="mb-10 pb-5">
            <h2 className="text-xl font-bold text-white mb-4">Bot History</h2>
            <div className="space-y-4">
              {bots.map((bot) => {
                const strategyInfo = getStrategyInfo(bot.strategy);
                const startDateTime = formatDateTime(bot.createdAt);
                const duration = calculateDuration(
                  bot.createdAt,
                  bot.isActive ? undefined : bot.createdAt
                );

                return (
                  <div
                    key={bot._id}
                    className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            bot.isActive ? "bg-green-600" : "bg-gray-600"
                          }`}
                        >
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">
                            {bot.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {strategyInfo.name}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>
                              Started: {startDateTime.date} at{" "}
                              {startDateTime.time}
                            </span>
                            <span>Duration: {duration}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-gray-400 text-xs">
                            Investment
                          </div>
                          <div className="text-white font-semibold">
                            {formatCurrency(bot.investment)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">
                            Final Value
                          </div>
                          <div className="text-white font-semibold">
                            {formatCurrency(bot.currentValue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Profit</div>
                          <div
                            className={`font-semibold ${
                              bot.profit >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {bot.profit >= 0 ? "+" : ""}{formatCurrency(bot.profit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Bots State */}
        {bots.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Trading Bots Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first Ethereum trading bot to start automated trading
            </p>
            <button
              onClick={() => setShowCreateBot(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Your First Bot
            </button>
          </div>
        )}

        {/* One Bot Limitation Notice */}
        {hasActiveBot && (
          <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-400" />
              <span className="text-blue-400 font-medium">Bot Limitation</span>
            </div>
            <p className="text-gray-300 mt-2">
              You can only run one trading bot at a time. Stop your current bot
              to create a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBots;

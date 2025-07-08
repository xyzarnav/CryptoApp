import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import Navbar from "../components/Navbar";
import {
  Target,
  TrendingUp,
  BarChart3,
  DollarSign,
  IndianRupee,
  Activity,
  Square,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-hot-toast";

interface ArbitrageInvestment {
  _id: string;
  strategy: string;
  amount: number;
  profit: number;
  status: "active" | "completed";
  createdAt: string;
  completedAt?: string; // Add optional completedAt field
}

interface ProfitDataPoint {
  time: string;
  profit: number;
  cumulative: number;
}

const Arbitrage: React.FC = () => {
  const { user, updateBalance, currency, toggleCurrency, formatCurrency } = useAuth();
  const { isConnected } = useSocket();
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [arbitrages, setArbitrages] = useState<ArbitrageInvestment[]>([]);
  const [profitHistory, setProfitHistory] = useState<ProfitDataPoint[]>([]);
  const [sessionStats, setSessionStats] = useState({
    highProfit: 0,
    lowProfit: 0,
    maxTarget: 0,
    targetReached: false,
  });

  const strategies = [
    {
      id: "spatial",
      name: "Spatial Arbitrage",
      description: "Exploit price differences between exchanges",
      icon: <Target className="h-8 w-8 text-blue-400" />,
      expectedReturn: "3-7%",
      riskLevel: "Medium",
      minInvestment: 100,
      maxTarget: 15, // 15% max target
    },
    {
      id: "statistical",
      name: "Statistical Arbitrage",
      description: "Use mean-reversion and correlations",
      icon: <BarChart3 className="h-8 w-8 text-purple-400" />,
      expectedReturn: "2-5%",
      riskLevel: "Low",
      minInvestment: 50,
      maxTarget: 10, // 10% max target
    },
    {
      id: "pattern",
      name: "Pattern-Based Arbitrage",
      description: "Recognize patterns and simulate trades",
      icon: <TrendingUp className="h-8 w-8 text-green-400" />,
      expectedReturn: "4-9%",
      riskLevel: "High",
      minInvestment: 200,
      maxTarget: 20, // 20% max target
    },
  ];

  useEffect(() => {
    fetchArbitrages();
    const interval = setInterval(fetchArbitrages, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const activeArbitrage = arbitrages.find((arb) => arb.status === "active");
    if (activeArbitrage) {
      updateProfitHistory(activeArbitrage);
      updateSessionStats(activeArbitrage);
    }
  }, [arbitrages]);

  const fetchArbitrages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://cryptoapp-4ftm.onrender.com/api/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setArbitrages(data.arbitrages || []);
      }
    } catch (error) {
      console.error("Error fetching arbitrages:", error);
    }
  };

  const updateProfitHistory = (arbitrage: ArbitrageInvestment) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    setProfitHistory((prev) => {
      const newPoint = {
        time: timeString,
        profit: arbitrage.profit,
        cumulative: arbitrage.amount + arbitrage.profit,
      };

      const updated = [...prev, newPoint];
      // Keep only last 50 data points
      return updated.slice(-50);
    });
  };

  const updateSessionStats = (arbitrage: ArbitrageInvestment) => {
    const strategy = strategies.find((s) => s.name === arbitrage.strategy);
    const profitPercentage = (arbitrage.profit / arbitrage.amount) * 100;
    const maxTarget = strategy?.maxTarget || 10;

    setSessionStats((prev) => ({
      highProfit: Math.max(prev.highProfit, arbitrage.profit),
      lowProfit: Math.min(prev.lowProfit, arbitrage.profit),
      maxTarget,
      targetReached: profitPercentage >= maxTarget,
    }));
  };

  const handleInvest = async () => {
    if (!selectedStrategy || !investmentAmount) return;

    const strategy = strategies.find((s) => s.id === selectedStrategy);
    const amount = parseFloat(investmentAmount);

    if (!strategy || amount < strategy.minInvestment) {
      toast.error(
        `Minimum investment for ${strategy?.name} is $${strategy?.minInvestment}`
      );
      return;
    }

    if (amount > (user?.balance || 0)) {
      toast.error("Insufficient balance");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://cryptoapp-4ftm.onrender.com/api/arbitrage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            strategy: strategy.name,
            amount,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      updateBalance(data.balance);
      setInvestmentAmount("");
      setSelectedStrategy(null);
      setProfitHistory([]); // Reset profit history for new strategy
      setSessionStats({
        highProfit: 0,
        lowProfit: 0,
        maxTarget: strategy.maxTarget,
        targetReached: false,
      });
      fetchArbitrages(); // Refresh the list
      toast.success(
        "Investment successful! Your arbitrage strategy is now active."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Investment failed");
    } finally {
      setLoading(false);
    }
  };

  const stopArbitrage = async (arbitrageId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://cryptoapp-4ftm.onrender.com/api/arbitrage/${arbitrageId}/stop`,
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
      fetchArbitrages();
      toast.success(
        "Arbitrage strategy stopped and funds returned to your balance"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to stop arbitrage"
      );
    }
  };

  const activeArbitrage = arbitrages.find((arb) => arb.status === "active");
  const hasActiveArbitrage = !!activeArbitrage;
  const activeStrategy = activeArbitrage
    ? strategies.find((s) => s.name === activeArbitrage.strategy)
    : null;

  const getStatusColor = () => {
    if (!activeArbitrage) return "text-gray-400";
    const profitPercentage =
      (activeArbitrage.profit / activeArbitrage.amount) * 100;
    if (sessionStats.targetReached) return "text-green-400";
    if (profitPercentage > 0) return "text-blue-400";
    return "text-yellow-400";
  };

  const getStatusText = () => {
    if (!activeArbitrage) return "No Active Strategy";
    if (sessionStats.targetReached) return "Target Reached";
    return "Running";
  };

  // Add helper function to calculate duration
  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Add this helper function for formatting dates
const formatDate = (date: string) => {
  const d = new Date(date);
  // Use shorter date format on mobile
  if (window.innerWidth < 768) {
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return d.toLocaleString();
};

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Arbitrage Strategies
              </h1>
              <p className="text-gray-300">
                Invest in automated arbitrage strategies to generate passive
                income
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Currency Toggle Button */}
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
              
              <div
                className={`flex items-center space-x-2 ${
                  isConnected ? "text-green-400" : "text-red-400"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-400" : "bg-red-400"
                  }`}
                ></div>
                <span className="text-sm">
                  {isConnected ? "Live" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className={`bg-gray-800 rounded-lg p-6 border transition-all cursor-pointer ${
                selectedStrategy === strategy.id
                  ? "border-blue-500 bg-gray-750"
                  : hasActiveArbitrage
                  ? "border-gray-700 opacity-50 cursor-not-allowed"
                  : "border-gray-700 hover:border-gray-600"
              }`}
              onClick={() =>
                !hasActiveArbitrage && setSelectedStrategy(strategy.id)
              }
            >
              <div className="flex items-center mb-4">
                {strategy.icon}
                <h3 className="text-xl font-semibold text-white ml-3">
                  {strategy.name}
                </h3>
              </div>
              <p className="text-gray-300 mb-4">{strategy.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Expected Return:</span>
                  <span className="text-green-400 font-semibold">
                    {strategy.expectedReturn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span
                    className={`font-semibold ${
                      strategy.riskLevel === "Low"
                        ? "text-green-400"
                        : strategy.riskLevel === "Medium"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {strategy.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Min Investment:</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(strategy.minInvestment)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Target:</span>
                  <span className="text-purple-400 font-semibold">
                    {strategy.maxTarget}%
                  </span>
                </div>
              </div>
              {hasActiveArbitrage && (
                <div className="mt-4 text-center text-gray-400 text-sm">
                  Strategy already running
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Active Strategy Status Panel */}
        {activeArbitrage && activeStrategy && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Active Strategy Status
            </h2>
            <div className="bg-gray-800 rounded-lg p-6 border border-blue-500">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {activeStrategy.icon}
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {activeStrategy.name}
                    </h3>
                    <p className="text-gray-400">
                      {activeStrategy.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center space-x-2 ${getStatusColor()}`}
                  >
                    <Activity className="h-4 w-4 animate-pulse" />
                    <span className="font-medium">{getStatusText()}</span>
                  </div>
                  {sessionStats.targetReached && (
                    <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Target Reached!
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Investment</div>
                  <div className="text-white font-bold text-lg">
                    {formatCurrency(activeArbitrage.amount)}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Current Profit</div>
                  <div
                    className={`font-bold text-lg ${
                      activeArbitrage.profit >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {activeArbitrage.profit >= 0 ? "+" : ""}{formatCurrency(activeArbitrage.profit)}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">ROI</div>
                  <div
                    className={`font-bold text-lg ${
                      activeArbitrage.profit >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {(
                      (activeArbitrage.profit / activeArbitrage.amount) *
                      100
                    ).toFixed(2)}
                    %
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Session High</div>
                  <div className="text-green-400 font-bold text-lg">
                    {formatCurrency(sessionStats.highProfit)}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Session Low</div>
                  <div className="text-red-400 font-bold text-lg">
                    {formatCurrency(sessionStats.lowProfit)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">
                    Progress to Target ({sessionStats.maxTarget}%)
                  </span>
                  <span className="text-white">
                    {Math.min(
                      (activeArbitrage.profit / activeArbitrage.amount) * 100,
                      sessionStats.maxTarget
                    ).toFixed(1)}
                    % / {sessionStats.maxTarget}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      sessionStats.targetReached
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (((activeArbitrage.profit / activeArbitrage.amount) *
                          100) /
                          sessionStats.maxTarget) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Live Profit Chart */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">
                  Live Profit Tracking
                </h4>
                <div className="h-64 bg-gray-700 rounded-lg p-4">
                  {profitHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profitHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="time"
                          stroke="#9CA3AF"
                          fontSize={12}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                          }}
                          formatter={(value: number, name: string) => [
                            formatCurrency(value),
                            name === "profit" ? "Profit" : "Total Value",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={false}
                          name="profit"
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulative"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={false}
                          name="cumulative"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                        <p>Collecting profit data...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Strategy Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => stopArbitrage(activeArbitrage._id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Square className="h-4 w-4" />
                  <span>Stop Strategy & Withdraw</span>
                </button>
                <div className="bg-gray-700 rounded-lg px-4 py-3 text-center">
                  <div className="text-gray-400 text-sm">Total Value</div>
                  <div className="text-white font-bold">
                    {formatCurrency(activeArbitrage.amount + activeArbitrage.profit)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Investment Form */}
        {selectedStrategy && !hasActiveArbitrage && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Investment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {strategies.find((s) => s.id === selectedStrategy)?.name}
                </h3>
                <p className="text-gray-300 mb-4">
                  {
                    strategies.find((s) => s.id === selectedStrategy)
                      ?.description
                  }
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Balance:</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(user?.balance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Minimum Investment:</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(
                        strategies.find((s) => s.id === selectedStrategy)
                          ?.minInvestment || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Target:</span>
                    <span className="text-purple-400 font-semibold">
                      {
                        strategies.find((s) => s.id === selectedStrategy)
                          ?.maxTarget
                      }
                      %
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
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter amount"
                />
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={handleInvest}
                    disabled={loading || !investmentAmount}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Invest Now
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedStrategy(null)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strategy History */}
        {arbitrages.length > 0 && (
          <div className="mb-10 pb-5">
            <h2 className="text-xl font-bold text-white mb-4">
              Strategy History
            </h2>
            <div className="space-y-4">
              {arbitrages
                .filter((arb) => arb.status === "completed")
                .map((arbitrage) => {
                  const strategy = strategies.find(
                    (s) => s.name === arbitrage.strategy
                  );
                  return (
                    <div
                      key={arbitrage._id}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Strategy Info - Left Side */}
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            {strategy?.icon}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-sm md:text-base">
                              {arbitrage.strategy}
                            </h3>
                            <div className="text-gray-400 text-xs md:text-sm space-y-0.5">
                              <div className="flex flex-wrap gap-2">
                                <span>{formatDate(arbitrage.createdAt)}</span>
                                <span className="hidden md:inline">→</span>
                                <span>{arbitrage.completedAt ? formatDate(arbitrage.completedAt) : 'N/A'}</span>
                              </div>
                              {arbitrage.completedAt && (
                                <div className="text-blue-400 font-medium">
                                  {calculateDuration(arbitrage.createdAt, arbitrage.completedAt)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Performance Metrics - Right Side */}
                        <div className="grid grid-cols-3 gap-2 md:gap-4 text-center text-xs md:text-sm border-t md:border-t-0 pt-3 md:pt-0">
                          <div>
                            <div className="text-gray-400">Investment</div>
                            <div className="text-white font-semibold">
                              {formatCurrency(arbitrage.amount)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">Profit</div>
                            <div
                              className={`font-semibold ${
                                arbitrage.profit >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {arbitrage.profit >= 0 ? "+" : ""}
                              {formatCurrency(arbitrage.profit)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">ROI</div>
                            <div
                              className={`font-semibold ${
                                arbitrage.profit >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {((arbitrage.profit / arbitrage.amount) * 100).toFixed(1)}%
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

        {/* No Active Strategy Notice */}
        {!hasActiveArbitrage && arbitrages.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Active Strategies
            </h3>
            <p className="text-gray-400 mb-6">
              Select a strategy above to start your first arbitrage investment
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Arbitrage;

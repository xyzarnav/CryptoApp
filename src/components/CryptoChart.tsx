import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface CryptoChartProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume?: number;
  marketCap?: number;
  history: Array<{ timestamp: number; price: number; volume: number }>;
  onTimeframeChange?: (timeframe: string) => void;
}

const CryptoChart: React.FC<CryptoChartProps> = ({
  symbol,
  name,
  price,
  change,
  volume,
  marketCap,
  history,
  onTimeframeChange,
}) => {
  const { formatCurrency } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState("1H");
  const [showVolume, setShowVolume] = useState(false);
  const [chartData, setChartData] = useState<
    Array<{ time: string; price: number; volume: number }>
  >([]);

  const timeframes = [
    { id: "5M", label: "5M", points: 30 },
    { id: "15M", label: "15M", points: 40 },
    { id: "1H", label: "1H", points: 60 },
    { id: "4H", label: "4H", points: 48 },
    { id: "1D", label: "1D", points: 24 },
    { id: "1W", label: "1W", points: 168 },
    { id: "1M", label: "1M", points: 30 },
    { id: "1Y", label: "1Y", points: 52 }, // Weekly points for a year
  ];

  useEffect(() => {
    generateTimeframeData();
  }, [selectedTimeframe, history, price]);

  const generateTimeframeData = () => {
    const timeframe = timeframes.find((t) => t.id === selectedTimeframe);
    if (!timeframe) return;

    const now = Date.now();
    const data = [];

    // Generate realistic price data based on current price and timeframe
    const basePrice = price;
    const volatility = getVolatilityForTimeframe(selectedTimeframe);

    for (let i = 0; i < timeframe.points; i++) {
      const timeAgo = getTimeAgoForPoint(
        selectedTimeframe,
        i,
        timeframe.points
      );
      const timestamp = now - timeAgo;

      // Generate price with some randomness but trending toward current price
      const randomFactor = (Math.random() - 0.5) * volatility;
      const trendFactor = (i / timeframe.points) * 0.1; // Slight trend toward current price
      const pointPrice = basePrice * (1 + randomFactor + trendFactor);

      data.push({
        time: formatTimeForTimeframe(timestamp, selectedTimeframe),
        price: pointPrice,
        volume: Math.random() * 1000000 + 500000,
      });
    }

    // Ensure the last point is close to the current price
    if (data.length > 0) {
      data[data.length - 1].price = basePrice;
    }

    setChartData(data);
  };

  const getVolatilityForTimeframe = (timeframe: string): number => {
    const volatilityMap: { [key: string]: number } = {
      "5M": 0.02,
      "15M": 0.03,
      "1H": 0.05,
      "4H": 0.08,
      "1D": 0.12,
      "5D": 0.15,
      "1M": 0.25,
      "6M": 0.4,
      "1Y": 0.6,
      MAX: 0.8,
    };
    return volatilityMap[timeframe] || 0.05;
  };

  const getTimeAgoForPoint = (
    timeframe: string,
    index: number,
    totalPoints: number
  ): number => {
    const timeMultipliers: { [key: string]: number } = {
      "5M": 5 * 60 * 1000,
      "15M": 15 * 60 * 1000,
      "1H": 60 * 60 * 1000,
      "4H": 4 * 60 * 60 * 1000,
      "1D": 24 * 60 * 60 * 1000,
      "5D": (5 * 24 * 60 * 60 * 1000) / totalPoints,
      "1M": (30 * 24 * 60 * 60 * 1000) / totalPoints,
      "6M": (6 * 30 * 24 * 60 * 60 * 1000) / totalPoints,
      "1Y": (365 * 24 * 60 * 60 * 1000) / totalPoints,
      MAX: (3 * 365 * 24 * 60 * 60 * 1000) / totalPoints,
    };

    const multiplier = timeMultipliers[timeframe] || 60 * 60 * 1000;
    return (totalPoints - index) * multiplier;
  };

  // Add function to calculate X-axis interval
  const getXAxisInterval = (timeframe: string): number => {
    const intervalMap: { [key: string]: number } = {
      "5M": 4,
      "15M": 5,
      "1H": 6,
      "4H": 6,
      "1D": 3,
      "1W": 24,
      "1M": 5,
      "1Y": 6,
    };
    return intervalMap[timeframe] || 4;
  };

  const formatTimeForTimeframe = (
    timestamp: number,
    timeframe: string
  ): string => {
    const date = new Date(timestamp);

    switch (timeframe) {
      case "5M":
      case "15M":
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      case "1H":
      case "4H":
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      case "1D":
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "1W":
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "1M":
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "1Y":
        return date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
      default:
        return date.toLocaleTimeString();
    }
  };

  // Update formatPrice function to use formatCurrency
  const formatPrice = (value: number) => formatCurrency(value);

  // Update formatVolume function to use formatCurrency
  const formatVolume = (value: number) => {
    if (value >= 1e9) return formatCurrency(value / 1e9) + "B";
    if (value >= 1e6) return formatCurrency(value / 1e6) + "M";
    if (value >= 1e3) return formatCurrency(value / 1e3) + "K";
    return formatCurrency(value);
  };

  const isPositive = change >= 0;

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    onTimeframeChange?.(timeframe);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">{name}</h2>
          <p className="text-gray-400 text-sm uppercase">{symbol}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {formatCurrency(price)}
          </div>
          <div
            className={`flex items-center justify-end text-sm ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {change.toFixed(2)}% (24h)
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-3">
          <p className="text-gray-400 text-xs">24h Volume</p>
          <p className="text-white font-semibold text-sm">
            {formatVolume(volume || 0)}
          </p>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
          <p className="text-gray-400 text-xs">Market Cap</p>
          <p className="text-white font-semibold text-sm">
            {formatVolume(marketCap || 0)}
          </p>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
          <p className="text-gray-400 text-xs">24h High</p>
          <p className="text-white font-semibold text-sm">
            {formatCurrency(price * 1.05)}
          </p>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
          <p className="text-gray-400 text-xs">24h Low</p>
          <p className="text-white font-semibold text-sm">
            {formatCurrency(price * 0.95)}
          </p>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-1">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe.id}
              onClick={() => handleTimeframeChange(timeframe.id)}
              className={`px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedTimeframe === timeframe.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {timeframe.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowVolume(!showVolume)}
          className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
            showVolume
              ? "bg-purple-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <BarChart3 className="h-3 w-3" />
          <span>Volume</span>
        </button>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              fontSize={11}
              tickMargin={10}
              interval={getXAxisInterval(selectedTimeframe)}
              angle={selectedTimeframe === "1Y" ? -45 : 0}
              textAnchor={selectedTimeframe === "1Y" ? "end" : "middle"}
              height={50}
              tickFormatter={(time) => {
                if (selectedTimeframe === "1Y") {
                  return time.split(" ")[0]; // Show only month
                }
                return time;
              }}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={11}
              tickMargin={5}
              domain={["auto", "auto"]}
              tickFormatter={formatPrice}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "#9CA3AF", marginBottom: "4px" }}
              formatter={(value: number, name: string) => [
                name === "price" ? formatPrice(value) : formatVolume(value),
                name === "price" ? "Price" : "Volume",
              ]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "#10B981" : "#EF4444"}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                stroke: isPositive ? "#10B981" : "#EF4444",
                strokeWidth: 2,
              }}
            />
            {showVolume && (
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#8B5CF6"
                strokeWidth={1.5}
                dot={false}
                opacity={0.5}
                yAxisId="volume"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Technical Indicators */}
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="bg-gray-700 rounded px-3 py-1">
          <span className="text-gray-400 text-xs">RSI: </span>
          <span className="text-white text-xs font-medium">65.4</span>
        </div>
        <div className="bg-gray-700 rounded px-3 py-1">
          <span className="text-gray-400 text-xs">MACD: </span>
          <span className="text-green-400 text-xs font-medium">+12.5</span>
        </div>
        <div className="bg-gray-700 rounded px-3 py-1">
          <span className="text-gray-400 text-xs">MA(20): </span>
          <span className="text-white text-xs font-medium">
            {formatPrice(price * 0.98)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CryptoChart;

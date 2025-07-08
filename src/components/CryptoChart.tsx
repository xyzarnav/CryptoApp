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
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [showVolume, setShowVolume] = useState(false);
  const [chartData, setChartData] = useState<
    Array<{ time: string; price: number; volume: number }>
  >([]);

  // Only 3 timeframes: 1D, 1M, 1Y
  const timeframes = [
    { id: "1D", label: "1D", points: 24 },   // 24 hours
    { id: "1M", label: "1M", points: 30 },   // 30 days
    { id: "1Y", label: "1Y", points: 52 },   // 52 weeks
  ];

  useEffect(() => {
    generateTimeframeData();
  }, [selectedTimeframe, history, price]);

  const generateTimeframeData = () => {
    const timeframe = timeframes.find((t) => t.id === selectedTimeframe);
    if (!timeframe) return;

    const now = Date.now();
    const data = [];

    const basePrice = price;
    const volatility = getVolatilityForTimeframe(selectedTimeframe);

    for (let i = 0; i < timeframe.points; i++) {
      const timeAgo = getTimeAgoForPoint(
        selectedTimeframe,
        i,
        timeframe.points
      );
      const timestamp = now - timeAgo;

      const randomFactor = (Math.random() - 0.5) * volatility;
      const trendFactor = (i / timeframe.points) * 0.1;
      const pointPrice = basePrice * (1 + randomFactor + trendFactor);

      data.push({
        time: formatTimeForTimeframe(timestamp, selectedTimeframe),
        price: pointPrice,
        volume: Math.random() * 1000000 + 500000,
      });
    }

    if (data.length > 0) {
      data[data.length - 1].price = basePrice;
    }

    setChartData(data);
  };

  // Only keep volatility for 1D, 1M, 1Y
  const getVolatilityForTimeframe = (timeframe: string): number => {
    const volatilityMap: { [key: string]: number } = {
      "1D": 0.12,
      "1M": 0.25,
      "1Y": 0.6,
    };
    return volatilityMap[timeframe] || 0.05;
  };

  // Only keep time multipliers for 1D, 1M, 1Y
  const getTimeAgoForPoint = (
    timeframe: string,
    index: number,
    totalPoints: number
  ): number => {
    const timeMultipliers: { [key: string]: number } = {
      "1D": (24 * 60 * 60 * 1000) / totalPoints, // 1 day in ms divided by points (hourly)
      "1M": (30 * 24 * 60 * 60 * 1000) / totalPoints, // 1 month in ms divided by points (daily)
      "1Y": (365 * 24 * 60 * 60 * 1000) / totalPoints, // 1 year in ms divided by points (weekly)
    };
    const multiplier = timeMultipliers[timeframe] || 60 * 60 * 1000;
    return (totalPoints - index) * multiplier;
  };

  // X-axis interval for 3 timeframes
  const getXAxisInterval = (timeframe: string): number => {
    const intervalMap: { [key: string]: number } = {
      "1D": 3,
      "1M": 5,
      "1Y": 6,
    };
    return intervalMap[timeframe] || 3;
  };

  // Format time for 3 timeframes
  const formatTimeForTimeframe = (
    timestamp: number,
    timeframe: string
  ): string => {
    const date = new Date(timestamp);
    switch (timeframe) {
      case "1D":
        return date.getHours().toString().padStart(2, "0") + ":00";
      case "1M":
        return `${date.getDate()}/${date.getMonth() + 1}`;
      case "1Y":
        return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
      default:
        return "";
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
          {/* <p className="text-gray-400 text-xs">24h Volume</p> */}
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
          {/* <span>Volume</span> */}
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
              
         
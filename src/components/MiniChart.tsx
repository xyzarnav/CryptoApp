import React, { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface MiniChartProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  onClose: () => void;
}

const MiniChart: React.FC<MiniChartProps> = ({
  symbol,
  name,
  price,
  change,
  onClose,
}) => {
  interface ChartPoint {
    time: number;
    price: number;
  }
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const { formatCurrency } = useAuth();

  useEffect(() => {
    generateMiniChartData();
  }, [price]);

  const generateMiniChartData = () => {
    const data = [];
    const basePrice = price;
    const volatility = 0.05;

    for (let i = 0; i < 24; i++) {
      const randomFactor = (Math.random() - 0.5) * volatility;
      const trendFactor = (i / 24) * 0.02;
      const pointPrice = basePrice * (1 + randomFactor + trendFactor);

      data.push({
        time: i,
        price: pointPrice,
      });
    }

    // Ensure the last point is the current price
    if (data.length > 0) {
      data[data.length - 1].price = basePrice;
    }

    setChartData(data);
  };

  const isPositive = change >= 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <p className="text-gray-400 text-sm uppercase">{symbol}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-2xl font-bold text-white">
            {formatCurrency(price)}
          </div>
          <div
            className={`text-sm ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(2)}% (24h)
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "#10B981" : "#EF4444"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-gray-400 text-xs">24h High</div>
            <div className="text-white font-semibold">
              {formatCurrency(price * 1.05)}
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-gray-400 text-xs">24h Low</div>
            <div className="text-white font-semibold">
              {formatCurrency(price * 0.95)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniChart;

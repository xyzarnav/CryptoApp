import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface CryptoCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  onTrade: (
    symbol: string,
    type: "buy" | "sell",
    amount: number,
    price: number
  ) => void;
}

const CryptoCard: React.FC<CryptoCardProps> = ({
  symbol,
  name,
  price,
  change,
  onTrade,
}) => {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [showTradeForm, setShowTradeForm] = useState(false);
  const { formatCurrency } = useAuth();

  const handleTrade = () => {
    if (amount && parseFloat(amount) > 0) {
      onTrade(symbol, tradeType, parseFloat(amount), price);
      setAmount("");
      setShowTradeForm(false);
    }
  };

  const isPositive = change >= 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <p className="text-gray-400 text-sm uppercase">{symbol}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {formatCurrency(price)}
          </div>
          <div
            className={`flex items-center text-sm ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {change.toFixed(2)}%
          </div>
        </div>
      </div>

      {!showTradeForm ? (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setTradeType("buy");
              setShowTradeForm(true);
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors"
          >
            <ArrowUpCircle className="h-4 w-4" />
            <span>Buy</span>
          </button>
          <button
            onClick={() => {
              setTradeType("sell");
              setShowTradeForm(true);
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors"
          >
            <ArrowDownCircle className="h-4 w-4" />
            <span>Sell</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setTradeType("buy")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                tradeType === "buy"
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTradeType("sell")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                tradeType === "sell"
                  ? "bg-red-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Sell
            </button>
          </div>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <div className="text-sm text-gray-400">
            Total: {formatCurrency((parseFloat(amount) || 0) * price)}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleTrade}
              className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
                tradeType === "buy"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {tradeType === "buy" ? "Buy" : "Sell"}
            </button>
            <button
              onClick={() => setShowTradeForm(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoCard;

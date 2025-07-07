import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import Navbar from "../components/Navbar";
import CryptoChart from "../components/CryptoChart";
import CryptoSelector from "../components/CryptoSelector";
import CryptoCard from "../components/CryptoCard";
import MiniChart from "../components/MiniChart";
import { toast } from "react-hot-toast";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  DollarSign,
  IndianRupee,
} from "lucide-react";

const Dashboard: React.FC = () => {
  const { user, updateBalance, currency, toggleCurrency, formatCurrency } = useAuth();
  const { prices, priceHistory, isConnected } = useSocket();
  const [selectedCrypto, setSelectedCrypto] = useState("ethereum");
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [showMiniChart, setShowMiniChart] = useState<string | null>(null);
  const [showAllCoins, setShowAllCoins] = useState(false); // State to toggle visibility
  const [showAllMarkets, setShowAllMarkets] = useState(false); // State to toggle visibility in All Markets section

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

  const selectedCryptoData = cryptos.find((c) => c.symbol === selectedCrypto);
  const selectedPrice = prices[selectedCrypto];
  const selectedHistory = priceHistory[selectedCrypto] || [];

  const handleTrade = async (
    symbol: string,
    type: "buy" | "sell",
    amount: number,
    price: number
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol, type, amount, price }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      updateBalance(data.balance);

      toast.success(
        `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } order executed successfully!`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Trade failed");
    }
  };

  const handleQuickTrade = async () => {
    if (!tradeAmount || !selectedPrice) return;

    const amount = parseFloat(tradeAmount);
    if (amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    await handleTrade(selectedCrypto, tradeType, amount, selectedPrice.usd);
    setTradeAmount("");
  };

  const totalValue = parseFloat(tradeAmount) * (selectedPrice?.usd || 0);

  const handleMiniChartOpen = (symbol: string) => {
    setShowMiniChart(symbol);
  };

  const handleMiniChartClose = () => {
    setShowMiniChart(null);
  };

  // Add a helper to determine how many coins to show based on screen size
  const getVisibleCount = () => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      // Mobile: show 5 by default, else all
      return showAllCoins ? cryptos.length : 5;
    }
    // Desktop/tablet: show 3 by default, else all
    return showAllCoins ? cryptos.length : 3;
  };

  // Add a helper to determine how many coins to show in All Markets (mobile only)
  const getAllMarketsVisibleCount = () => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      return showAllMarkets ? cryptos.length : 5;
    }
    return cryptos.length;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Trading Dashboard
              </h1>
              <p className="text-gray-300">Welcome back, {user?.username}!</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              {/* Currency Toggle Button */}
              <button
                onClick={toggleCurrency}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-lg transition-colors"
              >
                {currency === "USD" ? (
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
              <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
                <div className="text-gray-400 text-xs">Portfolio Value</div>
                <div className="text-white font-bold">
                  {formatCurrency(user?.balance || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Crypto Selector */}
          <div className="mb-6">
            <CryptoSelector
              cryptos={cryptos}
              selectedCrypto={selectedCrypto}
              onSelect={setSelectedCrypto}
              prices={prices}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2">
            {selectedPrice && (
              <CryptoChart
                symbol={selectedCrypto}
                name={selectedCryptoData?.name || ""}
                price={selectedPrice.usd}
                change={selectedPrice.usd_24h_change}
                volume={selectedPrice.usd_24h_vol}
                marketCap={selectedPrice.usd_market_cap}
                history={selectedHistory}
              />
            )}
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {/* Quick Trade */}
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Quick Trade</h3>

              {/* Trade Type Selector */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setTradeType("buy")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    tradeType === "buy"
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <ArrowUpCircle className="h-4 w-4 inline mr-1" />
                  Buy
                </button>
                <button
                  onClick={() => setTradeType("sell")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    tradeType === "sell"
                      ? "bg-red-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <ArrowDownCircle className="h-4 w-4 inline mr-1" />
                  Sell
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount ({selectedCryptoData?.shortName})
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Trade Summary */}
              <div className="bg-gray-700 rounded-lg p-3 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white">
                    {formatCurrency(selectedPrice?.usd || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">
                    {tradeAmount || "0"} {selectedCryptoData?.shortName}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
              </div>

              {/* Trade Button */}
              <button
                onClick={handleQuickTrade}
                disabled={!tradeAmount || !selectedPrice}
                className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
                  tradeType === "buy"
                    ? "bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
                } disabled:cursor-not-allowed`}
              >
                {tradeType === "buy" ? "Buy" : "Sell"}{" "}
                {selectedCryptoData?.shortName}
              </button>
            </div>

            {/* Market Stats */}
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">
                Market Overview
              </h3>
              <div
                className={`space-y-3 transition-all duration-300 ${
                  showAllCoins ? "max-h-[1000px]" : "max-h-[400px]"
                } overflow-hidden`}
              >
                {cryptos.slice(0, getVisibleCount()).map((crypto) => {
                  const priceData = prices[crypto.symbol];
                  if (!priceData) return null;

                  const isPositive = priceData.usd_24h_change >= 0;

                  return (
                    <div
                      key={crypto.symbol}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCrypto === crypto.symbol
                          ? "bg-gray-700"
                          : "bg-gray-750 hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="flex items-center space-x-3 flex-1"
                          onClick={() => setSelectedCrypto(crypto.symbol)}
                        >
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {crypto.shortName.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm">
                              {crypto.shortName}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {crypto.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-1">
                          <div className="text-white font-semibold text-sm">
                            {formatCurrency(priceData.usd)}
                          </div>
                          <div
                            className={`text-xs ${
                              isPositive ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {priceData.usd_24h_change.toFixed(2)}%
                          </div>
                        </div>
                        <button
                          onClick={() => handleMiniChartOpen(crypto.symbol)}
                          className="ml-2 p-1 text-gray-400 hover:text-white transition-colors"
                          title="View chart"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Expand/Collapse Button */}
              <button
                onClick={() => setShowAllCoins(!showAllCoins)}
                className="w-full mt-4 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
              >
                {/* Mobile: Show Expand/Collapse for 5/all, Desktop: for 3/all */}
                {showAllCoins ? (
                  <>
                    <ArrowUpCircle className="h-5 w-5 text-gray-400" />
                    <span className="ml-2 text-sm font-medium">
                      Collapse Back
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="h-5 w-5 text-gray-400" />
                    <span className="ml-2 text-sm font-medium">
                      Explore More
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Trading Cards */}
        <div className="mt-8 mb-12">
          <h2 className="text-xl font-bold text-white mb-4">All Markets $</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cryptos.slice(0, getAllMarketsVisibleCount()).map((crypto) => {
              const priceData = prices[crypto.symbol];
              if (!priceData) return null;

              return (
                <CryptoCard
                  key={crypto.symbol}
                  symbol={crypto.symbol}
                  name={crypto.name}
                  price={priceData.usd}
                  change={priceData.usd_24h_change}
                  onTrade={handleTrade}
                />
              );
            })}
          </div>
         
          {/* Expand/Collapse Button for All Markets (mobile only) */}
          <div className="block sm:hidden mt-4">
            {cryptos.length > 5 && (
              <button
                onClick={() => setShowAllMarkets(!showAllMarkets)}
                className="w-full py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
              >
                {showAllMarkets ? (
                  <>
                    <ArrowUpCircle className="h-5 w-5 text-gray-400" />
                    <span className="ml-2 text-sm font-medium">Collapse</span>
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="h-5 w-5 text-gray-400" />
                    <span className="ml-2 text-sm font-medium">Expand</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mini Chart Modal */}
        {showMiniChart && (
          <MiniChart
            symbol={showMiniChart}
            name={cryptos.find((c) => c.symbol === showMiniChart)?.name || ""}
            price={prices[showMiniChart]?.usd || 0}
            change={prices[showMiniChart]?.usd_24h_change || 0}
            onClose={handleMiniChartClose}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;

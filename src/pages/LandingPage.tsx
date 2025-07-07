import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  ArrowRight,
  Bot,
  Zap,
  BarChart3,
  Clock,
 
  IndianRupee,
} from "lucide-react"; // Added missing icons
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import axios from "axios";

// Smooth scroll CSS for the whole page
const pageStyle: React.CSSProperties = {
  scrollBehavior: "smooth",
};

// Simple hook for fade-in on scroll
function useScrollFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const handleScroll = () => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        node.classList.add("opacity-100", "translate-y-0");
      }
    };
    node.classList.add(
      "opacity-0",
      "translate-y-8",
      "transition-all",
      "duration-700"
    );
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return ref;
}

const ethApiUrl = "http://localhost:5000/api/prices/ethereum";
const exchangeRateApiUrl = "https://api.exchangerate-api.com/v4/latest/USD";

// Define the botStrategies array with proper types
const botStrategies = [
  {
    name: "AI Price Prediction",
    description:
      "Utilize advanced AI models to predict future Ethereum price movements with high accuracy.",
    returns: "Predicted 15-25% monthly",
    icon: <Zap className="h-6 w-6 text-yellow-400" />,
  },
  {
    name: "Volatility Capture",
    description:
      "Profit from Ethereum's price swings by automatically executing trades during periods of high volatility.",
    returns: "Predicted 10-20% monthly",
    icon: <BarChart3 className="h-6 w-6 text-red-400" />,
  },
  {
    name: "Trend Following",
    description:
      "Identify and follow emerging trends in Ethereum's price, maximizing gains during sustained movements.",
    returns: "Predicted 8-18% monthly",
    icon: <TrendingUp className="h-6 w-6 text-green-400" />,
  },
];

const arbitrageStrategies = [
  {
    name: "Spatial Arbitrage",
    description:
      "Exploit price differences for Ethereum across different exchanges in real-time.",
    returns: "10-18% monthly",
    color: "bg-blue-700",
  },
  {
    name: "Statistical Arbitrage",
    description:
      "Leverage statistical models to identify and profit from temporary price inefficiencies.",
    returns: "7-15% monthly",
    color: "bg-green-700",
  },
  {
    name: "Pattern-Based Arbitrage",
    description:
      "Utilize AI to detect recurring price patterns and execute arbitrage trades automatically.",
    returns: "12-22% monthly",
    color: "bg-purple-700",
  },
];

// Define the features array with proper types
const features = [
  {
    title: "Virtual Trading",
    description:
      "Start with $1000 virtual capital to practice and refine your strategies risk-free.",
    icon: <Bot className="h-6 w-6 text-blue-400" />,
  },
  {
    title: "Real-time Data",
    description:
      "Access live Ethereum price data and market insights to inform your trading decisions.",
    icon: <Clock className="h-6 w-6 text-indigo-400" />,
  },
  // {
  //   title: "AI-Powered Insights",
  //   description:
  //     "Gain an edge with AI-driven analytics and predictive models for optimal trading.",
  //   icon: <Lightbulb className="h-6 w-6 text-teal-400" />,
  // },
];

type EthHistoryPoint = {
  timestamp: string;
  price: number;
};

type ChartPoint = {
  time: string;
  eth: number;
};

const LandingPage: React.FC = () => {
  const [period] = useState<"1D" | "1W" | "1M">("1D");
  const [ethChartData, setEthChartData] = useState<ChartPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(1);

  // Section refs for smooth scroll navigation
  const heroRef = useRef<HTMLDivElement>(null);
  const botsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Fade-in hooks for sections
  const heroFade = useScrollFadeIn();
  const chartFade = useScrollFadeIn();
  const botsFade = useScrollFadeIn();
  const featuresFade = useScrollFadeIn();
  const statsFade = useScrollFadeIn();
  const ctaFade = useScrollFadeIn();

  // Smooth scroll handler
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch INR exchange rate
  useEffect(() => {
    axios
      .get(exchangeRateApiUrl)
      .then((res) => {
        const rate = res.data.rates.INR || 1;
        setExchangeRate(rate);
      })
      .catch((error) => console.error("Error fetching exchange rate:", error));
  }, []);

  // Fetch actual Ethereum price history from backend API
  useEffect(() => {
    setLoadingChart(true);
    axios
      .get(ethApiUrl)
      .then((res) => {
        const history: EthHistoryPoint[] = res.data.history || [];
        let data: ChartPoint[] = [];
        if (period === "1D") {
          // Last 24 points (simulate hourly)
          data = history.slice(-24).map((h) => ({
            time:
              new Date(h.timestamp).getHours().toString().padStart(2, "0") +
              ":00",
            eth: h.price,
          }));
        } else if (period === "1W") {
          // Group by day (last 7 days)
          const grouped: { [day: string]: { sum: number; count: number } } = {};
          history.forEach((h) => {
            const d = new Date(h.timestamp);
            const day = d.toLocaleDateString(undefined, { weekday: "short" });
            if (!grouped[day]) grouped[day] = { sum: 0, count: 0 };
            grouped[day].sum += h.price;
            grouped[day].count += 1;
          });
          data = Object.entries(grouped).map(([day, val]) => ({
            time: day,
            eth: val.sum / val.count,
          }));
        } else if (period === "1M") {
          // Group by week (last 4 weeks)
          const byWeek: { [week: string]: { sum: number; count: number } } = {};
          history.forEach((h) => {
            const d = new Date(h.timestamp);
            const week = `Week ${Math.ceil(d.getDate() / 7)}`;
            if (!byWeek[week]) byWeek[week] = { sum: 0, count: 0 };
            byWeek[week].sum += h.price;
            byWeek[week].count += 1;
          });
          data = Object.entries(byWeek).map(([week, val]) => ({
            time: week,
            eth: val.sum / val.count,
          }));
        }
        setEthChartData(data);
      })
      .finally(() => setLoadingChart(false));
  }, [period]);

  // Fade-in for arbitrage section
  const arbitrageFade = useScrollFadeIn();

  return (
    <div
      style={pageStyle}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
    >
      {/* Header */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <span className="text-xl font-bold text-white">CryptoArb</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {/* Currency toggle */}
              <button
                onClick={() =>
                  setCurrency((prev) => (prev === "USD" ? "INR" : "USD"))
                }
                className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <IndianRupee className="h-5 w-5 mr-1" />
                {currency === "USD" ? "USD" : "INR"}
              </button>
              <button
                onClick={() => scrollToSection(heroRef)}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection(botsRef)}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Bots
              </button>
              <button
                onClick={() => scrollToSection(featuresRef)}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Features
              </button>
              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-md"
              >
                Sign Up
              </Link>
            </div>
            {/* Mobile menu */}
            <div className="md:hidden flex items-center">
              {/* Currency toggle */}
              <button
                onClick={() =>
                  setCurrency((prev) => (prev === "USD" ? "INR" : "USD"))
                }
                className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <IndianRupee className="h-5 w-5 mr-1" />
                {currency === "USD" ? "USD" : "INR"}
              </button>
              <Link
                to="/register"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-md"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        ref={heroRef}
        className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-8 sm:py-12"
      >
        <div
          ref={heroFade as React.RefObject<HTMLDivElement>}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Master <span className="text-green-400">Ethereum</span> Trading
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Deploy AI-powered trading bots exclusively for Ethereum. Practice
            with $1000 virtual capital, compete globally, and master automated
            crypto trading strategies.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Trading Now
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>

        {/* Live Chart */}
        <div
          ref={chartFade as React.RefObject<HTMLDivElement>}
          className="flex flex-col items-center justify-center bg-gray-900 rounded-2xl p-4 sm:p-8 mb-8 sm:mb-12 border border-gray-800 shadow-2xl max-w-3xl mx-auto"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-0 text-center sm:text-left">
              Ethereum Price Chart ({currency})
            </h2>
            <div className="flex justify-center gap-2">
              {/* <button
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                  period === "1D"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => setPeriod("1D")}
              >
                1 Day
              </button> */}
              {/* <button
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                  period === "1W"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => setPeriod("1W")}
              >
                1 Week
              </button> */}
              {/* <button
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                  period === "1M"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => setPeriod("1M")}
              >
                1 Month
              </button> */}
            </div>
          </div>
          <div className="w-full h-64 sm:h-80 flex items-center justify-center">
            {loadingChart ? (
              <div className="text-blue-400 text-lg">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={ethChartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="ethGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop
                        offset="100%"
                        stopColor="#3B82F6"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="time"
                    stroke="#9CA3AF"
                    fontSize={13}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={13}
                    tickLine={false}
                    axisLine={false}
                    domain={["auto", "auto"]}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #3B82F6",
                      borderRadius: 10,
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#60a5fa" }}
                    formatter={(value: number) => {
                      const convertedValue =
                        currency === "INR" ? value * exchangeRate : value;
                      return [
                        `${currency === "INR" ? "₹" : "$"}${convertedValue.toFixed(
                          2
                        )}`,
                        "ETH",
                      ];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="eth"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      stroke: "#fff",
                      strokeWidth: 2,
                      fill: "#3B82F6",
                    }}
                    activeDot={{
                      r: 7,
                      stroke: "#3B82F6",
                      strokeWidth: 3,
                      fill: "#fff",
                    }}
                    name="Ethereum"
                    fill="url(#ethGradient)"
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Trading Bot Strategies */}
        <div ref={botsRef} className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6 sm:mb-8">
            Ethereum Trading Bot Strategies
          </h2>
          <div
            ref={botsFade as React.RefObject<HTMLDivElement>}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch"
          >
            {botStrategies.map((strategy, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-blue-500 transition-colors shadow-md hover:shadow-xl duration-300 flex flex-col h-full"
              >
                <div className="flex items-center mb-4">
                  {strategy.icon}
                  <h3 className="text-lg sm:text-xl font-semibold text-white ml-3">
                    {strategy.name}
                  </h3>
                </div>
                <p className="text-gray-300 mb-4">{strategy.description}</p>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-green-400 font-semibold text-sm">
                    Expected Returns
                  </div>
                  <div className="text-white font-bold">{strategy.returns}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arbitrage Strategies */}
        <div
          ref={arbitrageFade as React.RefObject<HTMLDivElement>}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6 sm:mb-8">
            Arbitrage Strategies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {arbitrageStrategies.map((arb) => (
              <div
                key={arb.name}
                className={`rounded-xl p-4 sm:p-6 border border-gray-700 shadow-md hover:shadow-xl duration-300 transition-colors ${arb.color} bg-opacity-80 flex flex-col h-full`}
              >
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  {arb.name}
                </h3>
                <p className="text-blue-100 mb-4">{arb.description}</p>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-green-400 font-semibold text-sm">
                    Expected Returns
                  </div>
                  <div className="text-white font-bold">{arb.returns}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Features */}
        <div
          ref={featuresRef}
          className="flex flex-wrap justify-between gap-4 sm:gap-6 mb-8 sm:mb-12"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              ref={featuresFade as React.RefObject<HTMLDivElement>}
              className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-green-400 transition-colors shadow-md hover:shadow-xl duration-300 flex flex-col justify-start flex-1 min-w-0 basis-full sm:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-1rem)]"
            >
              <div className="flex items-center mb-4">
                {feature.icon}
                <h3 className="text-lg sm:text-xl font-semibold text-white ml-3">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-300 flex-grow">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div
          ref={statsFade as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 items-stretch"
        >
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 text-center border border-gray-700 shadow-md flex flex-col h-full justify-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">
              $1,000
            </div>
            <div className="text-gray-300 text-sm">Starting Capital</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 text-center border border-gray-700 shadow-md flex flex-col h-full justify-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">
              ETH
            </div>
            <div className="text-gray-300 text-sm">Exclusive Focus</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 text-center border border-gray-700 shadow-md flex flex-col h-full justify-center">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">
              24/7
            </div>
            <div className="text-gray-300 text-sm">Bot Trading</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 text-center border border-gray-700 shadow-md flex flex-col h-full justify-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">
              AI
            </div>
            <div className="text-gray-300 text-sm">Powered</div>
          </div>
        </div>

        {/* CTA Section */}
        <div
          ref={ctaFade as React.RefObject<HTMLDivElement>}
          className="text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Start Automated Trading?
          </h2>
          <p className="text-gray-300 mb-6 sm:mb-8">
            Join thousands of traders already using our Ethereum-specialized
            bots
          </p>
          <Link
            to="/register"
            className="inline-flex items-center bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

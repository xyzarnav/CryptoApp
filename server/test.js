import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import http from "http";
import { Server as SocketIo } from "socket.io";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from "axios";
import dotenv from "dotenv";
const app = express();
dotenv.config();
const server = http.createServer(app);
const io = new SocketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
console.log(process.env.MONGO_URI);

// const io = new SocketIo(server, {
//   cors: {
//     origin: [
//       "http://localhost:5173",
//       "https://686b88a2d9eff38d628ec9d9--arnavcryptoapp.netlify.app",
//     ],
//     methods: ["GET", "POST"],
//   },
// });

// Middleware
app.use(helmet());
app.use(cors());
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://686b88a2d9eff38d628ec9d9--arnavcryptoapp.netlify.app",
//     ],
//   })
// );
app.use(morgan("combined"));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI);

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 1000 },
  totalProfit: { type: Number, default: 0 },
  totalTrades: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);

// Trade Schema
const TradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  symbol: { type: String, required: true },
  type: { type: String, enum: ["buy", "sell"], required: true },
  amount: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  profit: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Trade = mongoose.model("Trade", TradeSchema);

// Portfolio Schema
const PortfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  symbol: { type: String, required: true },
  amount: { type: Number, required: true },
  avgPrice: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

const Portfolio = mongoose.model("Portfolio", PortfolioSchema);

// Bot Schema
const BotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  strategy: { type: String, required: true },
  investment: { type: Number, required: true },
  currentValue: { type: Number, required: true },
  profit: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  trades: [
    {
      type: { type: String, enum: ["buy", "sell"] },
      amount: Number,
      price: Number,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  stoppedAt: { type: Date },
});

const Bot = mongoose.model("Bot", BotSchema);

// Arbitrage Investment Schema
const ArbitrageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  strategy: { type: String, required: true },
  amount: { type: Number, required: true },
  profit: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "completed"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

const Arbitrage = mongoose.model("Arbitrage", ArbitrageSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
console.log(JWT_SECRET);


// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

// Crypto prices cache
let cryptoPrices = {};
let priceHistory = {};
let lastFetchSuccess = true;
let lastSuccessfulFetch = Date.now();
let retryCount = 0;
const maxRetries = 5;
const initialBackoffDelay = 5000; // 5 seconds

// Initialize price history for charts
const initializePriceHistory = () => {
  const cryptos = [
    "bitcoin",
    "ethereum",
    "cardano",
    "polkadot",
    "chainlink",
    "litecoin",
    "bitcoin-cash",
    "stellar",
    "dogecoin",
    "polygon",
  ];
  cryptos.forEach((crypto) => {
    priceHistory[crypto] = [];
  });
};

initializePriceHistory();

// Fetch crypto prices from CoinGecko with retry logic
const fetchCryptoPrices = async () => {
  try {
    // If we've had too many failures, increase delay between requests
    const shouldFetch =
      lastFetchSuccess || Date.now() - lastSuccessfulFetch > getBackoffDelay();

    if (!shouldFetch) {
      console.log("Skipping fetch due to backoff strategy");
      return;
    }

    console.log("Fetching crypto prices...");
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: "bitcoin,ethereum,cardano,polkadot,chainlink,litecoin,bitcoin-cash,stellar,dogecoin,polygon",
          vs_currencies: "usd",
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true,
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    cryptoPrices = response.data;
    lastFetchSuccess = true;
    lastSuccessfulFetch = Date.now();
    retryCount = 0; // Reset retry count on success

    // Store price history for charts
    const timestamp = Date.now();
    Object.keys(cryptoPrices).forEach((crypto) => {
      if (priceHistory[crypto]) {
        priceHistory[crypto].push({
          timestamp,
          price: cryptoPrices[crypto].usd,
          volume: cryptoPrices[crypto].usd_24h_vol || 0,
        });

        // Keep only last 100 data points
        if (priceHistory[crypto].length > 100) {
          priceHistory[crypto] = priceHistory[crypto].slice(-100);
        }
      }
    });

    // Emit prices to all connected clients
    io.emit("priceUpdate", { prices: cryptoPrices, history: priceHistory });
  } catch (error) {
    lastFetchSuccess = false;
    retryCount++;

    // Log specific error for rate limiting
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers["retry-after"] || 60;
      console.error(
        `Rate limited by CoinGecko API. Retry after ${retryAfter} seconds.`
      );
    } else {
      console.error("Error fetching crypto prices:", error.message);
    }

    // If we still have cached data, continue serving it
    if (Object.keys(cryptoPrices).length > 0) {
      io.emit("priceUpdate", {
        prices: cryptoPrices,
        history: priceHistory,
        cached: true,
        lastUpdated: lastSuccessfulFetch,
      });
    }
  }
};

// Calculate exponential backoff delay
function getBackoffDelay() {
  if (retryCount === 0) return 0;
  // Exponential backoff: 5s, 10s, 20s, 40s, 80s, etc.
  return initialBackoffDelay * Math.pow(2, Math.min(retryCount - 1, 6));
}

// Fetch prices at a reduced frequency (every 2 minutes)
// This reduces chances of hitting rate limits
const fetchInterval = 120000; // 2 minutes
setInterval(fetchCryptoPrices, fetchInterval);
fetchCryptoPrices(); // Initial fetch

// Routes
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT with expiration
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: "7d" } // Token expires in 7 days
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    const trades = await Trade.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    const portfolio = await Portfolio.find({ userId: req.user.userId });
    const arbitrages = await Arbitrage.find({ userId: req.user.userId });
    const bots = await Bot.find({ userId: req.user.userId });

    res.json({ user, trades, portfolio, arbitrages, bots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/trade", authenticateToken, async (req, res) => {
  try {
    const { symbol, type, amount, price } = req.body;
    const total = amount * price;

    const user = await User.findById(req.user.userId);

    if (type === "buy") {
      if (user.balance < total) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      user.balance -= total;

      // Update portfolio
      let portfolioItem = await Portfolio.findOne({
        userId: req.user.userId,
        symbol,
      });
      if (portfolioItem) {
        const totalAmount = portfolioItem.amount + amount;
        portfolioItem.avgPrice =
          (portfolioItem.avgPrice * portfolioItem.amount + price * amount) /
          totalAmount;
        portfolioItem.amount = totalAmount;
        await portfolioItem.save();
      } else {
        portfolioItem = new Portfolio({
          userId: req.user.userId,
          symbol,
          amount,
          avgPrice: price,
        });
        await portfolioItem.save();
      }
    } else {
      const portfolioItem = await Portfolio.findOne({
        userId: req.user.userId,
        symbol,
      });
      if (!portfolioItem || portfolioItem.amount < amount) {
        return res.status(400).json({ error: "Insufficient crypto holdings" });
      }

      user.balance += total;
      portfolioItem.amount -= amount;

      if (portfolioItem.amount === 0) {
        await Portfolio.deleteOne({ _id: portfolioItem._id });
      } else {
        await portfolioItem.save();
      }
    }

    // Calculate profit for sell orders
    let profit = 0;
    if (type === "sell") {
      const portfolioItem = await Portfolio.findOne({
        userId: req.user.userId,
        symbol,
      });
      if (portfolioItem) {
        profit = (price - portfolioItem.avgPrice) * amount;
        user.totalProfit += profit;
      }
    }

    user.totalTrades += 1;
    await user.save();

    // Create trade record
    const trade = new Trade({
      userId: req.user.userId,
      symbol,
      type,
      amount,
      price,
      total,
      profit,
    });
    await trade.save();

    res.json({ trade, balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/bots", authenticateToken, async (req, res) => {
  try {
    const { name, strategy, investment } = req.body;

    // Check if user already has an active bot
    const existingBot = await Bot.findOne({
      userId: req.user.userId,
      isActive: true,
    });
    if (existingBot) {
      return res
        .status(400)
        .json({ error: "You can only have one active bot at a time" });
    }

    const user = await User.findById(req.user.userId);
    if (user.balance < investment) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    user.balance -= investment;
    await user.save();

    const bot = new Bot({
      userId: req.user.userId,
      name,
      strategy,
      investment,
      currentValue: investment,
    });
    await bot.save();

    res.json({ bot, balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/bots", authenticateToken, async (req, res) => {
  try {
    const bots = await Bot.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(bots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/bots/:id/stop", authenticateToken, async (req, res) => {
  try {
    const bot = await Bot.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    bot.isActive = false;
    bot.stoppedAt = new Date();
    await bot.save();

    // Return investment + profit to user
    const user = await User.findById(req.user.userId);
    user.balance += bot.currentValue;
    user.totalProfit += bot.profit;
    await user.save();

    res.json({ bot, balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/arbitrage", authenticateToken, async (req, res) => {
  try {
    const { strategy, amount } = req.body;

    // Check if user already has an active arbitrage
    const existingArbitrage = await Arbitrage.findOne({
      userId: req.user.userId,
      status: "active",
    });
    if (existingArbitrage) {
      return res.status(400).json({
        error: "You can only have one active arbitrage strategy at a time",
      });
    }

    const user = await User.findById(req.user.userId);
    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    user.balance -= amount;
    await user.save();

    const arbitrage = new Arbitrage({
      userId: req.user.userId,
      strategy,
      amount,
    });
    await arbitrage.save();

    res.json({ arbitrage, balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/arbitrage/:id/stop", authenticateToken, async (req, res) => {
  try {
    const arbitrage = await Arbitrage.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!arbitrage) {
      return res.status(404).json({ error: "Arbitrage strategy not found" });
    }

    arbitrage.status = "completed";
    arbitrage.completedAt = new Date();
    await arbitrage.save();

    // Return investment + profit to user
    const user = await User.findById(req.user.userId);
    user.balance += arbitrage.amount + arbitrage.profit;
    user.totalProfit += arbitrage.profit;
    await user.save();

    res.json({ arbitrage, balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const users = await User.find()
      .select("username totalProfit totalTrades")
      .sort({ totalProfit: -1 })
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/prices", (req, res) => {
  res.json({
    prices: cryptoPrices,
    history: priceHistory,
    cached: !lastFetchSuccess,
    lastUpdated: lastSuccessfulFetch,
  });
});

app.get("/api/prices/:symbol", (req, res) => {
  const { symbol } = req.params;
  const price = cryptoPrices[symbol];
  const history = priceHistory[symbol] || [];

  if (!price) {
    return res.status(404).json({ error: "Symbol not found" });
  }

  res.json({
    price,
    history,
    cached: !lastFetchSuccess,
    lastUpdated: lastSuccessfulFetch,
  });
});

// Add new verify token endpoint
app.get("/api/verify-token", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error verifying token" });
  }
});

// Simulate bot trading and arbitrage profits
setInterval(async () => {
  try {
    // Update active bots
    const activeBots = await Bot.find({ isActive: true }).maxTimeMS(20000);

    for (const bot of activeBots) {
      // Simulate Ethereum trading (profit/loss between -3% to +8%)
      const profitRate = Math.random() * 0.11 - 0.03; // -3% to +8%
      const profitAmount = bot.currentValue * profitRate * 0.01; // Per minute profit

      bot.currentValue += profitAmount;
      bot.profit += profitAmount;

      // Add simulated trade
      if (Math.random() > 0.7) {
        // 30% chance of trade per minute
        const tradeType = Math.random() > 0.5 ? "buy" : "sell";
        const ethPrice = cryptoPrices.ethereum?.usd || 2000;
        const tradeAmount = Math.random() * 0.1 + 0.01; // 0.01 to 0.11 ETH

        bot.trades.push({
          type: tradeType,
          amount: tradeAmount,
          price: ethPrice + (Math.random() * 20 - 10), // Price variation
        });

        // Keep only last 20 trades
        if (bot.trades.length > 20) {
          bot.trades = bot.trades.slice(-20);
        }
      }

      await bot.save();
    }

    // Update arbitrage investments
    const activeArbitrages = await Arbitrage.find({
      status: "active",
    }).maxTimeMS(20000);

    for (const arbitrage of activeArbitrages) {
      // Simulate profit between -2% to +5%
      const profitRate = Math.random() * 0.07 - 0.02;
      const profit = arbitrage.amount * profitRate * 0.01; // Per minute profit

      arbitrage.profit += profit;
      await arbitrage.save();

      // Check if target reached (auto-complete at certain profit levels)
      const profitPercentage = (arbitrage.profit / arbitrage.amount) * 100;
      const targetReached =
        (arbitrage.strategy === "Spatial Arbitrage" &&
          profitPercentage >= 15) ||
        (arbitrage.strategy === "Statistical Arbitrage" &&
          profitPercentage >= 10) ||
        (arbitrage.strategy === "Pattern-Based Arbitrage" &&
          profitPercentage >= 20);

      if (targetReached) {
        arbitrage.status = "completed";
        arbitrage.completedAt = new Date();
        await arbitrage.save();

        // Return funds to user
        const user = await User.findById(arbitrage.userId);
        user.balance += arbitrage.amount + arbitrage.profit;
        user.totalProfit += arbitrage.profit;
        await user.save();
      }
    }
  } catch (error) {
    console.error("Error updating bots and arbitrage:", error);
  }
}, 60000); // Update every minute

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send current prices and history to newly connected client
  socket.emit("priceUpdate", {
    prices: cryptoPrices,
    history: priceHistory,
    cached: !lastFetchSuccess,
    lastUpdated: lastSuccessfulFetch,
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

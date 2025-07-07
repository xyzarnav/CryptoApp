# CryptoArb - Crypto Arbitrage Trading Bot

A full-stack crypto arbitrage trading simulator with a gamified, mobile-first interface. Practice high-frequency crypto arbitrage trading with virtual capital.

## Features

- **Virtual Trading**: Start with $1000 virtual capital
- **Real-time Prices**: Live crypto price updates via WebSocket
- **Arbitrage Strategies**: Multiple automated arbitrage strategies
- **Gamified Interface**: Leaderboard, achievements, and competitive trading
- **Mobile-First**: Responsive design optimized for mobile devices
- **Full Portfolio Management**: Track trades, profits, and holdings

## Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Real-time**: Socket.IO for WebSocket connections
- **Charts**: Recharts for price visualization
- **Authentication**: JWT-based auth system

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start MongoDB on your local machine or update the connection string in `server/index.js`

4. Start the backend server:
   ```bash
   npm run server
   ```

5. Start the frontend development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Usage

1. **Register**: Create a new account and receive $1000 virtual capital
2. **Dashboard**: View real-time crypto prices and execute trades
3. **Trading**: Buy/sell cryptocurrencies with virtual money
4. **Arbitrage**: Invest in automated arbitrage strategies
5. **Leaderboard**: Compete with other traders
6. **Profile**: Track your trading history and portfolio

## API Endpoints

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile and trading data
- `POST /api/trade` - Execute buy/sell trades
- `POST /api/arbitrage` - Invest in arbitrage strategies
- `GET /api/leaderboard` - Get top traders
- `GET /api/prices` - Get current crypto prices

## Real-time Features

- Live crypto price updates
- Real-time portfolio value changes
- Instant trade execution feedback
- Arbitrage profit simulations

## Security Features

- Password hashing with bcrypt
- JWT authentication
- CORS protection
- Helmet.js security headers
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
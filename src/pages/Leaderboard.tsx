import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Medal, Award, TrendingUp, DollarSign, IndianRupee } from 'lucide-react';

interface LeaderboardUser {
  _id: string;
  username: string;
  totalProfit: number;
  totalTrades: number;
}

const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency, toggleCurrency, formatCurrency } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(
          "https://cryptoapp-4ftm.onrender.com/api/leaderboard"
        );
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-400" />;
      default:
        return <div className="h-6 w-6 flex items-center justify-center text-gray-400 font-bold">#{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-yellow-400 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10';
      case 2:
        return 'border-gray-400 bg-gradient-to-r from-gray-400/10 to-gray-600/10';
      case 3:
        return 'border-orange-400 bg-gradient-to-r from-orange-400/10 to-orange-600/10';
      default:
        return 'border-gray-700';
    }
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
            <p className="text-gray-300">Top traders by total profit</p>
          </div>
          
          {/* Add Currency Toggle Button */}
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
        </div>

        {users.length === 0 ? (
          <div className="text-center text-gray-400">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No traders yet. Be the first to start trading!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user, index) => (
              <div
                key={user._id}
                className={`flex items-center justify-between p-6 rounded-lg border ${getRankColor(index + 1)} ${
                  index < 3 ? 'transform hover:scale-105 transition-transform' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  {getRankIcon(index + 1)}
                  <div>
                    <h3 className="text-lg font-semibold text-white">{user.username}</h3>
                    <p className="text-gray-400 text-sm">{user.totalTrades} trades</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${user.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(user.totalProfit)}
                  </div>
                  <div className="text-gray-400 text-sm">Total Profit</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
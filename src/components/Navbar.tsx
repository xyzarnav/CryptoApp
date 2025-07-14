import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  TrendingUp,
  User,
  BarChart3,
  Trophy,
  LogOut,
  Bot,
  
} from "lucide-react";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    // { path: "/my-bots", label: "My Bots", icon: Bot },
    // { path: "/arbitrage", label: "Arbitrage", icon: TrendingUp },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/profile", label: "Profile", icon: User },
  ];

  // const toggleMobileMenu = () => {
  //   setIsMobileMenuOpen(!isMobileMenuOpen);
  // };

  // const handleMobileMenuClick = () => {
  //   setIsMobileMenuOpen(false);
  // };

  return (
    <>
      <nav className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg border-b border-slate-700/50 sticky top-0 z-50 backdrop-blur-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="flex items-center space-x-3 group"
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent hidden sm:block">
                  CryptoArb
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10 border border-emerald-500/30"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Section - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-400 font-semibold text-sm">
                  ${user?.balance.toFixed(0)}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:shadow-md"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom App Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg border-t border-slate-700/50 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-14">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center space-y-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? "text-emerald-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="flex flex-col items-center justify-center space-y-0.5 px-2 py-1 rounded-lg text-[10px] font-medium text-slate-400 hover:text-white transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Add padding to prevent overshadowing */}
      <div className="md:hidden h-14"></div>
    </>
  );
};

export default Navbar;

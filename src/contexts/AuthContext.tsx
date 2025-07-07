import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
}

// Add new currency type
type Currency = 'USD' | 'INR';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateBalance: (balance: number) => void;
  // Add new currency-related fields
  currency: Currency;
  exchangeRate: number;
  toggleCurrency: () => void;
  convertCurrency: (amount: number) => number;
  formatCurrency: (amount: number) => string;
  loading: boolean; // <-- add loading
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Add new state for currency and exchange rate
  const [currency, setCurrency] = useState<Currency>(() => {
    const savedCurrency = localStorage.getItem('currency');
    return (savedCurrency as Currency) || 'INR';
  });
  const [exchangeRate, setExchangeRate] = useState<number>(75); // Default estimate until API fetch completes
  const [loading, setLoading] = useState(true); // <-- add loading state

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    // Fetch exchange rate on initial load
    fetchExchangeRate();
  }, []);

  // Add initialization effect
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        // Verify token and get user data
        const response = await fetch('http://localhost:5000/api/verify-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // If token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false); // <-- set loading false after check
      }
    };

    initializeAuth();
  }, []);

  // Add useEffect to persist currency choice
  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  // Add function to fetch exchange rate
  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data.rates.INR || 75); // Use 75 as fallback if API fails
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
    }
  };

  // Add toggle function for currency
  const toggleCurrency = () => {
    setCurrency(prev => prev === 'USD' ? 'INR' : 'USD');
  };

  // Add conversion helper
  const convertCurrency = (amount: number): number => {
    if (currency === 'INR') {
      return amount * exchangeRate;
    }
    return amount;
  };

  // Add formatting helper
  const formatCurrency = (amount: number): string => {
    const converted = convertCurrency(amount);
    
    if (currency === 'INR') {
      return `₹${converted.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      })}`;
    }
    
    return `$${amount.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}`;
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateBalance = (balance: number) => {
    if (user) {
      const updatedUser = { ...user, balance };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        updateBalance, 
        currency, 
        exchangeRate, 
        toggleCurrency, 
        convertCurrency, 
        formatCurrency,
        loading // <-- provide loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
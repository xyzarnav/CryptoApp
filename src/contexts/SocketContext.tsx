import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';

interface CryptoPrices {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol?: number;
    usd_market_cap?: number;
  };
}

interface PriceHistory {
  [key: string]: Array<{
    timestamp: number;
    price: number;
    volume: number;
  }>;
}

interface SocketContextType {
  socket: Socket | null;
  prices: CryptoPrices;
  priceHistory: PriceHistory;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [prices, setPrices] = useState<CryptoPrices>({});
  const [priceHistory, setPriceHistory] = useState<PriceHistory>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('priceUpdate', (data: { prices: CryptoPrices; history: PriceHistory }) => {
      setPrices(data.prices);
      setPriceHistory(data.history);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, prices, priceHistory, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Crypto {
  symbol: string;
  name: string;
  shortName: string;
}

interface CryptoSelectorProps {
  cryptos: Crypto[];
  selectedCrypto: string;
  onSelect: (symbol: string) => void;
  prices: { [key: string]: { usd: number; usd_24h_change: number } };
}

const CryptoSelector: React.FC<CryptoSelectorProps> = ({
  cryptos,
  selectedCrypto,
  onSelect,
  prices
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCryptos = cryptos.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCryptoData = cryptos.find(c => c.symbol === selectedCrypto);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between text-white hover:border-gray-600 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {selectedCryptoData?.shortName.slice(0, 2)}
            </span>
          </div>
          <div className="text-left">
            <div className="font-semibold">{selectedCryptoData?.name}</div>
            <div className="text-gray-400 text-sm">{selectedCryptoData?.shortName}</div>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredCryptos.map((crypto) => {
              const priceData = prices[crypto.symbol];
              const isPositive = priceData?.usd_24h_change >= 0;
              
              return (
                <button
                  key={crypto.symbol}
                  onClick={() => {
                    onSelect(crypto.symbol);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition-colors ${
                    selectedCrypto === crypto.symbol ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {crypto.shortName.slice(0, 2)}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-white font-medium">{crypto.name}</div>
                      <div className="text-gray-400 text-sm">{crypto.shortName}</div>
                    </div>
                  </div>
                  {priceData && (
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        ${priceData.usd.toFixed(2)}
                      </div>
                      <div className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{priceData.usd_24h_change.toFixed(2)}%
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoSelector;
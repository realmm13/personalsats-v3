import { clientEnv } from '@/env/client';
import { db } from './db';
import { startOfDay } from 'date-fns';

interface PriceCache {
  price: number;
  timestamp: number;
}

interface CoinbaseResponse {
  data: {
    amount: string;
  };
}

interface BinanceResponse {
  price: string;
}

interface KrakenResponse {
  result: {
    XXBTZUSD: {
      c: string[];
    };
  };
}

type PriceApiResponse = CoinbaseResponse | BinanceResponse | KrakenResponse;

interface PriceApi {
  url: string;
  parser: (data: PriceApiResponse) => number;
  headers: Record<string, string>;
}

// Type guards
function isCoinbaseResponse(data: PriceApiResponse): data is CoinbaseResponse {
  return 'data' in data && 'amount' in data.data;
}

function isBinanceResponse(data: PriceApiResponse): data is BinanceResponse {
  return 'price' in data;
}

function isKrakenResponse(data: PriceApiResponse): data is KrakenResponse {
  return 'result' in data && 'XXBTZUSD' in data.result && Array.isArray(data.result.XXBTZUSD.c);
}

const CACHE_DURATION = clientEnv.NEXT_PUBLIC_PRICE_CACHE_DURATION;
const RATE_LIMIT_DURATION = 60000; // 1 minute
const MAX_RETRIES = 3;

// Price APIs in order of preference
const PRICE_APIS: PriceApi[] = [
  {
    url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
    parser: (data: PriceApiResponse) => {
      if (!isCoinbaseResponse(data)) throw new Error('Invalid Coinbase response');
      return parseFloat(data.data.amount);
    },
    headers: {
      'Accept': 'application/json'
    }
  },
  {
    url: 'https://api.binance.us/api/v3/ticker/price?symbol=BTCUSD',
    parser: (data: PriceApiResponse) => {
      if (!isBinanceResponse(data)) throw new Error('Invalid Binance response');
      return parseFloat(data.price);
    },
    headers: {
      'Accept': 'application/json'
    }
  },
  {
    url: 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD',
    parser: (data: PriceApiResponse) => {
      if (!isKrakenResponse(data)) throw new Error('Invalid Kraken response');
      const price = data.result.XXBTZUSD.c[0];
      if (!price) throw new Error('No price found in Kraken response');
      return parseFloat(price);
    },
    headers: {
      'Accept': 'application/json'
    }
  }
];

let priceCache: PriceCache | null = null;
let lastApiCall = 0;
let retryCount = 0;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers
      },
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Cache helpers
function getCachedPrice(): PriceCache | null {
  try {
    const cached = localStorage.getItem('btcPriceCache');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setCachedPrice(cache: PriceCache) {
  try {
    localStorage.setItem('btcPriceCache', JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

async function fetchBitcoinPrice(): Promise<number> {
  for (const api of PRICE_APIS) {
    try {
      console.log(`Attempting to fetch price from ${api.url}`);
      const response = await fetchWithTimeout(api.url, {
        headers: api.headers
      });
      
      if (!response.ok) {
        console.error(`API ${api.url} returned status ${response.status}`);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json() as PriceApiResponse;
      const price = api.parser(data);
      return price;
    } catch (error) {
      console.error(`API ${api.url} failed with error:`, error);
      continue;
    }
  }
  throw new Error('All price sources failed');
}

export async function getBitcoinPrice(formatted = true): Promise<number | string> {
  const now = Date.now();

  // Check cache first
  if (priceCache && (now - priceCache.timestamp) < CACHE_DURATION) {
    return formatted ? formatUSD(priceCache.price) : priceCache.price;
  }

  // Respect rate limiting
  if (now - lastApiCall < RATE_LIMIT_DURATION) {
    if (priceCache) {
      return formatted ? formatUSD(priceCache.price) : priceCache.price;
    }
  }

  try {
    lastApiCall = now;
    const price = await fetchBitcoinPrice();
    priceCache = { price, timestamp: now };
    retryCount = 0;
    setCachedPrice(priceCache);
    return formatted ? formatUSD(price) : price;
  } catch (error) {
    console.error('Price API failed:', error);

    // Try to get from localStorage as last resort
    const cachedPrice = getCachedPrice();
    if (cachedPrice) {
      priceCache = cachedPrice;
      return formatted ? formatUSD(cachedPrice.price) : cachedPrice.price;
    }

    // If everything fails and we have retries left
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(getBitcoinPrice(formatted));
        }, 2000 * retryCount); // Exponential backoff
      });
    }

    throw new Error('Unable to fetch Bitcoin price from any source');
  }
}

export function formatUSD(value: number): string {
  if (value == null) return '$0.00';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Looks up the BTC/USD price for a given date from the DailyPrice table.
 * If the exact date is not found, returns the price from the nearest prior date.
 * @param date JS Date object (UTC)
 * @returns price as number, or null if not found
 */
export async function getDailyBtcUsdPrice(date: Date): Promise<number | null> {
  // Normalize to start of day UTC
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  console.log('[getDailyBtcUsdPrice] Input:', date.toISOString(), 'Lookup day:', day.toISOString());
  // Query for the nearest price on or before the given date
  const priceRow = await db.dailyPrice.findFirst({
    where: {
      date: {
        lte: day,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });
  return priceRow ? priceRow.price : null;
} 
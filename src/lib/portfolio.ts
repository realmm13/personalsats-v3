import type { Transaction } from "@/lib/types";

interface Lot {
  id: string;
  amount: number;
  remaining: number;
  price: number;
}

interface PortfolioSummary {
  totalBTC: number;
  costBasis: number;
  currentValue: number;
  unrealizedPnL?: number;
  percentageReturn?: number;
}

// Helper function to ensure timestamp is a Date object
function parseTransactionDate(transaction: Transaction): Transaction {
  return {
    ...transaction,
    timestamp: new Date(transaction.timestamp), // Convert string/Date to Date
  };
}

export function calculatePortfolioSummary(transactions: Transaction[] = [], currentPrice: number | null): PortfolioSummary {
  // Explicitly check if transactions is an array
  if (!Array.isArray(transactions)) {
    console.error("calculatePortfolioSummary received non-array:", transactions);
    // Return a default summary if it's not an array somehow
    return {
      totalBTC: 0,
      costBasis: 0,
      currentValue: 0,
      unrealizedPnL: 0,
      percentageReturn: 0
    };
  }

  // Convert timestamps to Date objects before sorting/processing
  const processedTransactions = transactions.map(parseTransactionDate);

  // Now it's safe to spread
  const sortedTransactions = [...processedTransactions].sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return aTime - bTime;
  });
  
  // Track lots for cost basis
  let lots: Lot[] = [];
  let lotCounter = 1;
  
  // Process transactions to track remaining lots
  for (const tx of sortedTransactions) {
    if (tx.type === 'buy') {
      const amount = tx.amount ?? 0;
      const price = tx.price ?? 0;
      lots.push({
        id: `LOT-${lotCounter++}`,
        amount,
        remaining: amount,
        price
      });
    } else if (tx.type === 'sell') {
      // Use FIFO to reduce lots
      let remainingToSell = tx.amount ?? 0;
      for (const lot of lots) {
        if (remainingToSell <= 0) break;
        const lotRemaining = lot.remaining ?? 0;
        const amountFromLot = Math.min(lotRemaining, remainingToSell);
        lot.remaining = lotRemaining - amountFromLot;
        remainingToSell -= amountFromLot;
      }
      // Remove fully used lots
      lots = lots.filter(lot => (lot.remaining ?? 0) > 0);
    }
  }

  // Calculate totals from remaining lots
  const summary = lots.reduce((acc, lot) => ({
    totalBTC: acc.totalBTC + (lot.remaining ?? 0),
    costBasis: acc.costBasis + ((lot.remaining ?? 0) * (lot.price ?? 0))
  }), {
    totalBTC: 0,
    costBasis: 0
  });

  const currentValue = currentPrice ? summary.totalBTC * currentPrice : 0;
  const unrealizedPnL = currentValue - summary.costBasis;
  const percentageReturn = summary.costBasis > 0 ? (unrealizedPnL / summary.costBasis) * 100 : 0;

  return {
    ...summary,
    currentValue,
    unrealizedPnL,
    percentageReturn
  };
}

export function getRecentTransactions(transactions: Transaction[] = [], limit = 3): Transaction[] {
  if (!Array.isArray(transactions)) {
     console.error("getRecentTransactions received non-array:", transactions);
     return [];
  }
  // Convert timestamps to Date objects before sorting
  const processedTransactions = transactions.map(parseTransactionDate);

  return [...processedTransactions]
    .sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return bTime - aTime;
    })
    .slice(0, limit);
}

// Helper function to calculate realized gains/losses
export function calculateRealizedGains(transactions: Transaction[] = []): number {
  if (!Array.isArray(transactions)) {
     console.error("calculateRealizedGains received non-array:", transactions);
     return 0;
  }
  // Convert timestamps to Date objects before sorting
  const processedTransactions = transactions.map(parseTransactionDate);
  
  const sortedTransactions = [...processedTransactions].sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return aTime - bTime;
  });
  let lots: Lot[] = [];
  let lotCounter = 1;
  let realizedGains = 0;

  for (const tx of sortedTransactions) {
    if (tx.type === 'buy') {
      const amount = tx.amount ?? 0;
      const price = tx.price ?? 0;
      lots.push({
        id: `LOT-${lotCounter++}`,
        amount,
        remaining: amount,
        price
      });
    } else if (tx.type === 'sell') {
      let remainingToSell = tx.amount ?? 0;
      for (const lot of lots) {
        if (remainingToSell <= 0) break;
        const lotRemaining = lot.remaining ?? 0;
        const lotPrice = lot.price ?? 0;
        const txPrice = tx.price ?? 0;
        const amountFromLot = Math.min(lotRemaining, remainingToSell);
        realizedGains += amountFromLot * (txPrice - lotPrice);
        lot.remaining = lotRemaining - amountFromLot;
        remainingToSell -= amountFromLot;
      }
      lots = lots.filter(lot => (lot.remaining ?? 0) > 0);
    }
  }

  return realizedGains;
} 
// Hook to flip coins using sanity 
export const useCoinFlip = (sanity, numCoins) => {
  const results = [];

  for (let i = 0; i < numCoins; i++) {
    const roll = Math.floor(Math.random() * 100) + 1;
    const threshold = 50 + sanity;
    results.push(roll <= threshold ? 'Heads' : 'Tails');
  }

  return results;
};

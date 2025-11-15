// Calculate equal splits for all participants
const calculateSplits = (amount, participants) => {
  const splitAmount = amount / participants.length;
  return participants.map((userId) => ({
    userId,
    amount: parseFloat(splitAmount.toFixed(2)),
  }));
};

module.exports = {
  calculateSplits,
};

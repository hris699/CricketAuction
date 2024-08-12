const transactionTable = require("../common-function/transaction_history_table.json");
const sequelize = require("sequelize")
let TransactionHistory;
exports.setTransactionHistory = async (transaction_history) => {
  TransactionHistory = transaction_history;
};

exports.addTransactionHistory = async (auctionId, teamId, playerId, finalPrice, initialPurseValue, finalPurseValue) => {
  let TransactionDetails = {
    [transactionTable.AUCTION_ID]: auctionId,
    [transactionTable.TEAM_ID]: teamId,
    [transactionTable.PLAYER_ID]: playerId,
    [transactionTable.FINAL_PRICE]: finalPrice,
    [transactionTable.INITIAL_PURSE_VALUE]: initialPurseValue,
    [transactionTable.FINAL_PURSE_VALUE]: finalPurseValue
  };
  const transactionEntry = await TransactionHistory.create(TransactionDetails);
  if (transactionEntry)
    return true;
  else
    return false;
};

exports.getTotalMoneySpentByAuctionId = async (auctionId) => {
  let moneySpent = await TransactionHistory.sum(transactionTable.FINAL_PRICE, {
    where: {
      [transactionTable.AUCTION_ID]: auctionId,
    },
  });
  return moneySpent;
}
const { errorResponse, successResponse } = require('../common-function/util');
const transactionHistoryController = require('../services/transactionService');

const addTransactionHistory = async (req, res) => {
    try {
        const auctionId = req.body.auction_id;
        const teamId = req.body.team_id;
        const playerId = req.body.player_id;
        const finalPrice = req.body.final_price;
        const initialPurseValue = req.body.initial_purse_value;
        const finalPurseValue = req.body.final_purse_value;
        const response = await transactionHistoryController.addTransactionHistory(auctionId, teamId, playerId, finalPrice, initialPurseValue, finalPurseValue);
        if (!response)
            return errorResponse(res, 404, "Unable to add transaction details")
        else
            return successResponse(res, response);
    } catch (error) {
        console.log("Error -", error);
        return errorResponse(res, 417, "There seems to be some issue.Sorry for inconvenience.");
    }
}

module.exports = {
    addTransactionHistory
}
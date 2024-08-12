const { successResponse, errorResponse } = require('../common-function/util');
const biddingService = require('../services/biddingService');

const addBiddingHistory = async (req, res) => {
  try {
    const auctionId = req.body.auction_id;
    const teamId = req.body.team_id;
    const playerId = req.body.player_id;
    const lastBid = req.body.last_bid;
    const currentBid = req.body.current_bid;
    const response = await biddingService.addBiddingHistory(auctionId, teamId, playerId, lastBid, currentBid);
    if (!response)
      return errorResponse(res, 404, "Unable to create bid history");
    else
      return successResponse(res, response);
  } catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue.Sorry for inconvenience.");
  }
};

const getLatestBidList = async (req, res) => {
  try {
    var auctionId = req.params.auction_id;
    var playerId = req.params.player_id;
    console.log("request ", auctionId, playerId);
    var response = await biddingService.getLatestBidList(auctionId, playerId);
    console.log("in method response ", response);
    if (!response) {
      return errorResponse(res, 404, "No Bids Found");
    } else {
      return successResponse(res, response);
    }
  } catch (error) {
    console.log("error", error);
    return errorResponse(res, 417, "There seems to be some issue.Sorry for inconvenience.");
  }
};

module.exports = {
  addBiddingHistory,
  getLatestBidList
}
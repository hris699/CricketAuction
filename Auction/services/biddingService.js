const bidTable = require("../common-function/bidding_history_table.json");
const { Sequelize } = require("sequelize");
const axios = require("axios")
let BiddingHistory;
const setBiddingHistory = async (bidding_history) => {
  BiddingHistory = bidding_history;
};

const addBiddingHistory = async (auctionId, teamId, playerId, lastBid, currentBid) => {
 console.log("lastBid ",lastBid)
  let biddingDetails = {
    [bidTable.AUCTION_ID]: auctionId,
    [bidTable.TEAM_ID]: teamId,
    [bidTable.PLAYER_ID]: playerId,
    [bidTable.LAST_BID]: lastBid,
    [bidTable.CURRENT_BID]: currentBid
  };
  const bidEntry = await BiddingHistory.create(biddingDetails);
  if (bidEntry)
    return bidEntry;
  else
    return false;
};
//Internally used in web socket and uses a public API.
const getLatestBidList = async (auctionId, playerId) => {
  const maxBidQuery = await BiddingHistory.findAll({
    attributes: [
      [Sequelize.fn("MAX", Sequelize.literal(bidTable.CURRENT_BID)),
        "bh_current_bid",
      ],
      bidTable.TEAM_ID,
      bidTable.LAST_BID
    ],
    where: {
      [bidTable.AUCTION_ID]: auctionId,
      [bidTable.PLAYER_ID]: playerId
    },
    order:[["bh_current_bid", "DESC"]],
    group: [bidTable.TEAM_ID]
  });
  console.log(maxBidQuery);
  let teamIds = maxBidQuery.map((ids) => ids.dataValues.bh_team_id);
  var tList = await axios.post(`http://${process.env.TEAMS_MICROSERVICE_PORT}/api/teams/details`, { teamIds });
  const mergedArray = []
  maxBidQuery.map((item) => {
    tList.data.map((item2) => {
      if (item.dataValues.bh_team_id === item2.t_id) {
        const teamId = item2.t_id
        const teamName = item2.t_name
        const teamLogo = item2.t_logo
        const teamUserId = item2.t_user_id
        const teamLastBid = item.dataValues.bh_current_bid
        const teamPreviousBid = item.dataValues.bh_last_bid
        mergedArray.push({ teamId, teamName, teamLogo, teamUserId, teamLastBid,teamPreviousBid })
      }
    })
  })
  if (mergedArray.length > 0) {
    return mergedArray;
  } else {
    return false;
  }
};
module.exports = {
  setBiddingHistory,
  addBiddingHistory,
  getLatestBidList
}
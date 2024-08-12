const { checkDateDifference } = require("../common-function/util");
const playerTable = require("../common-function/auction_player_table.json");
const teamTable = require("../common-function/auction_team_table.json");
const auctionTeamService = require("../services/auctionTeamService")
const utilityConstant = require("../common-function/utilityConstant");
const auctionService = require('../services/auctionService');
const axios = require("axios");
let { Email, Sms, NotificationEvent } = require('awshelper/Notification')
const { sendEventToSQS } = require('awshelper/SQSHelper')
let email
let sms
let notificationEvent
const { Op } = require("sequelize");
const { config } = require("aws-sdk");
let AuctionPlayer;

exports.setAuctionPlayer = async (auction_player) => {
  AuctionPlayer = auction_player;
};
exports.addAuctionPlayer = async (auctionId, playerId, baseValue, token) => {
  let auctionPlayerDetails = {
    [playerTable.AUCTION_ID]: auctionId,
    [playerTable.PLAYER_ID]: playerId,
    [playerTable.SOLD_STATUS]: utilityConstant.approval_status_pending,
    [playerTable.BASE_VALUE]: baseValue
  };
  const auctionPlayer = await AuctionPlayer.create(auctionPlayerDetails);
  if (auctionPlayer) {
    if (process.env.NODE_ENV != 'local') {
      const config = {
        headers: {
          Authorization: token
        }
      }
      console.log("Port of Player microservice :- ", process.env.PLAYERS_MICROSERVICE_PORT);
      var listOfPlayerDetails = await axios.post(`http://${process.env.PLAYERS_MICROSERVICE_PORT}/api/players/details`, { "player_id": playerId }, config);

      listOfPlayerDetails.data.map(async (player) => {
        const phoneNumberOfUser = "+91" + player.p_contact;
        const emailOfUser = player.p_email;

        email = new Email(process.env.EMAIL_SUBJECT, process.env.EMAIL_PLAYER_MESSAGE, emailOfUser);
        sms = new Sms(process.env.PHONE_PLAYER_MESSAGE, phoneNumberOfUser);
        notificationEvent = new NotificationEvent(email, sms)

        console.log("Notification Event", notificationEvent)

        await sendEventToSQS(notificationEvent)
      })
    }
    return auctionPlayer;
  } else {
    return false;
  }

};

exports.deleteAuctionPlayer = async (playerId, auctionId) => {

  const result = await auctionService.getAuctionById(auctionId);
  if (!result) {
    return "Not Found";
  }
  const checkDateDifferenceResult = await checkDateDifference(result.dataValues.a_start_time);

  if (checkDateDifferenceResult) {
    const deleteResult = await AuctionPlayer.destroy({
      where: { ap_player_id: playerId, ap_auction_id: auctionId },
    });
    if (deleteResult) {
      return "Deleted successfully";
    } else {
      return "Already Deleted";
    }
  } else {
    return "Cannot Delete";
  }
}

exports.getPlayerList = async (auctionId) => {
  let response = await AuctionPlayer.findAll({
    where: {
      [playerTable.AUCTION_ID]: auctionId
    }
  })

  return { response };
}

exports.getPlayersinTeam = async (auction_id, team_id, token) => {
  let playersParticipating = await AuctionPlayer.findAll({
    attributes: [
      playerTable.PLAYER_ID,
      playerTable.BASE_VALUE,
      playerTable.SOLD_VALUE,
    ],
    where: {
      [playerTable.AUCTION_ID]: auction_id,
      [playerTable.SOLD_STATUS]: utilityConstant.player_sold_status,
      [playerTable.TEAM_ID]: team_id
    },
  });
  var player_id = playersParticipating.map(
    (player) => player.dataValues.ap_player_id
  );
  var config = {
    headers: {
      Authorization: token,
      isSocket:true
    },
  };
  var response = await axios.post(`http://${process.env.PLAYERS_MICROSERVICE_PORT}/api/players/details`, { player_id }, config);
  console.log(response.data);
  const resultArray = response.data.map((secondItem) => {
    const matchingFirstItem = playersParticipating.find(
      (firstItem) => 
        firstItem.dataValues.ap_player_id === secondItem.p_id
    );
    return {
      ...secondItem,
      ap_base_value: matchingFirstItem.dataValues.ap_base_value,
      ap_sold_value: matchingFirstItem.dataValues.ap_sold_value,
    };
  });
  if (resultArray) {
    return resultArray;
  } else {
    return false;
  }
}

exports.getPlayerCountTeamsDetails = async (auction_id) => {
  let teamList = await auctionTeamService.getTeamsInAuction(auction_id);
  console.log("teamList", teamList);
  let details = await Promise.all(teamList.map(async (team) => {
    const playerCount = await AuctionPlayer.count({
      col: [playerTable.PLAYER_ID],
      where: {
        [playerTable.AUCTION_ID]: auction_id,
        [playerTable.TEAM_ID]: team.t_id
      }
    });
    const walletBalance = await auctionTeamService.getTeamWalletBalanceForAuction(auction_id, team.t_id)
    console.log("walletBalance", walletBalance);
    return {
      team_id: team.t_id,
      team_name: team.t_name,
      team_logo: team.t_logo,
      team_bought_players: playerCount,
      team_wallet_balance: walletBalance ? walletBalance.dataValues[teamTable.CURRENT_WALLET_BALANCE] : 0
    };
  }));
  console.log("details", details);
  return details;
};

exports.updatePlayerSoldStatus = async (playerSoldDetails) => {
  try {
    const auctionId = playerSoldDetails.auction_id;
    const playerId = playerSoldDetails.player_id;
    const auctionPlayerDetails = {
      [playerTable.TEAM_ID]: playerSoldDetails.team_id,
      [playerTable.SOLD_VALUE]: playerSoldDetails.sold_value,
      [playerTable.SOLD_STATUS]: playerSoldDetails.sold_status
    }
    const result = await AuctionPlayer.update(auctionPlayerDetails, {
      where: {
        [playerTable.AUCTION_ID]: auctionId,
        [playerTable.PLAYER_ID]: playerId
      }
    })
    if (result[0]) {
      return "Player sold status updated successfully";
    }
    else {
      return "Player not found or already updated";
    }
  }
  catch (error) {
    console.log("Error ", error);
    return "There seems to be some issue.Sorry for inconvenience.";
  }
}

const convertArrayToObject = (array, key) => {
  const initialValue = {};
  return array.reduce((obj, item) => {
    let result;
    if (Object.keys(obj).includes(item[key])) {
      obj[item[key]].push(item);
      result = {
        ...obj,
        [item[key]]: obj[item[key]]
      }
    } else {
      result = {
        ...obj,
        [item[key]]: [item],
      }
    }
    return result;
  }, initialValue);
};

exports.getSoldUnsoldPlayers = async (auction_id, soldStatus, token) => {
  let playersParticipating = await AuctionPlayer.findAll({
    attributes: [
      playerTable.PLAYER_ID,
      playerTable.BASE_VALUE,
      playerTable.SOLD_VALUE,
      playerTable.TEAM_ID
    ],
    where: {
      [playerTable.AUCTION_ID]: auction_id,
      [playerTable.SOLD_STATUS]: soldStatus,
    },
  });
  var player_id = playersParticipating.map(
    (player) => player.dataValues.ap_player_id
  );
  let teamIds = playersParticipating.map(
    (player) => player.dataValues.ap_team_id
  );
  var config = {
    headers: {
      Authorization: token,
    },
  };
  var response = await axios.post(`http://${process.env.PLAYERS_MICROSERVICE_PORT}/api/players/details`, { player_id }, config);
  var tList = await axios.post(`http://${process.env.TEAMS_MICROSERVICE_PORT}/api/teams/details`, { teamIds }, config);
 
  var teamDetails = tList.data;
  let playerDetails = response.data;
  
  const resultArray = playersParticipating.map(auction_player=>{
    const teamDetail = teamDetails.find(
      (team) => auction_player.dataValues.ap_team_id === team.t_id
    );
    const playerDetail = playerDetails.find(
      (player) => auction_player.dataValues.ap_player_id === player.p_id
    );
    return {
      ...playerDetail,
      teamName: teamDetail.t_name,
      ap_base_value: auction_player.dataValues.ap_base_value,
      ap_sold_value: auction_player.dataValues.ap_sold_value,
    }
  })
  var playersDetailById = await convertArrayToObject(resultArray, utilityConstant.player_type);
  if (playersDetailById) {
    return playersDetailById;
  } else {
    return false;
  }
};

exports.getPlayersInAuction = async (auctionId, token) => {

  var playerIds = await getPlayerIdList(auctionId);
  console.log("playerIds", playerIds);
  let player_id = [];
  var list2 = [];
  playerIds.map((item) => {
    player_id.push(item.ap_player_id);
    const playerId = item.ap_player_id;
    const baseValue = item.ap_base_value;
    list2.push({ playerId, baseValue });
  })
  var config = {
    headers: {
      Authorization: token
    }
  }
  var APIResponse = await axios.post(`http://${process.env.PLAYERS_MICROSERVICE_PORT}/api/players/details`, { player_id }, config);

  var playerDetails = APIResponse.data;

  const playerArray = [];
  playerDetails.map((item) => {
    list2.map((item2 => {
      if (item.p_id === item2.playerId) {
        const baseValue = item2.baseValue;
        const p_id = item.p_id;
        const p_name = item.p_name;
        const p_age = item.p_age;
        const p_contact = item.p_contact;
        const p_image = item.p_image;
        const p_type = item.p_type;
        playerArray.push({ p_id, p_name, p_age, p_contact, p_image, p_type, baseValue })
      }
    }))
  })
  console.log("Player Final Details", playerArray)
  if (playerArray) {
    return playerArray;
  } else {
    return false;
  }
}

const getPlayerIdList = async (auctionId) => {
  let response = await AuctionPlayer.findAll({
    where: {
      [playerTable.AUCTION_ID]: auctionId
    }
  })
  return response;
}
const getPlayersByStatus = async (auctionId, status) => {
  let response = await AuctionPlayer.findAll({
    where: {
      [playerTable.AUCTION_ID]: auctionId,
      [playerTable.SOLD_STATUS]: status
    }
  })
  return response;
}
exports.getPlayerStatusInAuction = async (playerId) => {
  const playerAuctionDetails = await AuctionPlayer.findAll({
    where: {
      [playerTable.PLAYER_ID]: playerId,
    }
  })
  console.log("playerAuctionDetails", playerAuctionDetails);

  const playerAuction = playerAuctionDetails.map((auction) => {
    return {
      auctionId: auction.dataValues.ap_auction_id
    }
  })
  console.log("player auction", playerAuction);
  const auctionDetails = await auctionService.getEndTimeAuction(playerAuction);
  const playerAuctionStatus = auctionDetails.map(auction => ({ ...auction, ...playerAuction.find(playerAuction => playerAuction.auctionId === auction.auctionId) }))
  console.log("detaill ", playerAuctionStatus);
  return playerAuctionStatus;
}

exports.deleteAuctionPlayerAssociation = async (playerId, auctionIds) => {
  const deleteResponse = await AuctionPlayer.destroy({
    where: {
      [playerTable.AUCTION_ID]: auctionIds,
      [playerTable.PLAYER_ID]: playerId
    }
  })

  console.log("deleteResponse", deleteResponse);
  if (deleteResponse == 1) {
    return true;
  }
  return false;
}

exports.getPlayersInAuctionByAuctionId = async (auctionId, status, isSocket) => {
  try {
    console.log("AuctionId", auctionId);
    var playerIds = await getPlayersByStatus(auctionId, status);
    let player_id = [];
    var list2 = [];
    console.log("PlayerIds >>>>>>>>>>>", playerIds);
    playerIds.map((item) => {
      player_id.push(item.ap_player_id);
      const playerId = item.ap_player_id;
      const baseValue = item.ap_base_value;
      list2.push({ playerId, baseValue });
    })

    var config = {
      headers: {
        WebSocket: isSocket
      }
    }
    console.log("Config ", config);
    var APIResponse = await axios.post(`http://${process.env.PLAYERS_MICROSERVICE_PORT}/api/players/details`, { player_id }, config);
    //console.log("response of post api  ", APIResponse.data);
    var playerDetails = APIResponse.data;

    const playerArray = [];
    playerDetails.map((item) => {
      list2.map((item2 => {
        if (item.p_id === item2.playerId) {
          const baseValue = item2.baseValue;
          const p_id = item.p_id;
          const p_name = item.p_name;
          const p_age = item.p_age;
          const p_contact = item.p_contact;
          const p_image = item.p_image;
          const p_type = item.p_type;
          playerArray.push({ p_id, p_name, p_age, p_contact, p_image, p_type, baseValue })
        }
      }))
    })
    return playerArray;
  } catch (error) {
    console.log(error)
    throw error;
  }
}

exports.addSelectedPlayersInAuction = async (auctionId, selectedPlayers) => {

  let checkAuctionExistence = await auctionService.getAuctionById(auctionId);
  if (!checkAuctionExistence) {
    return "Not Found";
  }
  if (selectedPlayers.length === 0) {
    return "No Players Selected";
  }
  const checkDateDifferenceResult = await checkDateDifference(checkAuctionExistence.dataValues.a_start_time);
  if (checkDateDifferenceResult) {
    const findExistingPlayersResult = await AuctionPlayer.findAll({
      where: {
        ap_player_id: {
          [Op.in]: selectedPlayers.map((entry) => {
            return entry.player_id
          })
        }, ap_auction_id: auctionId
      },
    });

    const filterResult = selectedPlayers.filter(selectedPlayer => !findExistingPlayersResult.some(findResult => findResult.ap_player_id === selectedPlayer.player_id))
    let auctionPlayerDetails = [];

    if (filterResult.length === 0) {
      return "Selected Player(s) already added."
    }
    filterResult.map((player) => {
      auctionPlayerDetails.push({
        [playerTable.AUCTION_ID]: auctionId,
        [playerTable.PLAYER_ID]: player.player_id,
        [playerTable.SOLD_STATUS]: utilityConstant.approval_status_pending,
        [playerTable.BASE_VALUE]: player.base_value

      })
    })

    const addResult = await AuctionPlayer.bulkCreate(auctionPlayerDetails);
    console.log("addresult", addResult);

    const deleteResult = await AuctionPlayer.destroy({
      where: {
        ap_player_id: {
          [Op.notIn]: selectedPlayers.map((entry) => {
            return entry.player_id
          })
        }, ap_auction_id: auctionId
      },
    });
    console.log("Players Deleted Successfully", deleteResult);
    if (addResult.length != 0 && deleteResult >= 0) {
      return "Selected Players added";
    }
  } else {
    return "Cannot add selected players";
  }
}

exports.getTotalMoneySpentByAuctionId = async (auctionId) => {
  let moneySpent = await AuctionPlayer.sum(playerTable.SOLD_VALUE, {
    where: {
      [playerTable.AUCTION_ID]: auctionId,
      [playerTable.SOLD_STATUS]: 'sold'
    },
  });
  return moneySpent;
}
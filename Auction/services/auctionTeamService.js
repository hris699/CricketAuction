const { getUserDetails, sendNotification } = require("../common-function/util");
const teamTable = require("../common-function/auction_team_table.json");
const auctionService = require('../services/auctionService');
const auctionTeamService = require('../services/auctionTeamService');
const utilityConstant = require("../common-function/utilityConstant");
const axios = require("axios");

let AuctionTeam;
exports.setAuctionTeam = async (auction_team) => {
  AuctionTeam = auction_team;
};

exports.requestToRegisterForAuction = async (auctionId, userId, token) => {
  var config = {
    headers: {
      Authorization: token,
    },
  };

  var teamList = await axios.get(`http://${process.env.TEAMS_MICROSERVICE_PORT}/api/users/${userId}/teams`,config);
 
  if(teamList.data === "No teams exists for UserId"){
    return "No team exists for this user."
  }
  let teamId = teamList.data[0].t_id;
  const purseValue = await auctionService.getPurseValue(auctionId);
  if(!purseValue){
    return "Either auction is ongoing or already completed.";
  }
  let auctionTeamDetails = {
    [teamTable.AUCTION_ID]: auctionId,
    [teamTable.TEAM_ID]: teamId,
    [teamTable.CURRENT_WALLET_BALANCE]: purseValue,
    [teamTable.APPROVAL_STATUS]: utilityConstant.approval_status_pending,
  };
  const alreadyExists = await AuctionTeam.findAll({
    where: {
      [teamTable.AUCTION_ID]: auctionId,
      [teamTable.TEAM_ID]: teamId,
    },
  });

  if (alreadyExists.length > 0) {
    if(alreadyExists[0].dataValues.at_approval_status === utilityConstant.approval_status_pending)
      return "Request already exists.";
    else
      return "Already participating.";
  } else {
    await AuctionTeam.create(auctionTeamDetails);
    return "Request sent successfully.";
  }
};

exports.approvalOrDenialOfRegisterForAuction = async (auctionId, teamId, status) => {
  let approvalStatus = {
    [teamTable.APPROVAL_STATUS]: status,
  };
  let deniedStatus = {
    [teamTable.APPROVAL_STATUS]: utilityConstant.approval_status_denied
  };
  const teamsAccepted = await AuctionTeam.findAll({
    where: {
      [teamTable.AUCTION_ID]: auctionId,
      [teamTable.APPROVAL_STATUS]: utilityConstant.approval_status_accepted
    },
  });
  console.log("team accepted", teamsAccepted.length);
  let teamsAllowed = await auctionService.maxTeamAllowed(auctionId);
  console.log("teamallowed", teamsAllowed);
  console.log(status)
  console.log(utilityConstant.approval_status_accepted)
  console.log(status === utilityConstant.approval_status_accepted)
  console.log(teamsAllowed > teamsAccepted.length)
  console.log((status === utilityConstant.approval_status_accepted && teamsAllowed > teamsAccepted.length))
  console.log((status === utilityConstant.approval_status_accepted && teamsAllowed > teamsAccepted.length) || status === utilityConstant.approval_status_denied)
  if ((status === utilityConstant.approval_status_accepted && teamsAllowed > teamsAccepted.length) || status === utilityConstant.approval_status_denied) {
    await AuctionTeam.update(approvalStatus, {
      where: {
        [teamTable.AUCTION_ID]: auctionId,
        [teamTable.TEAM_ID]: teamId,
      },
    });
    console.log("here1")
    if (process.env.NODE_ENV != 'local') {
    const teamList = await auctionTeamService.getTeamsUserIds([teamId])
    const usersDetailsObj = await getUserDetails(process.env.AWS_COGNITO_USER_POOL_ID, teamList)
    await sendNotification(usersDetailsObj, process.env.EMAIL_APPROVE_DENY_MESSAGE, process.env.PHONE_APPROVE_DENY_MESSAGE)
    }
    console.log("here2")
    return "Updated Successfully";
  } else {
    console.log("orrrrrr")
    await AuctionTeam.update(deniedStatus, {
      where: {
        [teamTable.AUCTION_ID]: auctionId,
        [teamTable.TEAM_ID]: teamId,
      },
    });
    if (process.env.NODE_ENV != 'local') {
      const teamList = await auctionTeamService.getTeamsUserIds([req.body.team_id])
      const usersDetailsObj = await getUserDetails(process.env.AWS_COGNITO_USER_POOL_ID, teamList)
      await sendNotification(usersDetailsObj, process.env.EMAIL_APPROVE_DENY_MESSAGE, process.env.PHONE_APPROVE_DENY_MESSAGE)
    }
    return "Participation full";
  }
};

exports.getAuctionByTeamId = async (teamId) => {
  let responseData = [];
  let arrayofAuctionIds = [];
  let Auctions = await AuctionTeam.findAll({
    where: { [teamTable.TEAM_ID]: teamId }
  })
  if (Auctions.length === 0) {
    return false;
  }
  else {
    arrayofAuctionIds = Auctions.map((item) => item.at_auction_id);
    let auctionNameAndStartTime = await auctionService.getAuctionByIds(arrayofAuctionIds);
    console.log("resposne", auctionNameAndStartTime);
    let index = 0;
    responseData = Auctions.map((item) => {
      let auctionData = {
        "auction_id": auctionNameAndStartTime[index].dataValues["a_id"],
        "auction_name": auctionNameAndStartTime[index].dataValues["a_name"],
        "auction_start_time": auctionNameAndStartTime[index].dataValues["a_start_time"],
        "auction_team_current_wallet": item[teamTable.CURRENT_WALLET_BALANCE]
      }
      index++;
      return auctionData;
    })
    return responseData;
  }
};

exports.getTeamList = async (auctionId) => {
  let response = await AuctionTeam.findAll({
    attributes: [teamTable.TEAM_ID],
    where: {
      [teamTable.AUCTION_ID]: auctionId,
      [teamTable.APPROVAL_STATUS]: utilityConstant.approval_status_accepted
    }
  })
  return response;
}

exports.getTeamsInAuction = async (auction_id, token) => {
  var teamIdList = await AuctionTeam.findAll({
    attributes: [teamTable.TEAM_ID],
    where: {
      [teamTable.AUCTION_ID]: auction_id,
      [teamTable.APPROVAL_STATUS]: utilityConstant.approval_status_accepted
    }
  });
  console.log("teamIdList", teamIdList);
  let teamIds = teamIdList.map(ids => ids.at_team_id);
    var config = {
      headers: {
        Authorization: token
      }
    }
  var tList = await axios.post(`http://${process.env.TEAMS_MICROSERVICE_PORT}/api/teams/details`, { teamIds }, config);
 
  var teamList = tList.data.map(team => ({ t_id: team.t_id, t_name: team.t_name, t_logo: team.t_logo }));
  return teamList;
}

exports.getTeamStatusInAuction = async (teamId) => {
  const teamAuctionDetails = await AuctionTeam.findAll({
    where: {
      [teamTable.TEAM_ID]: teamId,
      [teamTable.APPROVAL_STATUS]: [utilityConstant.approval_status_accepted, utilityConstant.approval_status_pending]
    }
  })
  if (teamAuctionDetails.length === 0) {
    return teamAuctionDetails;
  }
  const teamAuction = teamAuctionDetails.map((auction) => {
    return {
      auctionId: auction.dataValues.at_auction_id,
      teamStatus: auction.dataValues.at_approval_status
    }
  })
  const auctionDetails = await auctionService.getEndTimeAuction(teamAuction);
  const teamAuctionStatus = auctionDetails.map(auction => ({ ...auction, ...teamAuction.find(teamAuction => teamAuction.auctionId === auction.auctionId) }))
  return teamAuctionStatus;
}

exports.getTeamWalletBalanceForAuction = async (auction_id, team_id) => {
  let walletBalance = await AuctionTeam.findOne({
    attributes: [teamTable.CURRENT_WALLET_BALANCE],
    where: {
      [teamTable.AUCTION_ID]: auction_id,
      [teamTable.TEAM_ID]: team_id
    }
  });
  return walletBalance;
}

exports.deleteAuctionTeam = async (teamId, auctionIds) => {
  const deleteResponse = await AuctionTeam.destroy({
    where: {
      [teamTable.AUCTION_ID]: auctionIds,
      [teamTable.TEAM_ID]: teamId
    }
  })
  if (deleteResponse == 1) {
    return true;
  }
  return false;
}

exports.getTeamInAuctionByUserId = async (auctionId, userId, token) => {
  var teamIds = await auctionTeamService.getTeamList(auctionId);
    var config = {
      headers: {
        Authorization: token
      }
    } 
  var teamList = await axios.get(`http://${process.env.TEAMS_MICROSERVICE_PORT}/api/users/${userId}/teams`, config);
  let teamsList = teamList.data;
  console.log("teamsList>>>>>>>>",teamsList);
  let team = [];
  team = teamsList.filter(el => {
    return teamIds.find(element => {
      return element[teamTable.TEAM_ID] === el.t_id;
    });
  });
  console.log(team);
  return team;
}

exports.getTeamsUserIds = async (teamIds, token) => {
    var config = {
      headers: {
        Authorization: token
      }
    }
  var listOfAuctionTeamsID = await axios.post(`http://${process.env.TEAMS_MICROSERVICE_PORT}/api/teams/details`, { teamIds }, config);
  var teamList = listOfAuctionTeamsID.data.map(team => (team.t_user_id));
  
  return teamList;
}

exports.getTeamRequestForAuction = async (token) => {
  const upcomingAuctionDetails = await auctionService.getUpcomingAuction();
  if (upcomingAuctionDetails.length > 0) {
    var auctionId = [];
    upcomingAuctionDetails.map((items) => {
      const auction_id = items.dataValues.a_id;
      auctionId.push(auction_id);
    })
    const TeamRequestList = await AuctionTeam.findAll({
      Attributes: [teamTable.TEAM_ID, teamTable.AUCTION_ID],
      where: {
        [teamTable.AUCTION_ID]: auctionId,
        [teamTable.APPROVAL_STATUS]: utilityConstant.approval_status_pending
      }
    })
    const teamIds = [];
    TeamRequestList.map((item) => {
      const teamId = item.dataValues.at_team_id;
      teamIds.push(teamId);
    })

    var totalData = [];
    upcomingAuctionDetails.map((items) => {
      TeamRequestList.map((item) => {
        if (item.at_auction_id === items.a_id) {
          const auctionId = items.dataValues.a_id;
          const auctionName = items.dataValues.a_name;
          const t_id = item.dataValues.at_team_id;
          totalData.push({ auctionId, auctionName, t_id });
        }
      })
    })
      var config = {
        headers: {
          Authorization: token
        }
      }
    var tList = await axios.post(`http://${process.env.TEAMS_MICROSERVICE_PORT}/api/teams/details`, { teamIds }, config);
    var teamList = tList.data.map(team => ({ t_id: team.t_id, t_name: team.t_name, t_logo: team.t_logo }));
    console.log("teamList", teamList);
    const pendingRequestDetails = teamList.map((items) => ({
      ...items,
      ...totalData.find((item) => item.t_id === items.t_id)
    }))
    return pendingRequestDetails;
  } else {
    return false;
  }
}
//Internally used in web socket and uses public API.
exports.getTeamDetailsInAuction = async (auctionId) => {
  var auctionTeamList = await AuctionTeam.findAll({
    attributes: [
      teamTable.TEAM_ID,
      teamTable.CURRENT_WALLET_BALANCE
    ],
    where: {
      [teamTable.AUCTION_ID]: auctionId,
      [teamTable.APPROVAL_STATUS]: utilityConstant.approval_status_accepted
    }
  });
  console.log("teamIdList", auctionTeamList);
  let teamIds = auctionTeamList.map(ids => ids.at_team_id);
  console.log("Team_in_Auction_", auctionTeamList)
  console.log("Port of Teams microservice :- ", process.env.TEAMS_MICROSERVICE_PORT);
  var tList = await axios.post(`http://${process.env.TEAMS_MICROSERVICE_PORT}/api/teams/details`, { teamIds });
  var teamList =[]
  tList.data.map((team) =>{
    
      teamList.push({
          ...team, 
          ...(auctionTeamList.find((itmInner) => itmInner.dataValues.at_team_id === team.t_id)).dataValues}
         );
  
  } 
    );
  console.log(teamList)
  return teamList;
}
exports.updateCurrentWallet = async (auctionId, teamId, walletBalance) => {
  const data = {
    [teamTable.CURRENT_WALLET_BALANCE]: walletBalance,
  };
  const currentWallet = await AuctionTeam.update(data, {
    where: {
      [teamTable.AUCTION_ID]: auctionId,
      [teamTable.TEAM_ID]: teamId,
    },
  });
  return currentWallet;
}
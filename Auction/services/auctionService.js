const { getSignedUrl, getUserDetails, sendNotification } = require("../common-function/util");
const auctionTable = require("../common-function/auction_table.json");
const auctionTeamService = require('../services/auctionTeamService');
const auctionPlayerService = require('../services/auctionPlayerService');
const transactionHistoryService = require('../services/transactionService')
const { Op, Sequelize } = require("sequelize");
const uuid = require('uuid');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

let Auction;
exports.setAuction = async (auction) => {
  Auction = auction;
};

exports.getAuctionByIds = async (taskIds) => {
  let auctionNameAndStartTime = await Auction.findAll({
    attributes: [auctionTable.AUCTION_ID, auctionTable.AUCTION_NAME, auctionTable.START_TIME],
    where: {
      [auctionTable.AUCTION_ID]: {
        [Op.in]: taskIds
      },
    },
  });
  return auctionNameAndStartTime;
};

exports.addAuction = async (body, file) => {
  let auctionDetails = {
    [auctionTable.AUCTION_NAME]: body.auction_name,
    [auctionTable.START_TIME]: body.start_time,
    [auctionTable.END_TIME]: body.end_time,
    [auctionTable.PURSE_VALUE]: parseInt(body.purse_value),
    [auctionTable.NO_OF_TEAMS]: parseInt(body.no_of_teams),
    [auctionTable.MIN_TEAM_SIZE]: parseInt(body.min_team_size),
    [auctionTable.MAX_TEAM_SIZE]: parseInt(body.max_team_size),
    [auctionTable.IS_DELETED]: body.is_deleted,
    [auctionTable.CREATED_BY]: body.created_by,
    [auctionTable.AUCTION_COUNTRY]: body.auction_country,
    [auctionTable.AUCTION_DESCRIPTION]: body.auction_description
  };
  let imageUrl = null;
  if (file) {
    console.log("image");
    if (process.env.NODE_ENV == 'local') {
      imageUrl = file.filename;
    } else {
      console.log("In development");
      const imageName = body.auction_name + uuid.v4() + '.png';
      const s3Response = await uploadImgInS3(imageName, file.buffer);
      imageUrl = s3Response.key;
    }
  }
  auctionDetails[auctionTable.AUCTION_IMAGE] = imageUrl;
  const duplicateAuctionName= await Auction.findOne({where: { 
    [auctionTable.AUCTION_NAME]: body.auction_name,
    [auctionTable.IS_DELETED]: 0
  }})
  if(duplicateAuctionName!= null){
    return "Auction Exists"
  }else if (parseInt(body.min_team_size) > parseInt(body.max_team_size)) {
    return "team size issue";
  } else {
    const auction = await Auction.create(auctionDetails);
    return auction;
  }
};

exports.getAllAuctions = async () => {
  let auction = await Auction.findAll({
    where :{
      [auctionTable.IS_DELETED] : 0
    }
  });
  if (process.env.NODE_ENV != 'local') {
    await Promise.all(auction.map(async item => {
      if(item.dataValues.a_image){  
        let imageSignedUrl = await getSignedUrl(item.dataValues.a_image);
        item.a_image = imageSignedUrl;
      }
     }))
  }
  if (auction)
    return auction;
  else
    return false; 
};

exports.updateAuction = async (auctionId, body, file, token) => {
  if (parseInt(body.min_team_size) > parseInt(body.max_team_size)) {
    return "team size issue";
  } else {
    let updatedAuctionDetails = {
      [auctionTable.AUCTION_NAME]: body.auction_name,
      [auctionTable.START_TIME]: body.start_time,
      [auctionTable.END_TIME]: body.end_time,
      [auctionTable.PURSE_VALUE]: parseInt(body.purse_value),
      [auctionTable.NO_OF_TEAMS]: parseInt(body.no_of_teams),
      [auctionTable.MIN_TEAM_SIZE]: parseInt(body.min_team_size),
      [auctionTable.MAX_TEAM_SIZE]: parseInt(body.max_team_size),
      [auctionTable.IS_DELETED]: body.is_deleted,
      [auctionTable.CREATED_BY]: body.created_by,
      [auctionTable.AUCTION_COUNTRY]: body.auction_country,
      [auctionTable.AUCTION_DESCRIPTION]: body.auction_description
    };
    let auction = await Auction.findOne({ where: { [auctionTable.AUCTION_ID]: auctionId, [auctionTable.IS_DELETED]: 0 } })
    if (auction == null || auction[0] == 0) {
      return "Not Found";
    }
    const duplicateAuctionName= await Auction.findOne({where:{
      [auctionTable.AUCTION_NAME]: body.auction_name,
      [auctionTable.AUCTION_ID]:{
        [Op.not]: auctionId
      },
      [auctionTable.IS_DELETED] : 0
    }})
    console.log("duplicateAuctionName",duplicateAuctionName)
    if(duplicateAuctionName!= null){
      return "Duplicate Auction Name";
  }
    let imageName = null;
    if (file) {
      if (process.env.NODE_ENV == 'local') {
        imageName = file.filename;
      } else {
        imageName = body.auction_name + uuid.v4() + '.png';
        const s3Response = await uploadImgInS3(imageName, file.buffer);
      }
      updatedAuctionDetails[auctionTable.AUCTION_IMAGE] = imageName;
    }
    

    await Auction.update(updatedAuctionDetails, {
      where: {
        [auctionTable.AUCTION_ID]: auctionId
      },
    });
    if (process.env.NODE_ENV != 'local') {
      //To Send Notification about auction updation to team owner
      const teamIds = await auctionTeamService.getTeamList(auctionId)
      console.log("ListOfAuctionTeam", teamIds)
      let teamIdList = teamIds.map(ids => ids.at_team_id);
      console.log("team Id List", teamIdList)
      const teamList = await auctionTeamService.getTeamsUserIds(teamIdList, token)
      const usersDetailsObj = await getUserDetails(process.env.AWS_COGNITO_USER_POOL_ID, teamList)
      await sendNotification(usersDetailsObj, process.env.EMAIL_UPDATE_MESSAGE, process.env.PHONE_UPDATE_MESSAGE)
    }
    return "Updated Successfully";
  }
};

exports.getAuctionById = async (auctionId) => {
  let singleAuction = await Auction.findOne({
    attributes: [auctionTable.AUCTION_IMAGE, auctionTable.START_TIME, auctionTable.AUCTION_NAME, auctionTable.AUCTION_COUNTRY],
    where: {
      [auctionTable.AUCTION_ID]: auctionId,
    },
  });
  if (singleAuction) {
    if (process.env.NODE_ENV != 'local') {
      if(singleAuction.a_image){
        let imageSignedUrl = await getSignedUrl(singleAuction.a_image);
        singleAuction.a_image = imageSignedUrl;
      }
     }
    return singleAuction;
  } else {
    return false;
  }
  

}

exports.deleteAuction = async (auctionId) => {
  const data = {
    [auctionTable.IS_DELETED]: 1,
  };
  const response = await Auction.update(data, {
    where: {
      [auctionTable.AUCTION_ID]: auctionId,
      [auctionTable.IS_DELETED]: 0,
    },
  });
  if (response[0]) {
    return response;
  } else {
    return false;
  }
};

exports.auctionDetail = async (auctionId) => {
  let auctionDetail = await Auction.findOne({
    where: {
      [auctionTable.AUCTION_ID]: auctionId,
      [auctionTable.IS_DELETED]: {
        [Op.ne]: 1,
      },
    },
  });
  if (auctionDetail == null) {
    return false;
  } else {
    console.log(auctionDetail);
    if (process.env.NODE_ENV != 'local') {
      if(auctionDetail.a_image){
        let imageSignedUrl = await getSignedUrl(auctionDetail.a_image);
        auctionDetail.a_image = imageSignedUrl;
      }
     }
    return auctionDetail;
  }
};

exports.maxTeamAllowed = async (auctionId) => {
  let teamsAllowed = await Auction.findOne({
    attributes: [
      auctionTable.NO_OF_TEAMS
    ],
    where: {
      [auctionTable.AUCTION_ID]: auctionId
    }
  });
  if (teamsAllowed.dataValues)
    return teamsAllowed.dataValues.a_no_of_teams;
  else
    return false;
}

const uploadImgInS3 = async (imageName, imageBuffer) => {
  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: imageName,
    Body: imageBuffer,
  };
  const result = await s3.upload(s3Params).promise();
  console.log("S3 RESULT ---", result)
  return result;

};

exports.getEndTimeAuction = async (teamAuction) => {
  const auctionId = teamAuction.map((auctions) => auctions.auctionId)
  const auctionResult = await Auction.findAll({
    attributes: [
      auctionTable.AUCTION_ID,
      auctionTable.AUCTION_NAME,
      auctionTable.START_TIME
    ],
    where: {
      [auctionTable.AUCTION_ID]: auctionId,
      [auctionTable.END_TIME]: null
    }
  })
  const auctionDetails = auctionResult.map((auction) => {
    return {
      auctionId: auction.dataValues.a_id,
      auctionName: auction.dataValues.a_name,
      auctionStartTime: auction.dataValues.a_start_time
    }
  })
  console.log("auctionDetails", auctionDetails);
  return auctionDetails;
}

exports.getOngoingAuction = async () => {

  const auctionResult = await Auction.findAll({
    attributes: [
      auctionTable.AUCTION_ID,
      auctionTable.AUCTION_NAME,
      auctionTable.START_TIME,
      auctionTable.AUCTION_COUNTRY
    ],
    where: {
     [auctionTable.START_TIME] : {[Op.lte] : new Date() },
     [auctionTable.IS_DELETED] : 0 ,
     [auctionTable.END_TIME]: null
    }
  })
  console.log("auctionResult", auctionResult);
  if (auctionResult) {
    return auctionResult;
  } else {
    return false;
  }
}

exports.getUpcomingAuction = async () => {
  const auctionDetails = await Auction.findAll({
    attributes: [
      auctionTable.AUCTION_ID,
      auctionTable.AUCTION_NAME
    ], where: {
      [auctionTable.END_TIME]: null,
      [auctionTable.START_TIME]: {
        [Op.gt]: new Date()
      }
    }
  })
  console.log("auctionDetails", auctionDetails);
  if (auctionDetails) {
    return auctionDetails;
  } else {
    return false;
  }
}

exports.getPurseValue = async (auctionId) => {
  const purseValue = await Auction.findOne({
    attributes: [auctionTable.PURSE_VALUE],
    where: {
      [auctionTable.AUCTION_ID]: auctionId,
      [auctionTable.START_TIME]:{
        [Op.gt]: new Date()
      }
    },
  });
  if (purseValue)
   return purseValue.dataValues.a_purse_value;
  else
   return false;
};

exports.getAuctionDetailsByAuctionId = async (auctionId) => {
  let auctionDetails = await this.getAuctionById(auctionId);
  let totalPlayersInAuction = await  auctionPlayerService.getPlayersInAuction(auctionId);
  let getSoldPlayers = await auctionPlayerService.getSoldUnsoldPlayers(auctionId, "sold");
  let getUnSoldPlayers = await auctionPlayerService.getSoldUnsoldPlayers(auctionId, "unsold");
  let countSoldPlayers= (getSoldPlayers["Batsman"] ? getSoldPlayers["Batsman"].length : 0)+(getSoldPlayers["Bowler"] ? getSoldPlayers["Bowler"].length : 0)+(getSoldPlayers["Wicket-Keeper"] ? getSoldPlayers["Wicket-Keeper"].length : 0)+(getSoldPlayers["All-Rounder"] ? getSoldPlayers["All-Rounder"].length : 0);
  let countUnSoldPlayers= (getUnSoldPlayers["Batsman"] ? getUnSoldPlayers["Batsman"].length : 0)+(getUnSoldPlayers["Bowler"] ? getUnSoldPlayers["Bowler"].length : 0)+(getUnSoldPlayers["Wicket-Keeper"] ? getUnSoldPlayers["Wicket-Keeper"].length : 0)+(getUnSoldPlayers["All-Rounder"] ? getUnSoldPlayers["All-Rounder"].length : 0);
  let totalmoneyspent = await auctionPlayerService.getTotalMoneySpentByAuctionId(auctionId);
  console.log({ "auction_image": auctionDetails[auctionTable.AUCTION_IMAGE],"auction_name": auctionDetails[auctionTable.AUCTION_NAME], "auction_country": auctionDetails[auctionTable.AUCTION_COUNTRY], "auction_players": totalPlayersInAuction.length, "sold_players": countSoldPlayers, "unsold_players": countUnSoldPlayers, "total_money_spent": totalmoneyspent} )
  return { "auction_image": auctionDetails[auctionTable.AUCTION_IMAGE],"auction_name": auctionDetails[auctionTable.AUCTION_NAME], "auction_country": auctionDetails[auctionTable.AUCTION_COUNTRY], "auction_players": totalPlayersInAuction.length, "sold_players":  countSoldPlayers, "unsold_players":  countUnSoldPlayers, "total_money_spent": totalmoneyspent ?? 0} 
}

exports.updateAuctionEndTime = async (auctionId, endTime) => {
  try {
    const auctionEndTime = {
      [auctionTable.END_TIME]: endTime
    }
    const result = await Auction.update(auctionEndTime, {
      where: {
        [auctionTable.AUCTION_ID]: auctionId
      }
    })
    if (result[0]) {
      return "Auction EndTime updated successfully";
    }
    else {
      return "Auction not found or already updated";
    }
  }
  catch (error) {
    console.log("Error ", error);
    return "There seems to be some issue.Sorry for inconvenience.";
  }
}
exports.getTodaysAuction = async () => {
  console.log("In GetTodaysAuction");
  try {
    const auction = await Auction.findAll({
      where: Sequelize.literal(`DATE(a_start_time) = CURDATE()`),
    })
    let auctions =[];
    auction.map(auction=>auctions.push(auction.dataValues));
    return auctions;
  }
  catch (error) {
    console.log(error)
  }
}

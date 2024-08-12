const {getSignedUrl, successResponse, errorResponse, checkDateDifference } = require("../common-function/util");
const playerTable = require("../common-function/player_table.json")
const { regexForS3ObjectUrl } = require("../common-function/regEx");
const uuid = require('uuid');
const AWS = require('aws-sdk');
const { response } = require("express");
const { default: axios } = require("axios");
const s3 = new AWS.S3();

let Player;
const setPlayer = async (players) => {
    Player = players;
};

const listAllPlayers = async () => {
    let playerDetail = await Player.findAll({
        attributes: [
            "p_id",
            "p_name",
            "p_email",
            "p_age",
            "p_type",
            "p_image",
            "p_contact"
        ], where: {
            [playerTable.PLAYER_IS_DELETED]: 0
        }
    });
    if (process.env.NODE_ENV != 'local') {
        await Promise.all(playerDetail.map(async item => {
            if(item.dataValues.p_image){
                let imageSignedUrl = await getSignedUrl(item.dataValues.p_image);
                item.p_image = imageSignedUrl;
            }
         
        }))
      }
      if (playerDetail)
        return playerDetail;
      else
        return false;

}

const getPlayerByIds = async (playerId) => {
    let playersDetail = await Player.findAll({
        where: {
            [playerTable.PLAYER_ID]: playerId,
        }
    });
    console.log("player details",playersDetail)
    if (process.env.NODE_ENV != 'local') {
        await Promise.all(playersDetail.map(async item => {
            if(item.dataValues.p_image){
                let imageSignedUrl = await getSignedUrl(item.dataValues.p_image);
               item.p_image = imageSignedUrl;
            }
         }))
      }
      if (playersDetail)
        return playersDetail;
      else
        return false;
    
};

const createPlayer = async (playerDetailsInfo, file) => {
    let playerInfo = {
        [playerTable.PLAYER_NAME]: playerDetailsInfo.player_name,
        [playerTable.PLAYER_EMAIL]: playerDetailsInfo.player_email,
        [playerTable.PLAYER_TYPE]: playerDetailsInfo.player_type,
        [playerTable.PLAYER_AGE]: playerDetailsInfo.player_age,
        [playerTable.PLAYER_CONTACT]: playerDetailsInfo.player_contact
    };
    if (playerDetailsInfo[playerTable.PLAYER_NAME] === "" || playerDetailsInfo[playerTable.PLAYER_EMAIL] === "" || playerDetailsInfo[playerTable.PLAYER_TYPE] === "") {
        return "Wrong Input";
    }
        if (file) {
            let imageName
            if (process.env.NODE_ENV === 'local') {
                imageName = file.filename;
            } else {

                imageName = playerDetailsInfo.player_name + uuid.v4() + '.png';
                await uploadImgInS3(imageName, file.buffer)
            }
            playerInfo[playerTable.PLAYER_IMAGE] = imageName;
        }

        const createPlayerResult = await Player.create(playerInfo);
        return createPlayerResult;
  
};

const uploadImgInS3 = async (imageName, file) => {
    const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: imageName,
        Body: file,
        ContentType: 'image/*'
    };
    const result = await s3.upload(s3Params).promise();
    return result;

};

const updatePlayer = async (playerDetailsInfo, player_id, file) => {
    let playerInfo = {
        [playerTable.PLAYER_NAME]: playerDetailsInfo.player_name,
        [playerTable.PLAYER_EMAIL]: playerDetailsInfo.player_email,
        [playerTable.PLAYER_TYPE]: playerDetailsInfo.player_type,
        [playerTable.PLAYER_AGE]: playerDetailsInfo.player_age,
        [playerTable.PLAYER_CONTACT]: playerDetailsInfo.player_contact
    };
    let player = await Player.findOne({ where: { [playerTable.PLAYER_ID]: player_id, [playerTable.PLAYER_IS_DELETED]: 0 } })
    if (player == null || player[0] == 0) {
        return "Player is already deleted or doesn't exists";
    }
    if (playerInfo[playerTable.PLAYER_NAME] === "" || playerInfo[playerTable.PLAYER_EMAIL] === "" || playerInfo[playerTable.PLAYER_TYPE] === "") {
        return "Wrong Input";
    }
        if (file) {
            let imageName
            if (process.env.NODE_ENV === 'local') {
                imageName = file.filename;
            } else {

                imageName = playerInfo[playerTable.PLAYER_NAME] + uuid.v4() + '.png';
                await uploadImgInS3(imageName, file.buffer)
            }
            playerInfo[playerTable.PLAYER_IMAGE] = imageName;
        }
    const updatingPlayer = await Player.update(playerInfo, { where: { [playerTable.PLAYER_ID]: player_id, [playerTable.PLAYER_IS_DELETED]: 0 } })
    return updatingPlayer;
}

const getPlayerAssociation = async (playerId, token) => {
    const playerResponse = await getPlayerByIds(playerId);
    if (playerResponse.length>0) {
        var config = {
            headers: {
              Authorization: token
            }
          } 
        console.log("Port of Auction microservice :- ", process.env.AUCTION_MICROSERVICE_PORT);
        const internalResponse = await axios.get(`http://${process.env.AUCTION_MICROSERVICE_PORT}/api/auctions/players/${playerId}`,config);
        console.log("internal", internalResponse.data);
        return internalResponse.data;
    } else {
        return false;
    }
}

const deletePlayer = async (playerId,auctionParams,startTimes, token) => {
    console.log(auctionParams.length > 2);
    if (auctionParams.length > 2) {
        const checkDateDifferenceResult = await checkDateDifference(startTimes);
        console.log("checkDateDifferenceResult", checkDateDifferenceResult)
        const result = checkDateDifferenceResult.every((val, i, arr) => val === true)
        console.log("result", result);
        if (result === true) {
           let auctionId = auctionParams.substring(1, auctionParams.length - 1).split(",");
            const auctionIds = auctionId.map((item) => {
                console.log(typeof (item));
                return (parseInt(item));
            })
            var config = {
                headers: {
                  Authorization: token
                }
              } 
            console.log("Port of Auction microservice :- ", process.env.AUCTION_MICROSERVICE_PORT);
            var externalAPIResponse = await axios.delete(`http://${process.env.AUCTION_MICROSERVICE_PORT}/api/auctions/players/${playerId}?auction_id=${encodeURIComponent([auctionIds])}`,config);
            if (externalAPIResponse.data === true) {
                console.log("internal response-", externalAPIResponse.data);
            }
            else {
                return false;
            }
        } else {
            console.log("inside    ======== ")
            return "Date is less than 24hrs"
        }
    } 
     const data = {
               [playerTable.PLAYER_IS_DELETED]: 1
             }
    const deletePlayerResponse = await Player.update(data, {
        where: {
            [playerTable.PLAYER_ID]: playerId,
            [playerTable.PLAYER_IS_DELETED]: 0
        }
    })
    console.log("delete Player Response", deletePlayerResponse)
    if (deletePlayerResponse) {
        return true;
    }
    return false;
}

module.exports = {
    listAllPlayers,
    deletePlayer,
    setPlayer,
    createPlayer,
    updatePlayer,
    getPlayerAssociation,
    getPlayerByIds
};

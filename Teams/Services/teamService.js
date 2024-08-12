const { getSignedUrl, successResponse, errorResponse, checkDateDifference } = require("../common-function/util");
const teamTable = require("../common-function/team_table.json");
const axios = require("axios");
const { jwtDecode } = require("jwt-decode");
const { regexForS3ObjectUrl } = require('../common-function/regex.js')
const AWS = require("aws-sdk");
const uuid = require("uuid");
const s3 = new AWS.S3();
const { Op } = require("sequelize");
let Team;
const setTeam = async (teams) => {
    Team = teams;
};
const getAllTeams = async (token) => {
    const decoded = jwtDecode(token);
    if (decoded['cognito:groups'][0] === 'user') {
        let teamsDetail = await Team.findAll({
            attributes: [
                teamTable.TEAM_ID,
                teamTable.TEAM_NAME,
                teamTable.TEAM_LOGO,
                teamTable.TEAM_OWNER_NAME,
            ],
            where: {
                [teamTable.TEAM_USER_ID]: decoded['username'],
                [teamTable.IS_DELETED]:0
            },
        });
        if (teamsDetail.length <= 0) {
            return teamsDetail;
        }
        if (process.env.NODE_ENV != 'local') {
            await Promise.all(teamsDetail.map(async item => {
                if(item.dataValues.t_logo){
                    let imageSignedUrl = await getSignedUrl(item.dataValues.t_logo);
                    item.t_logo = imageSignedUrl;
                }
             }))
          }
          if (teamsDetail)
          {
            let teamData = { teams: teamsDetail };
        return teamData;
          }
          else
            return false;
        
    }
    else {
        let teamDetails = await Team.findAll({
            attributes: [teamTable.TEAM_ID, teamTable.TEAM_NAME, teamTable.TEAM_OWNER_NAME, teamTable.TEAM_LOGO],
            where: { [teamTable.IS_DELETED]: 0 }
        });
        if (process.env.NODE_ENV != 'local') {
            await Promise.all(teamDetails.map(async item => {
                if(item.dataValues.t_logo){
                    let imageSignedUrl = await getSignedUrl(item.dataValues.t_logo);
                    item.t_logo = imageSignedUrl;
                }
           }))
          }
          if (teamDetails)
          {
            let teamData = { teams: teamDetails };
        return teamData;
          }
          else
            return false;
    }

};

const getTeamById = async (teamId) => {
    let teamDetail = await Team.findOne({ where: { [teamTable.TEAM_ID]: teamId } });
    if (process.env.NODE_ENV != 'local') {
        await Promise.all(teamDetail.map(async item => {
            if(item.dataValues.t_logo){
                let imageSignedUrl = await getSignedUrl(item.dataValues.t_logo);
                item.t_logo = imageSignedUrl;
            }
          
        }))
    }
    if (teamDetail)
        return teamDetail;
    else
        return false;
};

const addTeam = async (requestBody, file) => {
    let teamBody = {
        [teamTable.TEAM_USER_ID]: requestBody.team_user_id,
        [teamTable.TEAM_NAME]: requestBody.team_name,
        [teamTable.TEAM_OWNER_NAME]: requestBody.team_owner_name,
    };
    const team = await Team.findOne({ where: {
         [teamTable.TEAM_USER_ID]: requestBody.team_user_id,
         [teamTable.IS_DELETED]: 0
        } });
    console.log("team",team);
   if (team !== null) {
    if(team.dataValues.t_name === requestBody.team_name){
        return "Already Exists"; 
    }else{
        return false;
    }
}
else {
        if (teamBody[teamTable.TEAM_OWNER_NAME] === "" && teamBody[teamTable.TEAM_NAME] === "") {
            return "No Content";
        }
        if (file) {
            let imageName
            if (process.env.NODE_ENV == 'local') {
                imageName = file.filename;
            } else {
                imageName = teamBody[teamTable.TEAM_NAME] + uuid.v4() + ".png";
                await uploadImageIns3(imageName, file.buffer);
            }
            teamBody[teamTable.TEAM_LOGO] = imageName;
        }
        const result = await Team.create(teamBody)
        return result;
    }
}

const uploadImageIns3 = async (imageName, file) => {
    const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: imageName,
        Body: file,
        ContentType: "image/*",
    };
    const result = await s3.upload(s3Params).promise();
    return result;

};

const updateTeam = async (teamId, requestBody, file) => {
    
    if (isNaN(parseInt(teamId))) {
        errorResponse(response, 404, "Id invalid");
    }
    let teamBody = {
        [teamTable.TEAM_NAME]: requestBody.team_name,
        [teamTable.TEAM_OWNER_NAME]: requestBody.owner_name
    }
    if (file) {
        let imageName
        if (process.env.NODE_ENV == 'local') {
            imageName = file.filename;
        } else {
            imageName = teamBody[teamTable.TEAM_NAME] + uuid.v4() + ".png";
            await uploadImageIns3(imageName, file.buffer);
        }
        teamBody[teamTable.TEAM_LOGO] = imageName;
    }

    const duplicateTamName= await Team.findOne({where:{
        [teamTable.TEAM_NAME]: requestBody.team_name,
        [teamTable.TEAM_ID]:{
            [Op.not]: teamId
        },
        [teamTable.IS_DELETED] : 0
    }
    })
    console.log("duplicateTamName---",duplicateTamName);
    if(duplicateTamName!= null){
        return "Duplicate Team Name";
    }
    const updatingTeam = await Team.update(teamBody, { where: { t_id: teamId } })
    console.log("updateTeam",updateTeam);
    return updatingTeam;
};

const getTeamAssociation = async (teamId, token) => {
    const teamResponse = await getTeamById(teamId);
    console.log("response", teamResponse)
    if (teamResponse.length > 0) {
            var config = {
              headers: {
                Authorization: token
              }
            }
        console.log("Port of Auction microservice :- ", process.env.AUCTION_MICROSERVICE_PORT);
        const internalResponse = await axios.get(`http://${process.env.AUCTION_MICROSERVICE_PORT}/api/auctions/teams/${teamId}`, config);
        console.log("internal", internalResponse.data);
        if (internalResponse.data) {
            return internalResponse.data;
        } else {
            return false
        }
    } else {
        return false;
    }
}

const deleteTeam = async (teamId, auctionParams, startTimes, token) => {

    if (auctionParams.length > 2) {
        const checkDateDifferenceResult = await checkDateDifference(startTimes);
        console.log("checkDateDifferenceResult", checkDateDifferenceResult)
        const result = checkDateDifferenceResult.every((val, i, arr) => val === true)
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
            var externalAPIResponse = await axios.delete(`http://${process.env.AUCTION_MICROSERVICE_PORT}/api/auctions/teams/${teamId}?auction_id=${encodeURIComponent([auctionIds])}`,config);
            if (externalAPIResponse.data === true) {
                console.log("internal response-", externalAPIResponse.data);
            }
            else {
                return false;
            }
        } else {
            return "Date is less than 24hrs"
        }
    }
    const data = { [teamTable.IS_DELETED]: 1 }
    const deleteTeamResponse = await Team.update(data, {
        where: {
            [teamTable.TEAM_ID]: teamId,
            [teamTable.IS_DELETED]: 0
        }
    })
    console.log("======", deleteTeamResponse)
    if (deleteTeamResponse) {
        return true;
    }
    return false;
}

const getTeamByIds = async (teamIds) => {
    var teamsDetail = await Team.findAll({
        attributes: [
            teamTable.TEAM_ID,
            teamTable.TEAM_NAME,
            teamTable.TEAM_LOGO,
            teamTable.TEAM_USER_ID
        ],
        where: {
            [teamTable.TEAM_ID]: teamIds,
        },
    });
    console.log("teamsDetail Response", teamsDetail);
    if (process.env.NODE_ENV != 'local') {
        await Promise.all(teamsDetail.map(async item => {
            if(item.dataValues.t_logo){ 
                let imageSignedUrl = await getSignedUrl(item.dataValues.t_logo);
                item.t_logo = imageSignedUrl;
            }
         }))
    }
    if (teamsDetail)
        return teamsDetail;
    else
        return false;
}
const getTeamByUserId = async (userId) => {
    var teamsDetail = await Team.findAll({
        attributes: [
            teamTable.TEAM_ID,
            teamTable.TEAM_NAME,
            teamTable.TEAM_USER_ID
        ],
        where: {
            [teamTable.TEAM_USER_ID]: userId,
            [teamTable.IS_DELETED]:0
        },
    });
    console.log("teamsDetail Response", teamsDetail);
    if (process.env.NODE_ENV != 'local') {
        await Promise.all(teamsDetail.map(async item => {
            if(item.dataValues.t_logo){
                let imageSignedUrl = await getSignedUrl(item.dataValues.t_logo);
                item.t_logo = imageSignedUrl;
            }
        }))
    }
    if (teamsDetail.length>0)
        return teamsDetail;
    else
        return false;
}

module.exports = {
    setTeam,
    getAllTeams,
    getTeamById,
    addTeam,
    updateTeam,
    setTeam,
    getTeamAssociation,
    deleteTeam,
    getTeamByIds,
    getTeamByUserId
}
const { successResponse, errorResponse } = require("../common-function/util");
const teamService = require("../Services/teamService");
const teamTable = require("../common-function/team_table.json");
let Team;
const setTeams = async (teams) => {
  Team = teams;
};
const getAllTeams = async (request, response) => {
  try {
    let token = request.headers["authorization"]
    console.log(token)
    const result = await teamService.getAllTeams(token);
    if (result.length <= 0) {
      return errorResponse(response, 404, "No teams exist");
    }
    else {
      return successResponse(response, result)
    }
  } catch (e) {
    return errorResponse(response, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

const getTeamById = async (request, response) => {
  try {
    const teamId = request.params.team_id;
    const teamResponse = await teamService.getTeamById(teamId);
    console.log("team response", teamResponse)
    if (!teamResponse) {
      return errorResponse(response, 404, "No team exists");
    }
    else {
      return successResponse(response, teamResponse);
    }
  }
  catch (error) {
    console.log(error);
    return errorResponse(response, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
};

const addTeam = async (request, response) => {
  try {
    const requestBody = request.body;
    let file = request.file
    const result = await teamService.addTeam(requestBody, file)
    console.log(result)
    if (result === "Already Exists") {
      return errorResponse(response, 400, "Team already exist with this name");
    } else if (result === false) {
      return errorResponse(response, 400, "Owner cannot have more than one team");
    }
    else if (result === "No Content") {
      return errorResponse(response, 204, "No Content");
    }
    else {
      return successResponse(response, result);
    }
  } catch (error) {
    return errorResponse(response, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

const updateTeam = async (request, response) => {
  try {
    let teamId = request.params.team_id;
    let requestBody = request.body;
    let file = request.file
    const result = await teamService.updateTeam(teamId, requestBody, file)
    if(result === "Duplicate Team Name"){
      return errorResponse(response,400, "A team already exists with this name.")
    }else
    return successResponse(response, result);
  } catch (e) {
    return errorResponse(response, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

const getTeamAssociation = async (request, response) => {
  try {
    const teamId = request.params.team_id;
    const token = request.headers["authorization"]
    const getTeamAssociateResponse = await teamService.getTeamAssociation(teamId, token);
    console.log("delete response", getTeamAssociateResponse);
    if (getTeamAssociateResponse.length > 0) {
      return successResponse(response, getTeamAssociateResponse);
    }
    else if (!getTeamAssociateResponse) {
      return errorResponse(response, 400, "No team found");
    }
  }
  catch (error) {
    if (error.response) {
      console.log("Error-", error.response);
      return errorResponse(response, error.response.status, error.response.data.error);
    }
    else {
      console.log("Error-", error);
      return errorResponse(response, 417, "There seems to be some issue. Sorry for inconvenience.")
    }
  }
}

const deleteTeam = async (request, response) => {
  try {
    const teamId = request.params.team_id;
    const auctionParams = request.query.auction_id;
    const startTimes = request.query.start_time;
    const token = request.headers["authorization"]
    const deleteTeamResponse = await teamService.deleteTeam(teamId, auctionParams, startTimes, token);
    if (deleteTeamResponse == "Date is less than 24hrs") {
      return errorResponse(response, 403, "Can't delete as auction start time is less than 24 hrs or the auction is ongoing.")
    }
    if (deleteTeamResponse) {
      return successResponse(response, "Team Deleted Successfully");
    }
    else {
      return errorResponse(response, 400, "Unable to delete team");
    }
  } catch (error) {
    if (error.response) {
      console.log("Error-", error.response);
      return errorResponse(response, error.response.status, error.response.data.error);
    }
    else {
      console.log("error-", error);
      return errorResponse(response, 417, "There seems to be some issue. Sorry for inconvenience.")
    }
  }
}


async function getTeamByIds(request, response) {
  try {
    console.log("Request", request)
    let teamIds = request.body.teamIds;
    let getTeamByIdsResponse = await teamService.getTeamByIds(teamIds);
    if (!getTeamByIdsResponse) {
      errorResponse(response, 404, 'No such team exists');
    } else {
      successResponse(response, getTeamByIdsResponse);
    }
  } catch (error) {
    console.log("error ", error);
    errorResponse(response, 417, "There seems to be some issue. Sorry for inconvenience.")
  }
}
async function getTeamByUserId(request, response) {
  try {
    let teamIds = request.params.user_id;
    let teams =  await teamService.getTeamByUserId(teamIds);
    if(!teams){
      successResponse(response, "No teams exists for UserId");
    } else {
      successResponse(response, teams);
    }
  } catch (error) {
    console.log("error ", error);
    errorResponse(response, 417, "There seems to be some issue. Sorry for inconvenience.")
  }
}

module.exports = {
  getAllTeams,
  getTeamById,
  addTeam,
  updateTeam,
  getTeamByIds,
  getTeamAssociation,
  deleteTeam,
  setTeams,
  getTeamByUserId
};

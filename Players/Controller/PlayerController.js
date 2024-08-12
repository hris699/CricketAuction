const { successResponse, errorResponse } = require("../common-function/util");
const playerService = require("../Service/PlayerService");

const listAllPlayers = async (request, response) => {
  try {
    const playerResponse = await playerService.listAllPlayers();
    console.log("response", playerResponse);
      if (playerResponse.length <= 0) {
        return errorResponse(response, 404, "No player exists");
      }
      else {
        return successResponse(response,playerResponse);
      }
    }
    catch (error) {
      return errorResponse(response, 417, "There seems to be some issue. Sorry for inconvenience.");
    }
}

const getPlayerByIds = async (request, response) => {
  try {
    let playerIds = request.body.player_id;
    const getPlayerByIdResponse = await playerService.getPlayerByIds(playerIds);
    if (getPlayerByIdResponse === null) {
      return errorResponse(response, 404, "No player exists");
    }
    else {
      return successResponse(response,getPlayerByIdResponse);
    }
  } catch (error) {
    return errorResponse(response, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

const createPlayer = async (request, response) => {
  try {

    let playerDetailsInfo = request.body;
    let file = request.file;
    try {
      const createPlayerResponse = await playerService.createPlayer(playerDetailsInfo, file);

      if (createPlayerResponse === "Wrong Input") {
        return errorResponse(response, 404, createPlayerResponse)
      }
      else {
        return successResponse(response,createPlayerResponse);
      }
    } catch (error) {
      return errorResponse(response, 400, error)
    }

  } catch (error) {
    return errorResponse(response, 417, "Internal Server Error")
  }
};

const updatePlayer = async (request, response) => {
  try {
    let player_id = parseInt(request.params.player_id);

    let playerDetailsInfo = request.body;
    let file = request.file;

    const updatePlayerResponse = await playerService.updatePlayer(playerDetailsInfo, player_id, file);

    if (updatePlayerResponse === "Player is already deleted or doesn't exists" || updatePlayerResponse === "Wrong Input") {
      return errorResponse(response, 404, updatePlayerResponse)
    }
    else {

      return successResponse(response,updatePlayerResponse);
    }

  } catch (error) {
    return errorResponse(response, 417, "Internal Server Error")
  }

}
const getPlayerAssociation = async (request, response) => {
  try {
    const playerId = request.params.player_id;
    const token = request.headers["authorization"]
    const getPlayerAssociateResponse = await playerService.getPlayerAssociation(playerId, token);
    console.log("delete response", getPlayerAssociateResponse);
    if (getPlayerAssociateResponse.length > 0) {
      return successResponse(response,getPlayerAssociateResponse);
    }
    else if (!getPlayerAssociateResponse) {
      return errorResponse(response, 400, "No Player found");
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

const deletePlayer = async (request, response) => {
  try {
    const playerId = request.params.player_id;
    const auctionId = request.query.auction_id;
    const startTimes = request.query.start_time;
    const token = request.headers["authorization"]
    const deletePlayerResponse = await playerService.deletePlayer(playerId, auctionId, startTimes, token);
    if (deletePlayerResponse == "Date is less than 24hrs") {
      return errorResponse(response, 403, "Can't delete as auction start time is less than 24 hrs or the auction is ongoing.")
    }
    if (deletePlayerResponse) {
      return successResponse(response, "Player Deleted Successfully");
    }
    else {
      return errorResponse(response, 400, "Unable to delete player");
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

module.exports = {
  listAllPlayers,
  deletePlayer,
  createPlayer,
  updatePlayer,
  getPlayerByIds,
  getPlayerAssociation,
  deletePlayer
};
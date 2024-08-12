const {addAuctionPlayer,getPlayerList,deleteAuctionPlayer,getSoldUnsoldPlayers,getPlayersInAuction,
    getPlayerStatusInAuction,deleteAuctionPlayerAssociation,getPlayerCountTeamsDetails,addSelectedPlayersInAuction,getPlayersinTeam} = require('../services/auctionPlayerService');
  const { successResponse, errorResponse } = require("../common-function/util");
  
  const addAuctionPlayerController = async (req, res) => {
    try {
      const token = req.headers["authorization"]
      const auctionId = req.params.auction_id;
      const playerId = req.body.player_id;
      const baseValue = req.body.base_value;
      const response = await addAuctionPlayer(auctionId, playerId, baseValue,token);
      if (response == false) {
        return errorResponse(res, 400, "Unable to add player to auction")
      } else {
        return successResponse(res, response);
      }
    } catch (error) {
      console.log("Error -", error);
      return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.")
    }
  }
  
  const getPlayerListController = async (req, res) => {
    try {
      const auctionId = req.params.auction_id;
      const response = await getPlayerList(auctionId);
      if (response == false) {
        return errorResponse(res, 400, "No player associated with this auction")
      } else {
        return successResponse(res, response);
      }
    } catch (error) {
      console.log("Error -", error);
      return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.")
    }
  }
  
  const deleteAuctionPlayerController = async (req, res) => {
    try {
      const playerId = req.params.player_id;
      const auctionId = req.params.auction_id;
      const response = await deleteAuctionPlayer(playerId, auctionId)
      if (response === "Not Found") {
        return errorResponse(res, 404, "Auction Not Found");
      } else if (response === "Deleted successfully") {
        return successResponse(res, "Player Deleted Successfully")
      } else if (response == "Cannot Delete") {
        return errorResponse(res, 400, "Cannot remove player from the auction as the auction is about to start in 24 hours or already completed");
      } else if (response === "Already Deleted") {
        return errorResponse(res, 404, "Player not found in this auction or already deleted");
      }
    } catch (error) {
      console.log("Error -", error);
      return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
    }
  };
  
  const getSoldUnsoldPlayersController = async (req, res) => {
    try {
      const auction_id = req.params.auction_id;
      const soldStatus = req.query.sold_status;
      const token = req.headers["authorization"]
      const response = await getSoldUnsoldPlayers(auction_id, soldStatus, token);
      if (response == false) {
        return errorResponse(res, 400, "No player associated with this auction")
      } else {
        return successResponse(res, response);
      }
    } catch (error) {
      console.log("Error -", error);
      return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.")
    }
  }
  
  const getPlayersInAuctionController = async (req, res) => {
    try {
      const auctionId = req.params.auction_id;
      const token = req.headers["authorization"];
      const response = await getPlayersInAuction(auctionId,token);
      if (response == false) {
        return errorResponse(res, 400, "No player associated with this auction")
      } else {
        return successResponse(res, response);
      }
    } catch (error) {
      console.log("Error -", error);
      return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.")
    }
  }
  
  const getPlayerStatusInAuctionController = async (req, res) => {
    try {
      const playerId = req.params.player_id;
      console.log("initial", playerId);
      const response = await getPlayerStatusInAuction(playerId);
      console.log("response     ==", response);
      if (response.length > 0) {
        return successResponse(res, response);
      }
      else {
        return errorResponse(res, 400, "Player not associated with auction");
      }
    }
    catch (error) {
      console.log("Error", error);
      return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
    }
  }
  
  const deleteAuctionPlayerAssociationController = async (req, res) => {
    try {
      const playerId = req.params.player_id;
      const auctionIds = parseInt(req.query.auction_id);
      console.log("auction ids-", auctionIds);
      console.log("playerId", playerId);
      const deleteAuctionPlayer = await deleteAuctionPlayerAssociation(playerId, auctionIds);
      console.log("deleteAuctionPlayer",deleteAuctionPlayer);
      if (deleteAuctionPlayer) {
        return successResponse(res, true)
      } else {
        return errorResponse(res, 400, "Unable to delete");
      }
    }
    catch (error) {
      console.log("error-", error);
      return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
    }
  }
  
  const addSelectedPlayersInAuctionController = async (req, res) => {
    try {
      const auctionId = req.params.auction_id;
      let selectedPlayers = req.body.selected_players;
  
      const response = await addSelectedPlayersInAuction(auctionId, selectedPlayers);
  
      if (response === "Not Found") {
        return errorResponse(res, 404, "Auction Not Found");
      }else if (response === "No Players Selected") {
        return errorResponse(res, 400, "No Players Selected");
      }else if (response === "Selected Players added") {
        return successResponse(res, "Selected Players added");
      } else if (response == "Cannot add selected players") {
        return errorResponse(res, 400, "Cannot add players in the auction as the auction is about to start in 24 hours or already completed");
      } else if (response === "Selected Player(s) already added.") {
        return errorResponse(res, 400, "Selected Player(s) already added.");
      }
    } catch (error) {
      console.log("Error -", error);
      return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
    }
  };
  
  const getPlayersinTeamController  = async (req, res) =>{
    try {
      const auction_id = req.params.auction_id;
      const team_id = req.params.team_id;
      const token = req.headers["authorization"]
      const response = await getPlayersinTeam(auction_id, team_id, token);
      if (response == false) {
        return errorResponse(res, 400, "No player associated with this auction")
      } else {
        return successResponse(res, response);
      }
    } catch (error) {
      console.log("Error -", error);
      return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.")
    }
  }

  const getPlayerCountTeamsDetailsController = async (req, res) => {
    const auctionId = req.params.auction_id;
    try{
      let teamsDetails = await getPlayerCountTeamsDetails(auctionId);
      return successResponse(res, teamsDetails)
    }catch(err){
      return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.")
    }
  }
  
  module.exports = {
    getPlayersinTeamController,
    addAuctionPlayerController,
    deleteAuctionPlayerController,
    getPlayerListController,
    getSoldUnsoldPlayersController,
    getPlayersInAuctionController,
    getPlayerStatusInAuctionController,
    deleteAuctionPlayerAssociationController,
    getPlayerCountTeamsDetailsController,
    addSelectedPlayersInAuctionController
  }
  
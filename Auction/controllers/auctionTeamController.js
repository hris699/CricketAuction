const { requestToRegisterForAuction,approvalOrDenialOfRegisterForAuction,getAuctionByTeamId,getTeamsInAuction,
  getTeamStatusInAuction,deleteAuctionTeam,getTeamInAuctionByUserId, getTeamRequestForAuction} = require('../services/auctionTeamService');
const { errorResponse, successResponse } = require('../common-function/util');

const requestToRegisterForAuctionController = async (req, res) => {
  try {
    const auctionId = req.params.auction_id;
    const userId = req.body.user_id;
    const token = req.headers["authorization"]
    const response = await requestToRegisterForAuction(auctionId, userId, token);
    if (response === "Request sent successfully.")
     return successResponse(res, "Request sent successfully.");
    else if (response === "Either auction is ongoing or already completed.")
     return errorResponse(res, 404, "Either auction is ongoing or already completed."); 
    else if (response === "Request already exists.")
     return errorResponse(res, 404, "Request already exists.");
    else if (response === "Already participating.")
     return errorResponse(res, 404, "Already participating.");
    else if(response === "No team exists for this user.")
     return errorResponse(res, 400, "No team exists for this user.");
  } catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue.Sorry for inconvenience.");
  }
};

const approvalOrDenialOfRegisterForAuctionController = async (req, res) => {
  try {
    const auctionId = req.params.auction_id;
    const approvalStatus = req.body.approval_status;
    const teamId = req.body.team_id;
    const response = await approvalOrDenialOfRegisterForAuction(auctionId, teamId, approvalStatus);
    if (response === "Updated Successfully")
      return successResponse(res, "Updated Successfully");
    else if (response === "Participation full")
      return errorResponse(res, 404, "Participations are full.Please try for another auction."
      );
  } catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue.Sorry for inconvenience.");
  }
};

const getAuctionByTeamIdController = async (req, res) => {
  try {
    let teamId = req.params.team_id;
    const response = await getAuctionByTeamId(teamId);
    console.log("response", response);
    if (response)
     return successResponse(res, response);
    else
     return errorResponse(res, 404, "No auction exists");
  } catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue.Sorry for inconvenience.");
  }
};

const getTeamsInAuctionController = async (req, res) => {
  try {
    const auctionId = req.params.auction_id;
    const token = req.headers["authorization"]
    const response = await getTeamsInAuction(auctionId, token);
    if (response) return successResponse(res, response);
    else return errorResponse(res, 404, "No team Associated to this auction");
  } catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue.Sorry for inconvenience.");
  }
};

const getTeamStatusInAuctionController = async (req, res) => {
  try {
    const teamId = req.params.team_id;
    const response = await getTeamStatusInAuction(teamId);
    console.log("response of auction", response);
    if (response.length > 0) {
      return successResponse(res, response);
    }
    else {
      return errorResponse(res, 400, "Team not associated with auction");
    }
  }
  catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

const deleteAuctionTeamController = async (req, res) => {
  try {
    const teamId= req.params.team_id;
    const auctionIds = parseInt(req.query.auction_id);
    const response = await deleteAuctionTeam(teamId, auctionIds);
    if (response) 
      return successResponse(res, true);
    else
    return errorResponse(res, 400, "Unable to delete");
  }
  catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

const getTeamInAuctionByUserIdController = async (req, res) => {
  try {
    const auctionId = req.params.auction_id;
    const userId = req.params.user_id;
    const token = req.headers["authorization"]
    const response = await getTeamInAuctionByUserId(auctionId,userId,token);
    console.log("response of auction", response);
    if (response.length > 0) {
      return successResponse(res, response);
    }
    else {
      return errorResponse(res, 400, "Team not associated with auction");
    }
  }
  catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

const getTeamRequestForAuctionController = async (req,res) =>{
  try{
  const token = req.headers["authorization"]
  const response= await getTeamRequestForAuction(token);
  if(response){
    return successResponse (res, response);
  }else{
    return errorResponse(res,400,"No Requests Found")
  }
}catch(error){
  console.log("Error-",error)
  return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

module.exports = {
  requestToRegisterForAuctionController,
  approvalOrDenialOfRegisterForAuctionController,
  getAuctionByTeamIdController,
  getTeamsInAuctionController,
  getTeamStatusInAuctionController,
  deleteAuctionTeamController,
  getTeamInAuctionByUserIdController,
  getTeamRequestForAuctionController
}

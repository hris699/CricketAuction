const { successResponse, errorResponse } = require('../common-function/util');
const { addAuction, getAllAuctions, updateAuction, deleteAuction, auctionDetail, getOngoingAuction } = require('../services/auctionService');
const auctionService = require('../services/auctionService');
const addAuctionController = async (req, res) => {
  try {
    const body = req.body;
    const file = req.file; 
    const response = await addAuction(body, file);
    console.log("controller", response);
    if (response === "Auction Exists"){
      return errorResponse(res, 400, "Auction already exist with this name")
    }else if (response === "team size issue")
      return errorResponse(res, 400, "Minimum team size cannot be greater than max team size");
    else
      return successResponse(res, response);
  } catch (error) {
    console.log("Error -", error);
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError' || error.message) {
      return res.status(400).json({ error: error.message });
    }
    return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
};

const getAllAuctionsController = async (req, res) => {
  try {
    const response = await getAllAuctions();
    if (response)
      return successResponse(res, response);
    else
      return errorResponse(res, 404, "No auction found");
  } catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}
const getOngoingAuctionsController = async (req, res) => {
  try {
    const response = await getOngoingAuction();
    console.log("response", res);
    if (response)
      return successResponse(res, response);
    else
      return errorResponse(res, 404, "No auction found");
  } catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

const updateAuctionController = async (req, res) => {
  try {
    const auctionId = req.params.auction_id;
    const body = req.body;
    const file = req.file;
    const token = req.headers["authorization"]
    const response = await updateAuction(auctionId, body, file, token);
    if (response === "team size issue")
      return errorResponse(res, 400, "Minimum team size cannot be greater than max team size");
    else if (response === "Not Found")
      return errorResponse(res, 404, "Auction is already deleted or doesn't exists");
    else if (response === "Duplicate Auction Name")
      return errorResponse(res,404, "Auction already exist with this name");
    else
      return successResponse(res, "Updated Successfully");
  } catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

const deleteAuctionController = async (req, res) => {
  try {
    let auctionId = req.params.auction_id;
    const response = await deleteAuction(auctionId);
    if (!response)
      return errorResponse(res, 404, "Auction not found or already deleted");
    else
      return successResponse(res, "Auction deleted Successfully");
  } catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

const auctionDetailController = async (req, res) => {
  try {
    let auctionId = req.params.auction_id;
    const response = await auctionDetail(auctionId);
    if (!response)
      return errorResponse(res, 404, "Provided auction does not exist or is deleted");
    else
      return successResponse(res, response);
  } catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

const getAuctionDetailsByAuctionId = async (req, res) => {
  try {
    let auctionId = req.params.auction_id;
    const response = await auctionService.getAuctionDetailsByAuctionId(auctionId);
    if (!response)
      return errorResponse(res, 404, "Provided auction does not exist or is deleted");
    else
      return successResponse(res, response);
  } catch (error) {
    console.log("Error -", error);
    return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
  }
}

module.exports = {
  addAuctionController,
  getAllAuctionsController,
  getOngoingAuctionsController,
  updateAuctionController,
  deleteAuctionController,
  auctionDetailController,
  getAuctionDetailsByAuctionId
}

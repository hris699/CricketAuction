const { jwtDecode } = require("jwt-decode");
const { successResponse, errorResponse } = require('../common-function/util');
const playerLinksService = require('../Service/playerLinksService');

exports.getUserAllowedLinks = async (req,res) => {
    try {
        const token=req.headers["authorization"];
        const payload = jwtDecode(token);
      const response = await playerLinksService.getUserAllowedLinks(payload['cognito:groups']);
      console.log("response", response);
      if (response)
        return successResponse(res, response);
      else
       return errorResponse(res, 404, "No Links Found");
    } catch (error) {
      console.log("Error -", error);
      return errorResponse(res, 417, "There seems to be some issue. Sorry for inconvenience.");
    }
  }
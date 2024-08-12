const { successResponse, errorResponse } = require('../common-function/util')
const CognitoExpress = require('cognito-express');
const axios = require("axios");

const getAccessLinks = async (apiPath, token) => {
    const config = {
        headers: {
            Authorization: token
        }
    }
    const response = await axios.get(apiPath, config);
    return response.data
}

const redirectUser = async (req, res) => {
    try {
        const cognitoExpress = new CognitoExpress({ region: process.env.AWS_REGION, cognitoUserPoolId: process.env.AWS_COGNITO_USER_POOL_ID, tokenUse: process.env.TOKEN_USE })
        let token = req.headers["authorization"];
        if (token) {
            const payload = await cognitoExpress.validate(token)

            console.log("Port of Players microservice :- ", process.env.PLAYERS_MICROSERVICE_PORT);		
            const playerResponse = await getAccessLinks(`http://${process.env.PLAYERS_MICROSERVICE_PORT}/api/players/links `, token)
            console.log("PlayerLength", playerResponse.length)
            
            console.log("Port of Teams microservice :- ", process.env.TEAMS_MICROSERVICE_PORT);
            const teamsResponse = await getAccessLinks(`http://${process.env.TEAMS_MICROSERVICE_PORT}/api/teams/users/links `, token)
            console.log("TeamLength", teamsResponse.length)

            console.log("Port of Auction microservice :- ", process.env.AUCTION_MICROSERVICE_PORT);
            const auctionsResponse = await getAccessLinks(`http://${process.env.AUCTION_MICROSERVICE_PORT}/api/auctions/links`, token)
            console.log("AdminLength", auctionsResponse.length)
            const allLinks = [...playerResponse, ...teamsResponse, ...auctionsResponse]
            console.log("AccessLinks", allLinks)
            return successResponse(res, allLinks);

        }
        else {
            return errorResponse(res, 403, 'Forbidden')

        }
    }
    catch (error) {
        console.log(error)
        return errorResponse(res, 403, 'Forbidden')
    }
}

module.exports = {
    redirectUser
}
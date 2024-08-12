const WebSocket = require("ws");
// const wss = new WebSocket.Server({ port: 8000, path: '/ws' });
process.env.WEBSOCKET_PORT = 5555;

const { getPlayersInAuctionByAuctionId, updatePlayerSoldStatus } = require("../services/auctionPlayerService")
const { getTeamDetailsInAuction, updateCurrentWallet } = require("../services/auctionTeamService");
const { getLatestBidList, addBiddingHistory } = require("../services/biddingService");
const { addTransactionHistory } = require("../services/transactionService")
const { updateAuctionEndTime } = require("../services/auctionService");
const wss = new WebSocket.Server({ port: process.env.WEBSOCKET_PORT });
console.log('Server started ........................')
// Create an empty list that can be used to store WebSocket clients.
var wsClients = {};

// Handle the WebSocket `connection` event. This checks the request URL
// for a JWT. If the JWT can be verified, the client's connection is added;
// otherwise, the connection is closed.
function playerSoldUsold(playerData, auctionId, auctionData) {
    try {
        let soldDetails = {};
        soldDetails.auction_id = auctionId;
        soldDetails.player_id = playerData.p_id;
        if (playerData.teamId) {
            var teamDetails = auctionData.teams.find(obj => {
                return obj.t_id === playerData.teamId
            })
            let balanceBeforeBid = teamDetails.at_current_wallet_balance;
            let balanceAfterBid = balanceBeforeBid - playerData.current_bid;
            teamDetails.at_current_wallet_balance = balanceAfterBid;
            soldDetails.team_id = playerData.teamId;
            soldDetails.sold_value = playerData.current_bid
            soldDetails.sold_status = "sold"
            playerData.status = "sold"
            addTransactionHistory(auctionId, playerData.teamId, playerData.p_id, playerData.current_bid, balanceBeforeBid, balanceAfterBid)
            updateCurrentWallet(auctionId, playerData.teamId, balanceAfterBid);
        } else {
            soldDetails.sold_status = "unsold"
            playerData.status = "unsold"
        }
        updatePlayerSoldStatus(soldDetails);
        publishToAll(auctionId, { "final_player_status": playerData })
        let players = auctionData.players;
        let pendingPlayers;
        if (auctionData.pendingPlayers) {
            pendingPlayers = auctionData.pendingPlayers;
            pendingPlayers = pendingPlayers.filter(item => item.p_id !== playerData.p_id);
        } else {
            pendingPlayers = players.filter(item => item.p_id !== playerData.p_id);
        }

        auctionData.pendingPlayers = pendingPlayers;
        //console.log("Players -------->", pendingPlayers);
        let nextPlayer = setTimeout(sendNextPlayer, 5000, auctionId);
    } catch (error) {
        console.log("Error in PlayerSoldUnsold", error)
    }
}

async function sendNextPlayer(auctionId) {
    try {
        let auctionData = wsClients[auctionId];
        let nextData = {}
        nextData.players = auctionData.players;
        if (auctionData.pendingPlayers.length > 0) {
            //console.log("In SendNextPlayer>>>>>>", auctionData.pendingPlayers);
            nextData.currentPlayer = auctionData.pendingPlayers[0];
            //console.log(nextData.currentPlayer);
            auctionData.currentPlayerInAuction = nextData.currentPlayer;
            const latestBid = await getLatestBidList(auctionId, auctionData.currentPlayerInAuction.p_id);
            if (latestBid.length > 0) {
                nextData.latestBid = latestBid;
            } else {
                nextData.latestBid = [];
            }

            publishToAll(auctionId, nextData)
            let timer = setTimeout(playerSoldUsold, 30000, auctionData.currentPlayerInAuction, auctionId, auctionData);
            auctionData.timer = timer;
            let latestBidTimer = auctionData.latestBidTimer;
            clearInterval(latestBidTimer);
            latestBidTimer = setInterval(sendLatestBid,3000,auctionId);
            auctionData.latestBidTimer = latestBidTimer;
            auctionData.timerToEnd = new Date().getTime() + 30000;
        } else {
            updateAuctionEndTime(auctionId, new Date().toISOString())
            let latestBidTimer = auctionData.latestBidTimer;
            let bidInterval = auctionData.bidInterval
            clearInterval(latestBidTimer);
            clearInterval(bidInterval);
            publishToAll(auctionId, { "auctionEnded": true })
            closeAllConnections(auctionId);
            delete wsClients[auctionId]
        }
    } catch (error) {
        console.log("Error in SendNextPlayer", error);
    }

}
async function sendLatestBid(auctionId){
    let auctionData = wsClients[auctionId];
    let currentPlayer = auctionData.currentPlayerInAuction;
    let latestBid = await getLatestBidList(auctionId, currentPlayer.p_id);
    if(latestBid){
        publishToAll(auctionId, {latestBids: latestBid })
    }else{
        publishToAll(auctionId,{latestBids:[]})
    }
    
}
function publishToAll(auctionId, data) {
    //console.log(wsClients);
    //console.log("AuctionId --------",auctionId);

    let auctionData = wsClients[auctionId];
    //console.log(auctionData);
    let websocketsConnection = auctionData.wsConnectionArray;
    for (let ws of websocketsConnection) {
        ws.send(JSON.stringify(data));
    }
}
function closeAllConnections(auctionId) {
    let auctionData = wsClients[auctionId];
    //console.log(auctionData);
    let websocketsConnection = auctionData.wsConnectionArray;
    for (let ws of websocketsConnection) {
        try{
            ws.close();
        }catch(error){
            console.log("Error while closing the connection");
        }    
    }
}
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}
function setTime(auctionId){
    let auctionData = wsClients[auctionId];
    let timer = (auctionData.timerToEnd - new Date().getTime())/1000;
    publishToAll(auctionId,{"bidTimer":timer})
}
async function startAuction(auctionId) {
    let auctionData = {}
    let players;
    let playerIndex;
    let teams;
    let timer;
    try {
        if (wsClients[auctionId]) {
            auctionData = wsClients[auctionId];
        } else {
            auctionData = {}
            auctionData.wsConnectionArray = []
            
            players = await getPlayersInAuctionByAuctionId(auctionId, "pending", true);
            teams = await getTeamDetailsInAuction(auctionId);
            console.log("players ---------->>>>>>", players);
            auctionData.teams = teams;
            auctionData.players = players;
            playerIndex = 0;
            auctionData.playerIndex = playerIndex;
            wsClients[auctionId] = auctionData
        }
        players = auctionData.players;
        playerIndex = auctionData.playerIndex;
        //auctionData.wsConnectionArray.push(ws);
        currentPlayerInAuction = players[playerIndex];
        auctionData.currentPlayerInAuction = currentPlayerInAuction;
        timer = setTimeout(playerSoldUsold, 30000, currentPlayerInAuction, auctionId, auctionData);
        let latestBidTimer = setInterval(sendLatestBid,3000,auctionId);
        auctionData.timer = timer;
        auctionData.latestBidTimer = latestBidTimer;
        auctionData.timerToEnd = new Date().getTime() + 30000;
        let bidInterval = setInterval(setTime, 2000,auctionId);
        auctionData.bidInterval = bidInterval;
    } catch (error) {
        console.log("Error In StartAuction", error);
    }
}
wss.on('connection', (ws, req) => {
    //var token = url.parse(req.url, true).query.token;
    //console.log("request",req)
    console.log("In Websocket connection");
    var token = req.headers.token;
    console.log("headers", token)
    var auction_id = req.headers.auction_id;

    //ws.send(JSON.stringify(data));
    var wsUsername = "";

    // jwt.verify(token, jwtSecret, (err, decoded) => {
    //     if (err) {
    //         ws.close();
    //     } else {
    //         wsClients[token] = ws;
    //         wsUsername = decoded.username;
    //     }
    // });

    // Handle the WebSocket `message` event. If any of the clients has a token
    // that is no longer valid, send an error message and close the client's
    // connection.
    ws.on('message', async (data) => {
        //console.log("on Message ", data.toString());
        let socketData = JSON.parse(data.toString());
        let timer;
        let currentPlayerInAuction;
        if (socketData.auth) {
            let auth = socketData.auth;
            let auctionId = auth.auction_id;
            console.log("AuctionId >>>>>>>>", auctionId);
            let auctionData = {}
            let players;
            let teams;
            try {
                if (wsClients[auctionId]) {
                    auctionData = wsClients[auctionId];
                } else {
                    
                    console.log("iN else")
                    while(Object.keys(auctionData).length<=0){
                        await sleep(2000);
                        auctionData = wsClients[auctionId];
                    }
                }
                console.log(auctionData);
                players = auctionData.players;
                
                auctionData.wsConnectionArray.push(ws);
                currentPlayerInAuction = auctionData.currentPlayerInAuction;
                //console.log(auctionData);
                let latestBid = await getLatestBidList(auctionId, currentPlayerInAuction.p_id);
                //console.log(latestBid)
                if(currentPlayerInAuction){
                if (latestBid.length > 0) {
                    currentPlayerInAuction.current_bid = latestBid[0].teamLastBid;
                    currentPlayerInAuction.next_bid = latestBid[0].teamLastBid + (currentPlayerInAuction.baseValue * .1)
                    currentPlayerInAuction.last_bid = latestBid[0].teamPreviousBid
                    currentPlayerInAuction.team = latestBid[0].teamName;
                    currentPlayerInAuction.teamId = latestBid[0].teamId;
                } else {
                    latestBid = [];
                }
            }
                //console.log(currentPlayerInAuction);
                const playersData = {
                    players: players,
                    currentPlayer: currentPlayerInAuction,
                    latestBid: latestBid,
                    timer: (auctionData.timerToEnd - new Date().getTime())/1000
                }

                ws.send(JSON.stringify(playersData));
                //timer = setTimeout(playerSoldUsold, 30000, currentPlayerInAuction, auctionId, auctionData);
                //auctionData.timer = timer;
                //auctionData.timerToEnd = new Date().getTime() + 30000;
            } catch (error) {
                console.log("Error In Auth Data", error);
            }
            //console.log(auctionData);
        } else if (socketData.bid) {
            //console.log("In bid section", socketData);
            try {
                const bidData = socketData.bid;
                const auctionId = bidData.auctionId
                let auctionData;
                if (wsClients[auctionId]) {
                    auctionData = wsClients[auctionId];
                }
                currentPlayerInAuction = auctionData.currentPlayerInAuction;
                //console.log("In Bidding Section",auctionData);
                let timer = auctionData.timer;
                clearTimeout(timer);
                var teamDetails = auctionData.teams.find(obj => {
                    return obj.t_id === bidData.teamId
                })
                //console.log("TeamDetails ---------<<<<<.>>>>", teamDetails);
                if (teamDetails.at_current_wallet_balance > bidData.bid) {
                    addBiddingHistory(auctionId, bidData.teamId, bidData.playerId, currentPlayerInAuction.last_bid, bidData.bid)

                    if (currentPlayerInAuction.next_bid) {
                        currentPlayerInAuction.next_bid = currentPlayerInAuction.next_bid + (currentPlayerInAuction.baseValue * .1);
                    } else {
                        currentPlayerInAuction.next_bid = currentPlayerInAuction.baseValue + (currentPlayerInAuction.baseValue * .1);
                    }
                    //console.log(currentPlayerInAuction.next_bid);
                    currentPlayerInAuction.current_bid = bidData.bid
                    currentPlayerInAuction.teamId = bidData.teamId;

                    currentPlayerInAuction.team = teamDetails.t_name;
                    currentPlayerInAuction.last_bid = bidData.bid
                    //let latestBid = await getLatestBidList(auctionId, bidData.playerId);
                    sendLatestBid(auctionId);
                    //publishToAll(auctionId, { "updateBid": currentPlayerInAuction, latestBid: latestBid })
                    publishToAll(auctionId, { "updateBid": currentPlayerInAuction})
                    timer = setTimeout(playerSoldUsold, 30000, currentPlayerInAuction, auctionId, auctionData);
                    auctionData.timer = timer;
                    auctionData.timerToEnd = new Date().getTime() + 30000;
                }else{
                    ws.send(JSON.stringify({"purseLimit":"exceeded"}));
                }
                //console.log(currentPlayerInAuction);
                
            } catch (error) {
                console.log("Error in Bid ", error);
            }
        }
        // for (const [token, client] of Object.entries(wsClients)) {
        //     jwt.verify(token, jwtSecret, (err, decoded) => {
        //         if (err) {
        //             client.send("Error: Your token is no longer valid. Please reauthenticate.");
        //             client.close();
        //         } else {
        //             client.send(wsUsername + ": " + data);
        //         }
        //     });
        // }
    });
});
module.exports = {
    startAuction
}
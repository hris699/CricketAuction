const { Sequelize, DataTypes } = require('sequelize');
const { getConnectionDetails } = require('../evConfig.js');
const { setAuction } = require('../services/auctionService.js');
const { setAuctionPlayer } = require('../services/auctionPlayerService.js');
const { setAuctionTeam } = require('../services/auctionTeamService.js');
const { setBiddingHistory } = require('../services/biddingService.js');
const { setTransactionHistory } = require('../services/transactionService.js');
const connectionDetail = getConnectionDetails().then(connectionDetails => {
    let sequelize = new Sequelize(
        connectionDetails.DB,
        connectionDetails.USER,
        connectionDetails.PASSWORD, {
        host: connectionDetails.HOST,
        port: connectionDetails.DB_PORT,
        dialect: connectionDetails.dialect,
        operatorsAliases: false,

        pool: {
            max: connectionDetails.pool.max,
            min: connectionDetails.pool.min,
            acquire: connectionDetails.pool.acquire,
            idle: connectionDetails.pool.idle
        }
    })

    sequelize.authenticate()
        .then(() => {
            console.log('connected..')
        })
        .catch((err) => {
            console.log('Error' + err)
        })

    const db = {};
    db.Sequelize = Sequelize
    db.sequelize = sequelize
    db.auction = require('../models/auctionModel.js')(sequelize, DataTypes)
    db.auction_player = require('../models/auctionPlayerModel.js')(sequelize, DataTypes)
    db.auction_team = require('../models/auctionTeamModel.js')(sequelize, DataTypes)
    db.bidding_history = require('../models/biddingHistoryModel.js')(sequelize, DataTypes)
    db.transaction_history = require('../models/transactionHistoryModel.js')(sequelize, DataTypes)
    setAuction(db.auction);
    setAuctionPlayer(db.auction_player)
    setAuctionTeam(db.auction_team)
    setBiddingHistory(db.bidding_history)
    setTransactionHistory(db.transaction_history)

    db.sequelize.sync({ alter: true })
        .then(() => {
            console.log('yes re-sync done!')
        }).catch((error) => {
            console.log("Error", error)
        })
    module.exports = { db }
}).catch(err => {
    console.log(err)

});
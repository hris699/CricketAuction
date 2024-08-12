
const { Sequelize, DataTypes } = require('sequelize');
const { getConnectionDetails } = require('../evConfig.js');
const { setTeam } = require('../Services/teamService');
const { setTeams } = require('../Controller/teamController');
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
    db.team = require('../models/team.js')(sequelize, DataTypes)
    setTeam(db.team);
    setTeams(db.team);
    db.sequelize.sync({ alter: true })
        .then(() => {
            console.log('yes re-sync done!')
        }).catch((error) => {
            console.log("Error", error)
        })
    module.exports = { db }
}).catch(err => {
});
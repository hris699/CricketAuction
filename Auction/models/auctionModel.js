const auctionTable = require('../common-function/auction_table.json');
module.exports = (sequelize, DataTypes) => {
    const Auction = sequelize.define("auction", {
        [auctionTable.AUCTION_ID]: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,

        },
        [auctionTable.AUCTION_NAME]: {
            type: DataTypes.STRING,
            allowNull: false
        },
        [auctionTable.START_TIME]: {
            type: DataTypes.DATE,
            allowNull: false
        },
        [auctionTable.END_TIME]: {
            type: DataTypes.DATE,
            allowNull: true
        },
        [auctionTable.PURSE_VALUE]: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        [auctionTable.NO_OF_TEAMS]: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        [auctionTable.MIN_TEAM_SIZE]: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        [auctionTable.MAX_TEAM_SIZE]: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        [auctionTable.IS_DELETED]: {
            type: DataTypes.TINYINT,
            defaultValue: 0
        },
        [auctionTable.CREATED_BY]:
        {
            type: DataTypes.STRING,
            allowNull: true
        },
        [auctionTable.AUCTION_IMAGE]: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        [auctionTable.AUCTION_DESCRIPTION]: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        [auctionTable.AUCTION_COUNTRY]: {
            type: DataTypes.STRING,
            allowNull: false,
        },

    }, {
        hooks: {
            beforeValidate: (auction, options) => {
                if (auction[auctionTable.START_TIME] && auction[auctionTable.START_TIME] < new Date()) {
                    throw new Error('Cannot Create Auction for Past Date');
                }
            },
        },
    })



    return Auction

}
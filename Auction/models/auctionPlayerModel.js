const playerTable = require('../common-function/auction_player_table.json');
module.exports = function(sequelize, DataTypes) {
    const Auction_player = sequelize.define('auction_player', {
        [playerTable.AUCTION_ID]: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'auctions',
          key: 'a_id'
        }
      },
      [playerTable.PLAYER_ID]: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      [playerTable.TEAM_ID]: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      [playerTable.SOLD_STATUS]: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      [playerTable.BASE_VALUE]: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      [playerTable.SOLD_VALUE]: {
        type: DataTypes.BIGINT,
        allowNull: true
      }
    }, {
      sequelize,
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [
            { name: "ap_auction_id" },
            { name: "ap_player_id" },
          ]
        },
      ]
    });
    return Auction_player;
  };
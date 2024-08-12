const bidTable = require('../common-function/bidding_history_table.json');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bidding_history', {
    [bidTable.BID_ID]: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    [bidTable.AUCTION_ID]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'auctions',
        key: 'a_id'
      }
    },
    [bidTable.TEAM_ID]: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    [bidTable.PLAYER_ID]: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    [bidTable.LAST_BID]: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    [bidTable.CURRENT_BID]: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    sequelize,
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "bh_bid_id" },
        ]
      },
      {
        name: "auction_id_idx",
        using: "BTREE",
        fields: [
          { name: "bh_auction_id" },
        ]
      },
    ]
  });
};

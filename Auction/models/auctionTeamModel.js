const teamTable = require('../common-function/auction_team_table.json');
module.exports = function(sequelize, DataTypes) {
    const Auction_team = sequelize.define('auction_team', {
      [teamTable.AUCTION_ID]: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'auctions',
          key: 'a_id'
        }
      },
      [teamTable.TEAM_ID]: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      [teamTable.CURRENT_WALLET_BALANCE]: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      [teamTable.APPROVAL_STATUS]: {
        type: DataTypes.STRING(45),
        allowNull: false
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
            { name: "at_auction_id" },
            { name: "at_team_id" },
          ]
        },
      ]
    });

return Auction_team;

  };
  
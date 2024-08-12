const transactionTable = require('../common-function/transaction_history_table.json');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('transaction_history', {
    [transactionTable.TRANSACTION_ID]: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    [transactionTable.AUCTION_ID]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'auctions',
        key: 'a_id'
      }
    },
    [transactionTable.TEAM_ID]: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    [transactionTable.PLAYER_ID]: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    [transactionTable.FINAL_PRICE]: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    [transactionTable.INITIAL_PURSE_VALUE]: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    [transactionTable.FINAL_PURSE_VALUE]: {
      type: DataTypes.BIGINT,
      allowNull: true
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
          { name: "th_transaction_id" },
        ]
      },
      {
        name: "auction_id_idx",
        using: "BTREE",
        fields: [
          { name: "th_auction_id" },
        ]
      },
    ]
  });
};

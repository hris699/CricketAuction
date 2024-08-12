const playerModel = require("../common-function/player_table.json");
module.exports = (sequelize, DataTypes) => {
  const Players = sequelize.define(
    "players",
    {
      [playerModel.PLAYER_ID]: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      [playerModel.PLAYER_NAME]: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      [playerModel.PLAYER_EMAIL]: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
      },
      [playerModel.PLAYER_AGE]: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      [playerModel.PLAYER_CONTACT]: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      [playerModel.PLAYER_IMAGE]: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      [playerModel.PLAYER_TYPE]: {
        type: DataTypes.ENUM("Batsman", "Bowler", "All-Rounder","Wicket-Keeper"),
        defaultValue: "Batsman",
        allowNull: false,
      },
      [playerModel.PLAYER_IS_DELETED]: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    });
  return Players;
}
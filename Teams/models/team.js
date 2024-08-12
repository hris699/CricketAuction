const teamTable=require('../common-function/team_table.json');
module.exports=(sequelize, DataTypes) => {
  const Team = sequelize.define("team", {
   [teamTable.TEAM_ID]:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    [teamTable.TEAM_USER_ID]: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    [teamTable.TEAM_NAME]: {
        type: DataTypes.STRING(45),
        allowNull: false
    },
    [teamTable.TEAM_OWNER_NAME]: {
        type: DataTypes.STRING(45),
        allowNull: false
    },
    [teamTable.TEAM_LOGO]: {
        type: DataTypes.STRING
    },
    [teamTable.IS_DELETED]:{
        type: DataTypes.TINYINT,
        defaultValue:0
    }
},
{
    sequelize,
    timestamp: true,
    underscored: true
})

return Team;
  }
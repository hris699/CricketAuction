const { getSecretString } = require("./common-function/util");

const setSecret = async () => {
    try {
        let connectionDetails = {};
        const secret = await getSecretString(process.env.SECRET_NAME);
        connectionDetails.NODE_ENV = process.env.NODE_ENV;

        connectionDetails.HOST = secret.HOST;
        connectionDetails.PORT = process.env.PORT;
        connectionDetails.DB_PORT = secret.DB_PORT;
        connectionDetails.USER = secret.USER;
        connectionDetails.PASSWORD = secret.PASSWORD;
        connectionDetails.DB = process.env.DB;
        connectionDetails.dialect = process.env.dialect;
        connectionDetails.pool = JSON.parse(process.env.pool);
        return connectionDetails;
    } catch (error) {
        console.log(error);
    }
};

const getConnectionDetails = async () => {
    return new Promise((resolve, reject) => {
        let connectionDetails = {};
        console.log(process.env.NODE_ENV);
        if (
            process.env.NODE_ENV == "production" ||
            process.env.NODE_ENV == "development"
        ) {
            connectionDetails = setSecret().then((connectionData) => {
                connectionDetails = connectionData;
                resolve(connectionDetails);
            });
        } else {
            connectionDetails.NODE_ENV = process.env.NODE_ENV;
            connectionDetails.HOST = process.env.HOST;
            connectionDetails.PORT = process.env.PORT;
            connectionDetails.DB_PORT = process.env.DB_PORT;
            connectionDetails.USER = process.env.USER;
            connectionDetails.PASSWORD = process.env.PASSWORD;
            connectionDetails.DB = process.env.DB;
            connectionDetails.dialect = process.env.dialect;
            connectionDetails.pool = JSON.parse(process.env.pool);
            resolve(connectionDetails);
        }
    });
};
module.exports = { getConnectionDetails };

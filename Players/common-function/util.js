const { GetSecretValueCommand, SecretsManagerClient } = require("@aws-sdk/client-secrets-manager");
const CognitoExpress = require('cognito-express');
const links = require("./manage-links.json");
const moment=require("moment");
const { jwtDecode } = require("jwt-decode");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: process.env.AWS_REGION });
//this function is used to build the response in case of error
const errorResponse = (response, errorCode, errorMessage) => {
  return response.status(errorCode).send({ error: errorMessage });
};

//this function is used to build the response in case of success
const successResponse = (response,data) => {
  return response.status(200).send(data);
};

const getSecretString = async (secretName) => {
  const secret_name = secretName;
  const secret_manager = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const response = await secret_manager.send(
    new GetSecretValueCommand({
      SecretId: secret_name,
    })
  );
  const secret = JSON.parse(response.SecretString);
  process.env.AWS_REGION = secret.AWS_REGION
  process.env.AWS_COGNITO_USER_POOL_ID = secret.USER_POOL_ID
  process.env.TOKEN_USE = secret.TOKEN_USE
  process.env.QUEUE_URL = secret.QUEUE_URL
 
  return secret;
};

const isRouteFound = (userType, methodType, requestPath) => {
  let matchedPath
  links[userType].find((path) => {
    if (path.methodType == methodType && path.link == requestPath) {
      matchedPath = path
    }
  })
  return matchedPath
}
 
const validateUser = async (req, res, next) => {
  try {
    console.log("In validate user ", req.body)
    const requestPath = req.route.path
    const methodType = req.method
    console.log(req.headers);
    console.log(typeof req.headers.websocket)
    const isWebSocket = (req.headers["websocket"]==="true")
    console.log(typeof isWebSocket)
    console.log(isWebSocket)
    if (isRouteFound('public-user', methodType, requestPath)) {
      next()
    }  else if (isWebSocket) {
      console.log("in websocket verify")
      next()
    }  else {
      console.log("inside else")
      const cognitoExpress = new CognitoExpress({ region: process.env.AWS_REGION, cognitoUserPoolId: process.env.AWS_COGNITO_USER_POOL_ID, tokenUse: "access" })
      const token = req.headers["authorization"];
      console.log(token)
      await cognitoExpress.validate(token)
      next()
    }
  }
  catch (error) {
    console.log(error)
    return errorResponse(res, 403, 'Forbidden')
  }
}

const validateAccess = async (req, res, next) => {
  try {
    const requestPath = req.route.path
    const methodType = req.method
    const token=req.headers["authorization"];
    const isWebSocket = (req.headers["websocket"]==="true")
    console.log("in validate access ", isWebSocket);
    if(isWebSocket){
      next();
    }else{
    const payload = jwtDecode(token);
    console.log("Token Payload", payload)
    
    if (payload['cognito:groups'] == 'admin') {
      if (!isRouteFound('admin', methodType, requestPath)) {
        return errorResponse(res, 403, 'Forbidden')
      }
      console.log("Admin")
      next();
    }
    else if (payload['cognito:groups'] == 'user') {
      if (!isRouteFound('user', methodType, requestPath)) {
        return errorResponse(res, 403, 'Forbidden')
      }
      console.log("User")
      next();
    }
  }
  } catch (error) {
    console.log(error)
    return errorResponse(res, 403, 'Forbidden')
  }

}
const checkDateDifference = (startTimes) => {
  console.log("Start Time",startTimes);
  let startDate = startTimes.substring(1, startTimes.length - 1).split(",");
  console.log("type of start date after split", typeof (startDate))

  const startDatesResult = startDate.map((item) => {
    const allStartDates = item
    var then = moment(allStartDates, "YYYY-MM-DD HH:mm:ss:SSSZ");
    var currentDate = moment();
    var diff = moment.duration(then.diff(currentDate));
    console.log("diffffff",diff._milliseconds>0);
    console.log("difff",(diff - 330 * 60 * 1000) > 1000 * 60 * 60 * 24);
    //diff = Math.abs(diff);

    if ((diff._milliseconds>0) && (diff - 330 * 60 * 1000) > 1000 * 60 * 60 * 24) {
      console.log(diff);
      return true;
    } else {
      console.log("difference is either less than 24 hours or the auction is ongoing");
      return false;
    }
  })
  console.log("startDatesResult", startDatesResult);
  return startDatesResult;

}

const getSignedUrl = async (key) => {

  const bucketName = process.env.S3_BUCKET_NAME;
  try {

    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: bucketName,
      Key: key,
      Expires: 6000,
      ResponseContentType: 'image/png'
    });
    return url;
  } catch (error) {
    console.log(error);
    return errorResponse(error)
  }
}

module.exports = {
  errorResponse,
  successResponse,
  getSecretString,
  validateUser,
  checkDateDifference,
  validateAccess,
  getSignedUrl
};
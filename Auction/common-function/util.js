const { GetSecretValueCommand, SecretsManagerClient } = require("@aws-sdk/client-secrets-manager");
const CognitoExpress = require('cognito-express');
const moment = require("moment");
const utilityConstant = require('../common-function/utilityConstant');
const links = require("./manage-links.json");
const { jwtDecode } = require("jwt-decode");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: process.env.AWS_REGION });
const cognito = new AWS.CognitoIdentityServiceProvider();
let { Email, Sms, NotificationEvent } = require('awshelper/Notification')
const { sendEventToSQS } = require('awshelper/SQSHelper')
let email
let sms
let notificationEvent

//this function is used to build the response in case of error
const errorResponse = (res, errorCode, errorMessage) => {
  return res.status(errorCode).send({ error: errorMessage });
};

//this function is used to build the response in case of success
const successResponse = (res, data) => {
  //console.log("success Response", data);
  return res.status(200).send(data);
};

//this function is used to validate start date should not be greater then end date
const checkEndDateGreaterThenStartDate = (req, res, next) => {
  if (new Date(req.body.start_time) >= new Date(req.body.end_time)) {
    errorResponse(res, 400, "Start Time must be before end time");
  } else {
    next();
  }
};

const getSecretString = async (secretName) => {
  const secret_name = secretName;
  const secret_manager = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const res = await secret_manager.send(
    new GetSecretValueCommand({
      SecretId: secret_name,
    })
  );
  const secret = JSON.parse(res.SecretString);
  process.env.AWS_REGION = secret.AWS_REGION
  process.env.AWS_COGNITO_USER_POOL_ID = secret.USER_POOL_ID
  process.env.TOKEN_USE = secret.TOKEN_USE
  process.env.QUEUE_URL = secret.QUEUE_URL

  console.log(secret)
  return secret;
};

const checkDateDifference = async (startTime) => {
  date2 = startTime;
  var auctionTime = moment(date2, utilityConstant.timeFormat);
  console.log("auction time--", auctionTime);
  var currentTime = moment();
  console.log("current time--", currentTime);
  var differenceInTime = moment.duration(auctionTime.diff(currentTime));
  if (differenceInTime - 330 * 60 * 1000 > 1000 * 60 * 60 * 24) {
    console.log("Time is greater more than 24 hrs");
    return 1;
  }
  return 0;
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
    if (isRouteFound('public-user', methodType, requestPath)) {
      next()
    }  else if(isWebSocket){
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

const updateRequest = (req, res, next) => {
  let id_token = req.headers["id_token"];
  const decoded = jwtDecode(id_token);
  console.log("Setting created by ", decoded, decoded.email);
  req.body.created_by = decoded.email
  next()
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

const getUserDetails = async (userPoolId, userNames) => {
  const userDetailsPromises = userNames.map(async username => {
    const params = {
      UserPoolId: userPoolId,
      Username: username,
    };
    const userData = await cognito.adminGetUser(params).promise();
    return userData.UserAttributes;
  });

  const allUserDetails = await Promise.all(userDetailsPromises);
  console.log("AllUserDetails", allUserDetails)
  return allUserDetails;
}

const sendNotification = async (usersDetailsObj, emailMessage, phoneMessage) => {
  for (const user of usersDetailsObj) {
    const phoneNumberOfUser = user.find(attribute => attribute.Name === 'phone_number');
    const emailOfUser = user.find(attribute => attribute.Name === 'email');
    email = new Email(process.env.EMAIL_SUBJECT, emailMessage, emailOfUser.Value);
    sms = new Sms(phoneMessage, phoneNumberOfUser.Value);
    notificationEvent = new NotificationEvent(email, sms)
    console.log("Notification Event", notificationEvent)
    await sendEventToSQS(notificationEvent)

  }

}

module.exports = {
  errorResponse,
  successResponse,
  checkEndDateGreaterThenStartDate,
  getSecretString,
  checkDateDifference,
  validateUser,
  updateRequest,
  getSignedUrl,
  getUserDetails,
  sendNotification,
  validateAccess
};
const { GetSecretValueCommand, SecretsManagerClient } = require('@aws-sdk/client-secrets-manager');
const CognitoExpress = require('cognito-express');

//this function is used to build the response in case of error
const errorResponse = (res, errorCode, errorMessage) => {
  return res.status(errorCode).send({ error: errorMessage })
};

//this function is used to build the response in case of success
const successResponse = (res, data) => {
  console.log("success Response", data)
  return res.status(200).send(data)
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
  process.env.AWS_COGNITO_USER_POOL_ID = secret.AWS_COGNITO_USER_POOL_ID
  process.env.TOKEN_USE = secret.TOKEN_USE
  return secret;
};

const validateUser = async (req, res, next) => {
  try {
    console.log("In validate user ", req.body)
    console.log(req.headers);
    console.log("inside else")
    const cognitoExpress = new CognitoExpress({ region: process.env.AWS_REGION, cognitoUserPoolId: process.env.AWS_COGNITO_USER_POOL_ID, tokenUse: "access" })
    const token = req.headers["authorization"];
    console.log(token)
    const payload = await cognitoExpress.validate(token)
    if (payload['cognito:groups'] == 'admin') {
      next()
    }
    else {
      return errorResponse(res, 403, 'Forbidden')
    }

  }
  catch (error) {
    console.log(error)
    return errorResponse(res, 403, 'Forbidden')
  }
}


module.exports = {
  errorResponse,
  successResponse,
  getSecretString,
  validateUser
}
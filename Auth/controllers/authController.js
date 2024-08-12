const AWS = require("aws-sdk")
const { CognitoIdentityProviderClient, AdminConfirmSignUpCommand, ConfirmForgotPasswordCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { successResponse, errorResponse, getSecretString } = require('../common-function/util')
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

const signUpUser = async (req, res) => {
    try {
        const secret = await getSecretString(process.env.SECRET_NAME)
        var param = {
            ClientId: secret.CLIENT_ID,
            Username: req.body.email,
            Password: req.body.password,
            UserAttributes: [
                {
                    Name: 'name',
                    Value: req.body.name
                },
                {
                    Name: 'phone_number',
                    Value: req.body.phone
                },
                {
                    Name: 'email',
                    Value: req.body.email
                }
            ],
            ValidationData: [
                {
                    Name: 'email',
                    Value: req.body.email
                },
            ]
        };

        let params = {
            UserPoolId: secret.USER_POOL_ID,
            Username: req.body.email,
            GroupName: "user"
        };

        var responseSignup = await cognitoIdentityServiceProvider.signUp(param).promise();
        console.log("response of sign up user: ", responseSignup);

        return await cognitoIdentityServiceProvider.adminAddUserToGroup(params).promise()
            .then(() => {
                return successResponse(res, "User signed up successfully and added to group");
            })
    } catch (error) {
        console.log("error response of sign up user: ", error);
        return errorResponse(res, error.status || 417, error.message);
    }
}

const loginUser = async (req, res) => {
    try {
        const secret = await getSecretString(process.env.SECRET_NAME)
        var params = {
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: secret.CLIENT_ID,
            AuthParameters: {
                PASSWORD: req.body.password,
                USERNAME: req.body.email,
            }
        };
        console.log("params for initiateAuth :- ", params);
        var initiateAuthData = await cognitoIdentityServiceProvider.initiateAuth(params).promise();

        const result = {
            id_token: initiateAuthData.AuthenticationResult.IdToken,
            access_token: initiateAuthData.AuthenticationResult.AccessToken,
            refresh_token: initiateAuthData.AuthenticationResult.RefreshToken
        }
        return successResponse(res, result)
    } catch (error) {
        console.log(error);
        return errorResponse(res, error.status || 417, error.message);
    }
}

const confirmUser = async (req, res) => {
    const flag = req.query.flag;
    const secret = await getSecretString(process.env.SECRET_NAME)
    const input = {
        UserPoolId: secret.USER_POOL_ID,
        Username: req.body.email,
    };
    const params = {
        UserPoolId:  secret.USER_POOL_ID,
        Username: req.body.email,
        UserAttributes: [
          {
            Name: 'email_verified',
            Value: 'true'
          }
        ]
      };
    try {
        if (flag) {
            const client = new CognitoIdentityProviderClient();
            const command = new AdminConfirmSignUpCommand(input);
            const response = await client.send(command);
            await cognitoIdentityServiceProvider.adminUpdateUserAttributes(params).promise();
            return successResponse(res, "User Approved Successfully")
        }
        else {
            await cognitoIdentityServiceProvider.adminDisableUser(input).promise()
            return successResponse(res, "User Disabled Successfully")
        }
    } catch (error) {
        console.log(error)
        return errorResponse(res, error.status || 417, error.message);
    }
}

const requestToRegister = async (req, res) => {
    const secret = await getSecretString(process.env.SECRET_NAME)
    const params = {
        UserPoolId: secret.USER_POOL_ID,
        AttributesToGet: ['name', 'email'],
        Filter: 'cognito:user_status = "UNCONFIRMED"',
    };
    try {
        const data = await cognitoIdentityServiceProvider.listUsers(params).promise();
        const enabledUsers = data.Users.filter(user => user.Enabled);

        if (enabledUsers.length != 0) {
            const users = enabledUsers.map(user => ({
                name: user.Attributes.find(attr => attr.Name === 'name').Value,
                email: user.Attributes.find(attr => attr.Name === 'email').Value,
            }));
            return successResponse(res, users);
        }
        return errorResponse(res, 404, 'No new Notification');
    } catch (error) {
        console.log(error)
        return errorResponse(res, error.status || 417, error.message);
    }
}

const forgotPassword = async (req, res) => {
    try {
        const secret = await getSecretString(process.env.SECRET_NAME);
        const params = {
            ClientId: secret.CLIENT_ID,
            Username: req.body.email,
        };
        var responseForgotPassword = await cognitoIdentityServiceProvider.forgotPassword(params).promise();
        console.log("responseForgotPassword----", responseForgotPassword);
        return successResponse(res, "OTP sent successfully")
    } catch (error) {
        console.log(error)
        return errorResponse(res, error.status || 417, error.message);
    }
};

const resetPassword = async (req, res) => {
    try {
        const secret = await getSecretString(process.env.SECRET_NAME);
        const client = new CognitoIdentityProviderClient();
        var params = {
            ClientId: secret.CLIENT_ID,
            UserPoolId: secret.USER_POOL_ID,
            Username: req.body.email,
            ConfirmationCode: req.body.confirmation_Code,
            Password: req.body.password,
        };
        const command =new ConfirmForgotPasswordCommand(params);
        const confirmForgotPasswordResponse = await client.send(command);
        console.log("confirmForgotPasswordResponse ", confirmForgotPasswordResponse);
        return successResponse(res, "Password Changed Successfully");
    } catch (error) {
        console.log(error)
        return errorResponse(res, error.status || 417, error.message);
    }
};


module.exports = {
    signUpUser,
    loginUser,
    confirmUser,
    requestToRegister,
    forgotPassword,
    resetPassword
}
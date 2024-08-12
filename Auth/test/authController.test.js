const AWS = require('aws-sdk');
const { mockClient } = require("aws-sdk-client-mock");
const { CognitoIdentityProviderClient, AdminConfirmSignUpCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { signUpUser, loginUser, confirmUser, requestToRegister} = require('../controllers/authController');
const { GetSecretValueCommand, SecretsManagerClient } = require("@aws-sdk/client-secrets-manager");

const mockResponse = {
  message: "Successfully disabled the user"
}
jest.mock('aws-sdk', () => {
  return {
    CognitoIdentityServiceProvider: class {
      adminDisableUser() {
        return this;
      }

      promise() {
        return Promise.resolve(mockResponse);
      }
    }
  }
});

describe('Authentication functions', () => {
  describe('signUpUser', () => {
    const smMock = mockClient(SecretsManagerClient);
    smMock.on(GetSecretValueCommand).resolves({
      SecretString: JSON.stringify({
        ClientId: "mock-Clientid"
      }),
    });
    it('should sign up a user successfully', async () => {
      const signUpMock = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue('User signed up successfully') });
      AWS.CognitoIdentityServiceProvider.prototype.signUp = signUpMock;

      AWS.CognitoIdentityServiceProvider.prototype.adminAddUserToGroup = jest
        .fn()
        .mockReturnValue({
          promise: jest
            .fn()
            .mockResolvedValue({ message: "User Added To Group" }),
        });

      const req = {
        body: {
          Username: 'testUser',
          Password: 'testPassword',
          name: 'Test Name',
          phone: '+911234567890',
          email: 'test@example.com',
        },
      };
      const res = {
        send: function (body) {
          this.body = body;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);;
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        }
      };

      const response = await signUpUser(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('User signed up successfully and added to group');
    });

    it('should add in group successfully', async () => {
      const signUpMock = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue('User signed up successfully') });
      AWS.CognitoIdentityServiceProvider.prototype.signUp = signUpMock;
      AWS.CognitoIdentityServiceProvider.prototype.adminAddUserToGroup = jest
        .fn()
        .mockReturnValue({
          promise: jest
            .fn()
            .mockResolvedValue({ message: "User Added To Group" }),
        });

      const res = {
        send: function (body) {
          this.body = body;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);;
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        }
      };
      const req = {
        body: {
          Username: 'testUser',
          Password: 'testPassword',
          name: 'Test Name',
          phone: '+911234567890',
          email: 'test@example.com',
        },
      };

      const response = await signUpUser(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('User signed up successfully and added to group');
    });

    it('should handle errors during sign up', async () => {
      const signUpMock = jest.fn().mockReturnValue({ promise: jest.fn().mockRejectedValue(new Error('Fake error during sign up')) });
      AWS.CognitoIdentityServiceProvider.prototype.signUp = signUpMock;

      const req = {
        body: {
          email: 'test@example.com',
          password: 'password'
        },
      };
      const res = {
        send: function (body) {
          this.body = body;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);;
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        }
      };

      const response = await signUpUser(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe('Fake error during sign up');
    });
  });

  describe('loginUser', () => {
    const smMock = mockClient(SecretsManagerClient);
    smMock.on(GetSecretValueCommand).resolves({
      SecretString: JSON.stringify({
        ClientId: "mock-Clientid"
      }),
    });

    it('should log in a user successfully', async () => {
      const initiateAuthMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          AuthenticationResult: {
            IdToken: 'fakeIdToken',
            AccessToken: 'fakeAccessToken',
            RefreshToken: 'fakeRefreshToken',
          },
        })
      });
      AWS.CognitoIdentityServiceProvider.prototype.initiateAuth = initiateAuthMock;

      const req = {
        body: {
          password: 'testPassword',
          email: 'test@example.com',
        },
      };
      const res = {
        send: function (body) {
          this.body = body;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);;
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        }
      };

      const response = await loginUser(req, res);
      expect(response.statusCode).toBe(200);
    });

    it('should handle errors during login', async () => {
      const initiateAuthMock = jest.fn().mockReturnValue({ promise: jest.fn().mockRejectedValue(new Error('Error during login')) });
      AWS.CognitoIdentityServiceProvider.prototype.initiateAuth = initiateAuthMock;

      const req = {
        body: {
          email: 'test@example.com',
          password: 'password'
        },
      };
      const res = {
        send: function (body) {
          this.body = body;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);;
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        }
      };

      const response = await loginUser(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe('Error during login');
    });
  });

  describe('confirmUser function', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const smMock = mockClient(SecretsManagerClient);
    smMock.on(GetSecretValueCommand).resolves({
      SecretString: JSON.stringify({
        UserPoolId: "mock-UserPoolid"
      }),
    });

    it('should confirm user if flag is true', async () => {
      const req = { query: { flag: true }, body: { email: 'user@example.com' } };
      const res = {
        send: function (body) {
          this.body = body;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);;
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        }
      };

      const mockSend = jest.fn().mockResolvedValue({ message: 'User Approved Successfully' });
      CognitoIdentityProviderClient.prototype.send = mockSend;
      
      AWS.CognitoIdentityServiceProvider.prototype.adminUpdateUserAttributes = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue()
      });

      const response = await confirmUser(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('User Approved Successfully');
    });

    it('should disable user if flag is false', async () => {
      const req = { query: { flag: false }, body: { email: 'user@example.com' } };
      const res = {
        send: function (body) {
          this.body = body;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);;
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        }
      };

      const mockDisableUserResponse = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ message: "Successfully disabled the user" }) })
      CognitoIdentityProviderClient.prototype.adminDisableUser = jest.fn(() => mockDisableUserResponse);

      const response = await confirmUser(req, res);
      expect(response.statusCode).toBe(200);
    });

    it('should handle error', async () => {
      const req = { query: { flag: false }, body: { email: '' } };
      const res = {
        send: function (body) {
          this.body = body;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);;
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        }
      };
      AWS.CognitoIdentityServiceProvider.prototype.adminDisableUser = jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue({ message: "User Denied" })
      });

      const response = await confirmUser(req, res);
      expect(response.statusCode).toBe(417);
    });
  });

  describe('requestToRegister function', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    const smMock = mockClient(SecretsManagerClient);
    smMock.on(GetSecretValueCommand).resolves({
      SecretString: JSON.stringify({
        UserPoolId: "mock-UserPoolid"
      }),
    });

    it('should return a list of unconfirmed users', async () => {

      const req = {};
      const res = {
        send: function (body) {
          this.body = body;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);;
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        }
      };
      const mockListUsers = {
        Users: [
          {
            Attributes: [
              { Name: 'name', Value: 'Hardik' },
              { Name: 'email', Value: 'hardik@gmail.com' },
            ],
            Enabled: true
          },
        ],
      };

      AWS.CognitoIdentityServiceProvider.prototype.listUsers = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockListUsers)
      });
      const response = await requestToRegister(req, res);
      expect(response.statusCode).toBe(200);
    });

    it('should handle errors and return a 400 status code', async () => {
      const req = {};
      const res = {
        send: function (body) {
          this.body = body;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);;
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        }
      };
      AWS.CognitoIdentityServiceProvider.prototype.listUsers = jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue({ message: "Error during listing from Cognito" })
      });

      const response = await requestToRegister(req, res);
      console.log("response", response);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("Error during listing from Cognito");
    });
  });

});



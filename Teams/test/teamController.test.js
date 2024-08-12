const team = require("../Services/teamService");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const teamModel = require("../models/team");
const teamController=require("../Controller/teamController")
const axios=require("axios");
const header={
  authorization:"eyJraWQiOiJKVyt6dkxZNGJwRlwvelE2K3lRVVhEdTNCNFdiK0NHalNnMWJkYUJTZHBkTT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI1YzFiNjBhMi0wNjU0LTQ4ODQtYTQzNC1hZDBiYjM2N2Q3N2QiLCJjb2duaXRvOmdyb3VwcyI6WyJhZG1pbiJdLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0yLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMl9nbkhROTFDNEkiLCJjbGllbnRfaWQiOiI1dG1xaGlydmJ0azk1NmFjZjA5Zm1qM3JnZCIsIm9yaWdpbl9qdGkiOiJlNmE5YTQ5NC1kODJjLTQ2NjItOGYzMS03MjdmZTQ3MzBmMDIiLCJldmVudF9pZCI6IjVkNTcyMWJmLTI1MzQtNDI5YS05YjJmLTBmYzdlZTMzMGUwMSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3MDQ3MTA5OTgsImV4cCI6MTcwNDcxNDU5OCwiaWF0IjoxNzA0NzEwOTk4LCJqdGkiOiI0NWRjNDBmMi0xOTI1LTQyZmEtODAxNC1iYzkyMTI5ZWNlYTciLCJ1c2VybmFtZSI6IjVjMWI2MGEyLTA2NTQtNDg4NC1hNDM0LWFkMGJiMzY3ZDc3ZCJ9.EmY-bskYe8ol1ecGLxKJPrDMJNzR7sYLdoGQs-Z-lvqjpjmyskOSTd4XUsDr7kzbLTXWSwV6w0sNC_LEQCxkr4j1hLLdOQfP5N45P5VlOxP4GvAU-M3K7KOx1ZsyUYkJv2sP6iyOb96YowRb82ZmhLXIFg1giS3vgfk4zOw34qFMuPk3wVH12T0V_gOZaTaZZo626kvsTS9LPKkkapcCucvxH-i4Fb2EqTHiFcQtn2fXI_JL-s220UBFINpAYjkuij11PQXJyNqmBVrPLV_wkfO1bAbnS9jFf0RZpc3n31_xHtqtsGSezXOdN8JKqa1ERYDdpkB2w6UA72unl56J5g"
}
describe("Team Controller Test Cases", () => {
  let res;
  const mockS3UploadPromise = jest.fn().mockResolvedValue({ Location: 'https://s3.amazonaws.com/test-bucket/test.jpg' });
  beforeAll(() => {
    AWS.S3.prototype.upload = jest.fn().mockReturnValue({ promise: mockS3UploadPromise });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    process.env.S3_BUCKET_NAME = "TEMP-BUCKET-NAME";
    res = {
      send: function (body) {
        this.body = body;
        return this;
      },
      json: function (d) {
        console.log("\n : " + d);
      },
      status: function (s) {
        this.statusCode = s;
        return this;
      },
    };
  });

  describe("Get All Teams Test Cases", () => {
    it("should return the list of all the teams", async () => {
      team.setTeam(teamModel);
      const teams = [
        {
          t_name: "CSK",
          t_owner_name: "Anshu",
          t_logo: "http://someimage.com/",
        },
      ];
      const req = {
        body: {
          team: teams,
        },
        headers: header
      };
      console.log(req.headers)
      teamModel.findAll = jest.fn().mockImplementation(() => {
        return teams;
      });
      let result = await teamController.getAllTeams(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.teams.length).toBe(teams.length);
      expect(res.body.teams[0].t_name).toBe(teams[0].t_name);
    });

    it("should return 404 if no team exists while getting list of teams", async () => {
      team.setTeam(teamModel);
      const teams = [];
      const req = {
        body: {
          team: teams,
        },
        headers: header
      };
      teamModel.findAll = jest.fn().mockImplementation(() => {
        return teams;
      });
      const response = await teamController.getAllTeams(req, res);
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toEqual("No teams exist");
    });

    it("should return 500 while getting list of teams", async () => {
      team.setTeam(teamModel);
      const teams = [
        {
          t_name: "CSK",
          t_owner_name: "Anshu",
          t_logo: "http://someimage.com/",
        },
      ];
      const req = {
        body: {
          team: teams,
        },
        headers: header
      };
      teamModel.findAll = jest.fn().mockImplementation(() => {
        throw new Error("Internal Server Error");
      });
      const response = await teamController.getAllTeams(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    });
  })

  describe("Get A Team By Id Test Cases", () => {
    it("should get team details by ID", async () => {
      team.setTeam(teamModel);
      const req = {
        params: {
          team_id: 1,
        },
      };
      teamModel.findOne = jest.fn().mockReturnValueOnce({
        t_id: 1,
        t_name: "CSK",
        t_owner_name: "Anshu Sharma",
        t_logo: "http://someimage.com/",
      });
      const response = await teamController.getTeamById(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body.t_name).toEqual("CSK");
    });

    it("should return 404 if team does not exist while getting team details", async () => {
      team.setTeam(teamModel);
      const req = {
        params: {
          team_id: 56789,
        },
      };
      teamModel.findOne = jest.fn().mockReturnValueOnce(null);
      const response = await teamController.getTeamById(req, res);
      console.log(response)
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toEqual("No team exists");
    })
  })

  describe("Create a new team test cases", () => {
    it("should return error team already exists for this user", async () => {
      team.setTeam(teamModel);
      const teams = {
        t_id: 1,
        t_user_id: 2,
        t_name: "Superstars",
        t_owner_name: "Anshu"
      }

      const reqBody = {
        team_user_id: 2,
        team_name: "Superstars",
        team_owner_name: "Anshu"
      }
      const req = {
        body: reqBody
      };
      teamModel.findOne = jest.fn().mockReturnValueOnce({
        t_id: 1,
        t_name: "ExistingTeam",
        owner_name: "Jane Doe",
        t_logo: "http://someimage.com/",
      });
      teamModel.create = jest.fn().mockResolvedValue(() => {
        return { dataValues: teams };
      });
      await teamController.addTeam(req, res);
      expect(AWS.S3.prototype.upload).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
    });

    it("should insert data into db without image", async () => {
      team.setTeam(teamModel);
      const teams = {
        t_id: 1,
        t_user_id: 2,
        t_name: "Superstars",
        t_owner_name: "Anshu"
      }

      const reqBody = {
        team_user_id: 2,
        team_name: "Superstars",
        team_owner_name: "Anshu"
      }
      const req = {
        body: reqBody
      };
      teamModel.findOne = jest.fn().mockReturnValueOnce(null);
      teamModel.create = jest.fn().mockResolvedValue(() => {
        return { dataValues: teams };
      });
      await teamController.addTeam(req, res);
      expect(AWS.S3.prototype.upload).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    it("should insert data into db with image", async () => {
      team.setTeam(teamModel);
      const teams = {
        t_id: 1,
        t_user_id: 2,
        t_name: "Superstars",
        t_owner_name: "Anshu"
      }

      const reqBody = {
        team_user_id: 2,
        team_name: "Superstars",
        team_owner_name: "Anshu"
      }
      const req = {
        body: reqBody,
        file: {
          fieldname: 'team_logo',
          originalname: 'cricket.jfif',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/Users/anshu.sharma/Desktop/UAS_UI/UAS_UI/public/images/teams',
          filename: '1704785445025cricket.jfif',
          path: '\\Users\\anshu.sharma\\Desktop\\UAS_UI\\UAS_UI\\src\\public\\images\\teams\\1704785445025cricket.jfif',
          size: 5130
        },
      };
      teamModel.findOne = jest.fn().mockReturnValueOnce(null);
      teamModel.create = jest.fn().mockResolvedValue(() => {
        return { dataValues: teams };
      });
      await teamController.addTeam(req, res);
      expect(AWS.S3.prototype.upload).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
    });

    it("should return 204 if no content provided for adding team", async () => {
      team.setTeam(teamModel);
      const req = {
        body: {
          team_name: "",
          team_owner_name: "",
          team_logo: "",
        },
      };
      teamModel.findOne = jest.fn().mockReturnValueOnce(null);
      const response = await teamController.addTeam(req, res);
      expect(response.statusCode).toBe(204);
      expect(response.body.error).toEqual("No Content");
    });
  })

  describe("Update A Team By Id Test Cases", () => {
    it("should update team details successfully with no new image", async () => {
        team.setTeam(teamModel);
        const req = {
          params: {
            team_id: 1,
          },
          body: {
            team_name: "RCB",
            team_owner_name: "Anshu",
            team_logo: "http://someimage.com/",
          },
        };
        teamModel.findOne = jest.fn().mockReturnValueOnce({
          t_id: 1,
          t_name: "ExistingTeam",
          owner_name: "Jane Doe",
          t_logo: "http://someimage.com/",
        });
        teamModel.update = jest.fn().mockReturnValueOnce([1]);
        const response = await teamController.updateTeam(req, res);
        expect(response.statusCode).toBe(200);
        expect(response.body[0]).toEqual(1);
    });

    it("should update team details successfully with new image", async () => {
        team.setTeam(teamModel);
        const req = {
          params: {
            team_id: 1,
          },
          body: {
            team_name: "RCB",
            team_owner_name: "Anshu",
          },
          file: {
            fieldname: 'team_logo',
            originalname: 'cricket.jfif',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            destination: '/Users/anshu.sharma/Desktop/UAS_UI/UAS_UI/public/images/teams',
            filename: '1704785445025cricket.jfif',
            path: '\\Users\\anshu.sharma\\Desktop\\UAS_UI\\UAS_UI\\src\\public\\images\\teams\\1704785445025cricket.jfif',
            size: 5130
          },
        };
        teamModel.findOne = jest.fn().mockReturnValueOnce({
          t_id: 1,
          t_name: "ExistingTeam",
          owner_name: "Jane Doe",
          t_logo: "http://someimage.com/",
        });
      teamModel.update = jest.fn().mockReturnValueOnce([1]);
      const response = await teamController.updateTeam(req, res);
      expect(AWS.S3.prototype.upload).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(200);
      expect(response.body[0]).toEqual(1);
    });
    
    it("should return 500 if team ID is invalid while updating team details", async () => {
      team.setTeam(teamModel);
      const req = {
        params: {
          team_id: "invalid_id",
        },
        body: {
          team_name: "RCB",
          team_owner_name: "Anshu",
          team_logo: "http://someimage.com/",
        },
      };

        teamModel.update = jest.fn().mockReturnValueOnce([1]);
        const response = await teamController.updateTeam(req, res);
        expect(response.statusCode).toBe(417);
        expect(response.body.error).toEqual("There seems to be some issue. Sorry for inconvenience.");
    });
  })
    
  describe("Delete a team test cases",()=>{
    it("it should delete a team successfully",async()=>{
      team.setTeam(teamModel);

      const request = {
        params: {
          team_id: 1
        },
        query: {
          auction_id: []
        }
      }
      const response = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };
      const internalResponse = { data: true }
      const deleteTeamResponse = [1];

      jest.mock('axios')
      axios.delete = jest.fn().mockResolvedValue(internalResponse);

      teamModel.update = jest.fn().mockImplementation(() => {
        return deleteTeamResponse;
      })

      const res = await teamController.deleteTeam(request, response);
      console.log("delete Response in Test", res);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual("Team Deleted Successfully");
    })

    it("it return 403 error when auction is ongoing/upcoming(have less than 24hrs)", async () => {
      team.setTeam(teamModel);

      const request = {
        params: {
          team_id: 1
        },
        query: {
          auction_id: "[101]",
          start_time: "[2023-01-15 15:19:00,2023-12-2 13:00:00]"
        }
      }
      const response = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };
      const internalResponse = { data: true }
      const deleteTeamResponse = [1];

      jest.mock('axios')
      axios.delete = jest.fn().mockResolvedValue(internalResponse);

      teamModel.update = jest.fn().mockImplementation(() => {
        return deleteTeamResponse;
      })

      const res = await teamController.deleteTeam(request, response);
      console.log("delete Response in Test", res);
      expect(response.statusCode).toBe(403);
      expect(response.body.error).toEqual("Can't delete as auction start time is less than 24 hrs or the auction is ongoing.");
    })

    it("it should return 400 when unable to delete a team", async () => {
      team.setTeam(teamModel);

      const request = {
        params: {
          team_id: 1
        },
        query: {
          auction_id: [],
          start_time: []
        }
      }
      const response = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };
      const deleteTeamResponse = false;

      teamModel.update = jest.fn().mockImplementation(() => {
        return deleteTeamResponse;
      })

      const res = await teamController.deleteTeam(request, response);
      console.log("delete Response in Test", res);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toEqual("Unable to delete team");
    })

    it("it should return 417 when unable to delete a team", async () => {
      team.setTeam(teamModel);

      const request = {
        params: {
          team_id: 1
        },
        query: {
          auction_id: "[101]"
        }
      }
      const response = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };
      const internalResponse = { data: true }

      jest.mock('axios')
      axios.delete = jest.fn().mockResolvedValue(internalResponse);

      teamModel.update = jest.fn().mockImplementation(() => {
        throw Error("There seems to be some issue. Sorry for inconvenience.")
      })

      const res = await teamController.deleteTeam(request, response);
      console.log("delete Response in Test", res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toEqual("There seems to be some issue. Sorry for inconvenience.");
    })
  })
  
  describe("List all teams detail based on ids", () => {
    it("should return the list of teams", async () => {
      team.setTeam(teamModel);

      const request = {
        body: {
          team_id: [1]
        }
      };
      const response = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };
      const teams = {
        team_id: 1,
        team_name: "CSK"

      }

      teamModel.findAll = jest.fn().mockImplementation(() => {
        return teams;
      });
      const res = await teamController.getTeamByIds(request, response);
      console.log("response====", res);
      console.log(response)
      expect(response.statusCode).toBe(200);
    });

    it("should return 404 while getting list of teams", async () => {
      team.setTeam(teamModel);

      const request = {
        body: {
          team_id: [1],
        },
      };
      const response = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };
      const teamsDetail = false;
      teamModel.findAll = jest.fn().mockImplementation(() => {
        return teamsDetail;
      });
      const res = await teamController.getTeamByIds(request, response);
      console.log(response);
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("No such team exists");
    });

    it("should return 417 while getting list of teams", async () => {
      team.setTeam(teamModel);

      const request = {
        body: {
          team_id: [1],
        },
      };
      const response = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };

      teamModel.findAll = jest.fn().mockImplementation(() => {
        throw Error("There seems to be some issue. Sorry for inconvenience.")
      });
      const res = await teamController.getTeamByIds(request, response);
      console.log(response);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    });
  });

  describe("Test cases for listing team_auction association", () => {
    it("should return list of auction_team association successfully", async () => {
      team.setTeam(teamModel);

      const req = {
        params: {
          team_id: 1
        }
      }
      const res = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };
      const teamDetail = [{
        dataValues: {
          t_id: 4,
          t_name: 'CSK',
          t_email: 'pondya@gmail.com'
        }
      }]
      const internalResponse = {
        data: [
          {
            "auctionId": 1,
            "auctionName": "IPL",
            "auctionStartTime": "2024-02-02T13:00:00.000Z"
          }
        ]
      }
      jest.mock('axios')
      axios.get = jest.fn().mockResolvedValue(internalResponse);

      teamModel.findOne = jest.fn().mockImplementation(() => {
        return teamDetail;
      })
      const response = await teamController.getTeamAssociation(req, res)
      console.log("response", response);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(internalResponse.data);
    })

    it("should return 400 error while trying to get list of auction_player association successfully", async () => {
      team.setTeam(teamModel);

      const req = {
        params: {
          team_id: 1
        }
      }
      const res = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };
      const teamDetail = null;
      teamModel.findOne = jest.fn().mockImplementation(() => {
        return teamDetail;
      })
      const response = await teamController.getTeamAssociation(req, res)
      console.log("response", response);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("No team found");
    })

    it("should return 417 error while trying to get list of auction_player association successfully", async () => {
      team.setTeam(teamModel);

      const req = {
        params: {
          team_id: 1
        }
      }
      const res = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };

      teamModel.findOne = jest.fn().mockImplementation(() => {
        throw Error("There seems to be some issue. Sorry for inconvenience.")
      })
      const response = await teamController.getTeamAssociation(req, res)
      console.log("response", response);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    })
  })

  describe("getTeamByUserId test cases",()=>{
    it("should return team details by user id",async ()=>{
      team.setTeam(teamModel);

      const request = {
        params: {
          user_id: 1
        }
      }
      const response = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };
      const teamDetail = [{
        dataValues: {
          t_id: 4,
          t_name: 'CSK',
          t_email: 'pondya@gmail.com'
        }
      }]
      teamModel.findAll= jest.fn().mockImplementation(()=>{
        return teamDetail;
       })
       const res= await teamController.getTeamByUserId(request,response);
       console.log("response",res);
       expect(response.statusCode).toBe(200);
       expect(response.body).toBe(teamDetail);

    })

    it("should return 404 when fetching team details by user id",async ()=>{
      team.setTeam(teamModel);

      const request = {
        params: {
          user_id: 1
        }
      }
      const response = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };
      const teamDetail = [];
      teamModel.findAll= jest.fn().mockImplementation(()=>{
        return teamDetail;
       })
       const res= await teamController.getTeamByUserId(request,response);
       expect(response.statusCode).toBe(404);
       expect(response.body.error).toBe("No teams exists for UserId");
    })

    it("should return 417 when fetching team details by user id",async ()=>{
      team.setTeam(teamModel);

      const request = {
        params: {
          user_id: 1
        }
      }
      const response = {
        send: function (responseBody) {
          this.body = responseBody;
          return this;
        },
        json: function (d) {
          console.log("\n : " + d);
        },
        status: function (s) {
          this.statusCode = s;
          return this;
        },
      };

      teamModel.findAll= jest.fn().mockImplementation(()=>{
        throw Error("There seems to be some issue. Sorry for inconvenience.")
       })
       const res= await teamController.getTeamByUserId(request,response);
       expect(response.statusCode).toBe(417);
       expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    })
  })

});
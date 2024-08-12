const auction_team = require("../services/auctionTeamService");
let auctionTeamModel = require('../models/auctionTeamModel');
const auction = require("../services/auctionService");
let auctionModel = require("../models/auctionModel");
let auctionTeamController = require("../controllers/auctionTeamController")
const axios = require("axios");
const util= require('../common-function/util')

describe("auction Team controller", () => {
  describe("Registering team to an auction", () => {
    it('should create a pending request for a team in auction successfully', async () => {
          auction_team.setAuctionTeam(auctionTeamModel)
          auction.setAuction(auctionModel)
          const auctionTeamBody = {
            at_team_id: 1
          }
     
          const responseBody = {
            at_auction_id: 1,
            at_team_id: 1,
            at_current_wallet_balance: 1000000,
            at_approval_status: "pending"
          }
     
          const teamList = {
            data: [ { t_id: 4, t_name: 'RCB', t_user_id: '875' } ]
          }
     
          const auctionList = {
            dataValues: [ { a_purse_value: 1000000 } ]
          }
     
          const req = {
            params: { at_auction_id: 1 },
            body: auctionTeamBody,
          };
          res = {
            send: function (responseBody) {
              this.body = responseBody;
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
     
          jest.mock("axios");
          axios.get = jest.fn().mockResolvedValue(teamList);
     
          auctionModel.findOne = jest.fn().mockImplementation(() => {
            return auctionList;
          })
     
          auctionTeamModel.create = jest.fn().mockImplementation(() => {
            return responseBody;
          });
     
          const response = await auctionTeamController.requestToRegisterForAuctionController(req, res);
          expect(response.statusCode).toBe(200);
          expect(response.body.at_auction_id).toBe(1);
          expect(response.body.at_team_id).toBe(1);
        });

    it('handle 417 error while requesting to add team to auction', async () => {
      auction_team.setAuctionTeam(auctionTeamModel)
      const auctionTeamBody = {
        at_team_id: 1
      }

      const req = {
        params: { at_auction_id: 1 },
        body: {
          auction: auctionTeamBody,
        },
      };
      res = {
        send: function (error) {
          this.body = error;
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
      auctionTeamModel.create = jest.fn().mockImplementation(() => {
        throw new Error("There seems to be some issue.Sorry for inconvenience.")
      });
      const response = await auctionTeamController.requestToRegisterForAuctionController(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue.Sorry for inconvenience.");
    });
  });

  describe("Accepting team to an auction", () => {
    it('should accept/deny the request to register a team in an auction successfully', async () => {
      auction_team.setAuctionTeam(auctionTeamModel)
      auction.setAuction(auctionModel)
 
      const auctionTeamBody = {
        at_team_id: 1,
        approval_status: "denied"
      }
 
      const responseBody = {
        message: "Updated Successfully"
      }
 
      const response1 = {
        dataValues: { a_no_of_teams: 2 }
      }
 
      const req = {
        params: { at_auction_id: 1 },
        body: auctionTeamBody,
      };
      res = {
        send: function (responseBody) {
          this.body = responseBody;
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
      auctionTeamModel.findAll = jest.fn().mockImplementation(() => {
        return 1;
      });
      auctionModel.findOne = jest.fn().mockImplementation(() => {
        return response1;
      });
      auctionTeamModel.update = jest.fn().mockImplementation(() => {
        return responseBody;
      });
      axios.post = jest.fn().mockImplementation(() => {
        return { data: [] };
      })
      util.getUserDetails = jest.fn().mockImplementation(() => {
        return [name = "dharmesh", email = "dharmesh.rane@gamil.com", phone = "7389874753"];
      });
      util.sendNotification = jest.fn().mockImplementation(() => {
        return [];
      });
      const response = await auctionTeamController.approvalOrDenialOfRegisterForAuctionController(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe("Updated Successfully");
    });

    it('handle 417 error while accepting/denying team to auction', async () => {
      auction_team.setAuctionTeam(auctionTeamModel)
      const auctionTeamBody = {
        at_team_id: 1,
        approval_status: "accepted"
      }

      const req = {
        params: { at_auction_id: 1 },
        body: {
          auction: auctionTeamBody,
        },
      };
      res = {
        send: function (error) {
          this.body = error;
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
      auctionTeamModel.update = jest.fn().mockImplementation(() => {
        throw new Error("There seems to be some issue.Sorry for inconvenience.")
      });
      const response = await auctionTeamController.approvalOrDenialOfRegisterForAuctionController(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue.Sorry for inconvenience.");
    });

    it('handle 417 error while getting max team allowed', async () => {
      auction.setAuction(auctionModel)
      const auctionTeamBody = {
        at_team_id: 1,
        approval_status: "accepted"
      }

      const req = {
        params: { at_auction_id: 1 },
        body: {
          auction: auctionTeamBody,
        },
      };
      res = {
        send: function (error) {
          this.body = error;
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
      auctionModel.findOne = jest.fn().mockImplementation(() => {
        return false;
      });
      const response = await auction.maxTeamAllowed(req, res);
      expect(response).toBe(false);
    });

    it('handle 404 while accepting/denying request to register team to auction', async () => {
      auction_team.setAuctionTeam(auctionTeamModel)
      auction.setAuction(auctionModel)
      const auctionTeamBody = {
        at_team_id: 1,
        approval_status: "accepted"
      }

      const response1 = {
        dataValues: { a_no_of_teams: 2 }
      }

      const req = {
        params: { at_auction_id: 1 },
        body: auctionTeamBody,
      };
      res = {
        send: function (responseBody) {
          this.body = responseBody;
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
      auctionTeamModel.findAll = jest.fn().mockImplementation(() => {
        return 2;
      });
      auctionModel.findOne = jest.fn().mockImplementation(() => {
        return response1;
      });
      auctionTeamModel.update = jest.fn().mockImplementation(() => {
        return "Participations are full.Please try for another auction.";
      });
      const response = await auctionTeamController.approvalOrDenialOfRegisterForAuctionController(req, res);
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("Participations are full.Please try for another auction.");
    });
  });

  describe("List of Auctions related to a team", () => {
    it('should return list of objects with auction name and wallet balance of that team for that auction', async () => {
      auction_team.setAuctionTeam(auctionTeamModel)
      auction.setAuction(auctionModel)
      const auctionTeamBody = [{
        at_auction_id: 1,
        at_team_id: 1,
        at_current_wallet_balance: 200000,
        approval_status: "accepted"
      }]
      const auctionBody = [
        {
          dataValues: { a_name: 'Champion Trophy', a_start_time: "2024-01-31T13:12:10.000Z" }
        }]
      const req = {
        params: { at_team_id: 1 }
      }
      const responseAuction = [
        {
          auction_name: 'Champion Trophy',
          auction_team_current_wallet: 200000,
          auction_start_time: "2024-01-31T13:12:10.000Z"
        }
      ]
      res = {
        send: function (responseBody) {
          this.body = responseBody;
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
      auctionTeamModel.findAll = jest.fn().mockImplementation(() => {
        return auctionTeamBody;
      });
      auctionModel.findAll = jest.fn().mockImplementation(() => {
        return auctionBody;
      });

      const response = await auctionTeamController.getAuctionByTeamIdController(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(responseAuction.length);
    });

    it("should return 404 if no auction exists while getting list of teams", async () => {
      auction_team.setAuctionTeam(auctionTeamModel)
      auction.setAuction(auctionModel)
      const auctionTeamBody = []
      const req = {
        params: { at_team_id: 1 }
      }
      res = {
        send: function (responseBody) {
          this.body = responseBody;
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
      auctionTeamModel.findAll = jest.fn().mockImplementation(() => {
        return auctionTeamBody;
      });
      const response = await auctionTeamController.getAuctionByTeamIdController(req, res);
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toEqual("No auction exists");
    });

    it("should return 417 while getting list of auctions by id", async () => {
      auction_team.setAuctionTeam(auctionTeamModel)
      auction.setAuction(auctionModel)
      const req = {
        params: { at_team_id: 1 }
      }
      res = {
        send: function (responseBody) {
          this.body = responseBody;
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
      auctionTeamModel.findAll = jest.fn().mockImplementation(() => {
        throw new Error("There seems to be some issue.Sorry for inconvenience.");
      });
      const response = await auctionTeamController.getAuctionByTeamIdController(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue.Sorry for inconvenience.");
    });
  });

  describe("get team detail in an auction", () => {
    it("should successfully return detail list of teams in an auction", async () => {
      auction_team.setAuctionTeam(auctionTeamModel);
      const data = [
        {
          dataValues: { at_team_id: 1 },
        },
      ];

      const responseBody = {
        data: [
          {
            "t_id": 1,
            "t_name": "CSK"
          }
        ]
      };

      const req = {
        params: { auction_id: 1 }
      };
      res = {
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
      jest.mock("axios");
      axios.post = jest.fn().mockResolvedValue(responseBody);
      auctionTeamModel.findAll = jest.fn().mockImplementation(() => {
        return data;
      });
      const response = await auctionTeamController.getTeamsInAuctionController(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body.t_id).toBe(responseBody.data.t_id);
    });

    it("it should give the list having status approved and pending in team status successfully", async () => {
      auction_team.setAuctionTeam(auctionTeamModel);
      auction.setAuction(auctionModel);
      const req = {
        params: { teamId: 1 }
      };

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

      const teamAuctionDetails = [{
        dataValues: {
          at_auction_id: 1,
          at_team_id: 101,
          at_current_wallet_balance: 100000,
          at_approval_status: 'accepted'
        }
      }]
      const AuctionResult = [{
        dataValues: { a_id: 1, a_name: 'IPL', a_start_time: "2023-12-20T13:00:00.000Z" }
      }]

      auctionTeamModel.findAll = jest.fn().mockImplementation(() => {
        return teamAuctionDetails;
      });
      auctionModel.findAll = jest.fn().mockImplementation(() => {
        return AuctionResult;
      })

      const response = await auctionTeamController.getTeamStatusInAuctionController(req, res);
      console.log("response of auction----", response);
      expect(response.statusCode).toBe(200);
      expect(response.body[0].teamStatus).toStrictEqual('accepted');
    });

    it("it should 404 error in case of no association of team with any auction.", async () => {
      auction_team.setAuctionTeam(auctionTeamModel);
      auction.setAuction(auctionModel);
      const req = {
        params: { teamId: 1 }
      };

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

      const teamAuctionDetails = []

      auctionTeamModel.findAll = jest.fn().mockImplementation(() => {
        return teamAuctionDetails;
      });

      const response = await auctionTeamController.getTeamStatusInAuctionController(req, res);
      console.log("response of auction----", response);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toStrictEqual('Team not associated with auction');
    });

    it("it should 417 error in case of no association of team with any auction.", async () => {
      auction_team.setAuctionTeam(auctionTeamModel);
      auction.setAuction(auctionModel);
      const req = {
        params: { teamId: 1 }
      };

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

      auctionTeamModel.findAll = jest.fn().mockImplementation(() => {
        throw Error("There seems to be some issue. Sorry for inconvenience.")
      });

      const response = await auctionTeamController.getTeamStatusInAuctionController(req, res);
      console.log("response of auction----", response);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toStrictEqual('There seems to be some issue. Sorry for inconvenience.');
    });
  });

  describe("delete a team association from auction Team Table", () => {
    it("should delete a team association successfully from auction Team", async () => {
      auction_team.setAuctionTeam(auctionTeamModel);
      const req = {
        params: {
          team_id: 101
        },
        query: {
          auction_ids: 1
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
      const deleteResponse = 1;

      auctionTeamModel.destroy = jest.fn().mockImplementation(() => {
        return deleteResponse;
      });

      const response = await auctionTeamController.deleteAuctionTeamController(req, res);
      console.log("response of deleteAuctionTeam", response);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(true);
    });

    it("should return 400 and cannot delete a team association successfully from auction Team", async () => {
      auction_team.setAuctionTeam(auctionTeamModel);
      const req = {
        params: {
          team_id: 101
        },
        query: {
          auction_ids: 1
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
      const deleteResponse = 0;

      auctionTeamModel.destroy = jest.fn().mockImplementation(() => {
        return deleteResponse;
      });

      const response = await auctionTeamController.deleteAuctionTeamController(req, res);
      console.log("response of deleteAuctionTeam", response);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toEqual("Unable to delete");
    });

    it("should return 417 error while trying to delete team Auction Association", async () => {
      auction_team.setAuctionTeam(auctionTeamModel);
      const req = {
        params: {
          team_id: 101
        },
        query: {
          auction_ids: [1]
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

      auctionTeamModel.destroy = jest.fn().mockImplementation(() => {
        throw Error("There seems to be some issue. Sorry for inconvenience.")
      });

      const response = await auctionTeamController.deleteAuctionTeamController(req, res);
      console.log("response of deleteAuctionTeam", response);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toEqual("There seems to be some issue. Sorry for inconvenience.");
    });
  })

  describe("list of pending teams for notification", () => {
    it("should return list of pending teams for notification purpose successfully", async () => {
      auction.setAuction(auctionModel);
      auction_team.setAuctionTeam(auctionTeamModel);
      const req = {};

      res = {
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

      const auctionDetails = [{
        dataValues: { a_id: 1, a_name: 'IPL' }
      }]
      const responseBody = { data: [{ t_id: 101, t_name: 'RCB', t_logo: null }] }

      const TeamRequestList = [{
        dataValues: {
          at_auction_id: 2,
          at_team_id: 101,
          at_current_wallet_balance: 100000,
          at_approval_status: 'pending'
        }
      }]
      jest.mock("axios");
      axios.post = jest.fn().mockResolvedValue(responseBody);
      auctionModel.findAll = jest.fn().mockImplementation(() => {
        return auctionDetails;
      });
      auctionTeamModel.findAll = jest.fn().mockImplementation(() => {
        return TeamRequestList;
      });
      const response = await auctionTeamController.getTeamRequestForAuctionController(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body.t_id).toBe(responseBody.data.t_id);

    })

    it("should return 400 error while trying to list pending teams requests for notification", async () => {
      auction.setAuction(auctionModel);
      auction_team.setAuctionTeam(auctionTeamModel);
      const req = {};

      res = {
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
      const auctionDetails = []

      auctionModel.findAll = jest.fn().mockImplementation(() => {
        return auctionDetails;
      });
      const response = await auctionTeamController.getTeamRequestForAuctionController(req, res);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("No Requests Found");

    })

    it("should return 400 error while trying to list pending teams requests for notification", async () => {
      auction.setAuction(auctionModel);
      auction_team.setAuctionTeam(auctionTeamModel);
      const req = {};

      res = {
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

      auctionModel.findAll = jest.fn().mockImplementation(() => {
        throw Error("There seems to be some issue. Sorry for inconvenience.")
      });
      const response = await auctionTeamController.getTeamRequestForAuctionController(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    })
  })
});

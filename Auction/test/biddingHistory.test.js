const bidding = require("../services/biddingService");
let biddingModel = require("../models/biddingHistoryModel");
let biddingController= require("../controllers/biddingController");
const { response } = require("express");
const axios = require("axios");

describe("addBiddingHistory", () => {
    it("should add bidding History successfully", async () => {
      bidding.setBiddingHistory(biddingModel);
      const body = {
        auction_id:1,
        team_id:2,
        player_id:1,
        current_bid:1000000
    }
      const responseBody = {
        bh_bid_id: 1,
        bh_auction_id: 1,
        bh_team_id: 2,
        bh_player_id: 1,
        bh_current_bid: 1000000,
        updatedAt: "2023-12-18T19:29:37.558Z",
        createdAt: "2023-12-18T19:29:37.558Z"
    }

      const req = {
        body: body,
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
      biddingModel.create = jest.fn().mockImplementation(() => {
        return responseBody;
      });

      const response = await biddingController.addBiddingHistory(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(responseBody);
    });

    it("should handle errors and return a proper response for add Auction", async () => {
      bidding.setBiddingHistory(biddingModel);
      const body = {
        auction_id:1,
        team_id:2,
        player_id:1,
        current_bid:1000000
    }

     const req = {
        body: body,
      };

      res = {
        send: function (error) {
          this.body = error;
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
      biddingModel.create = jest.fn().mockImplementation(() => {
        throw new Error("There seems to be some issue.Sorry for inconvenience.");
      });
      const response = await biddingController.addBiddingHistory(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue.Sorry for inconvenience.");
    });
  });

    describe("get bid list", () => {
      it("should get list of bids successfully", async () => {
        bidding.setBiddingHistory(biddingModel);
     
        const responseBody = [{
         dataValues: {
              "bh_current_bid": 1000,
              "bh_team_id": 1
          }
       }]
     
        const req = {
          params: {
            auction_id: 1,
            player_id: 1
          }
        };

       const internalResponse = { data: [
          { t_id: 1, t_name: 'CSK', t_logo: '' }
        ]
      }

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
        biddingModel.findAll = jest.fn().mockImplementation(() => {
          return responseBody;
        });
        jest.mock("axios");
        axios.post = jest.fn().mockResolvedValue(internalResponse);
        const response = await biddingController.getLatestBidList(req, res);
        console.log("respo    ", response);
        expect(response.statusCode).toBe(200);
        expect(response.body.bh_current_bid).toBe(responseBody.currentBid);
      });

    it("should return 404 while fetching latest bid", async () => {
      bidding.setBiddingHistory(biddingModel);
   
      const req = {
        params: {
          auction_id: 1,
          player_id: 1
        }
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
      biddingModel.findAll = jest.fn().mockImplementation(() => {
        return [];
      });
      const response = await biddingController.getLatestBidList(req, res);
      console.log("respo    ", response);
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("No Bids Found");
    });

    it("should return 417 error while fetching latest bid", async () => {
      bidding.setBiddingHistory(biddingModel);
   
      const req = {
        params: {
          auction_id: 1,
          player_id: 1
        }
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
      biddingModel.findAll = jest.fn().mockImplementation(() => {
        throw Error ("There seems to be some issue.Sorry for inconvenience.")
      });
      const response = await biddingController.getLatestBidList(req, res);
      console.log("respo    ", response);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue.Sorry for inconvenience.");
    });
  });
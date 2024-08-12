const transaction = require("../services/transactionService");
let transactionModel = require("../models/transactionHistoryModel");
const transactionHistoryController = require("../controllers/transactionController");

describe("addTransactionHistory", () => {
    it("should add transaction History successfully", async () => {
      transaction.setTransactionHistory(transactionModel);
      const body = {
        auction_id:1,
        team_id:2,
        player_id:1,
        final_price:1000000,
        initial_purse_value:1000000,
        final_purse_value:1000000
    }
      const responseBody = {
        th_transaction_id: 2,
        th_auction_id: 1,
        th_team_id: 2,
        th_player_id: 1,
        th_final_price: 1000000,
        th_initial_purse_value: 1000000,
        th_final_purse_value: 1000000,
        updatedAt: "2023-12-18T19:43:00.456Z",
        createdAt: "2023-12-18T19:43:00.456Z"
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
      transactionModel.create = jest.fn().mockImplementation(() => {
        return responseBody;
      });

      const response = await transactionHistoryController.addTransactionHistory(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(true);
    });

    it("should handle errors and return a proper response for add Auction", async () => {
      transaction.setTransactionHistory(transactionModel);
      const body = {
        auction_id:1,
        team_id:2,
        player_id:1,
        final_price:1000000,
        initial_purse_value:1000000,
        final_purse_value:1000000
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
      transactionModel.create = jest.fn().mockImplementation(() => {
        throw new Error("There seems to be some issue.Sorry for inconvenience.");
      });
      const response = await transactionHistoryController.addTransactionHistory(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue.Sorry for inconvenience.");
    });
});
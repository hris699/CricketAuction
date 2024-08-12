const auction = require("../services/auctionService");
let auctionModel = require("../models/auctionModel");
const auctionPlayer = require("../services/auctionPlayerService");
let auctionPlayerModel = require("../models/auctionPlayerModel");
const auctionController = require("../controllers/auctionController");
const auctionTeamModel= require('../models/auctionTeamModel');
const auctionTeamService= require('../services/auctionTeamService');
const util = require("../common-function/util");
const AWS = require("aws-sdk");
const axios = require("axios");
describe("auction controller", () => {
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
  describe("get list of auctions", () => {
    it("should get all auction successfully", async () => {
      auction.setAuction(auctionModel);
      const auctions = [
        {
          auction_id: 1,
          auction_name: "Test a1auction",
          auction_description: "Test a1auction description",
          auction_country:"India",
          auction_image:"qwertyuiozxcv",
          start_time: "2023-11-31T13:00:00.000Z",
          end_time: "2023-12-31T13:00:00.000Z",
          purse_value: 1000,
          no_of_teams: 10,
          min_team_size: 12,
          max_team_size: 15,
          is_deleted: 0,
          created_by: "Sunil",
          createdAt: "2023-11-06T07:36:38.000Z",
          updatedAt: "2023-11-06T07:36:38.000Z",
        },
        {
          auction_id: 2,
          auction_name: "Test a2auction",
          auction_description: "Test a2auction description",
          auction_country:"India",
          auction_image:"qwertyuiozxcv",
          start_time: "2023-11-31T13:00:00.000Z",
          end_time: "2023-12-31T13:00:00.000Z",
          purse_value: 1000,
          no_of_teams: 10,
          min_team_size: 12,
          max_team_size: 15,
          is_deleted: 0,
          created_by: "Sunil",
          createdAt: "2023-11-06T07:36:38.000Z",
          updatedAt: "2023-11-06T07:36:38.000Z",
        },
      ];
      const req = {
        body: {
          auction: auctions,
        },
      };
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
      auctionModel.findAll = jest.fn().mockImplementation(() => {
        return auctions;
      });
      const response = await auctionController.getAllAuctionsController(req, res);
      console.log("response", response);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(auctions);
    });

    it("should handle errors and return a proper response for findAll", async () => {
      auction.setAuction(auctionModel);
      const req = {};
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
      auctionModel.findAll = jest.fn().mockImplementation(() => {
        throw new Error("There seems to be some issue. Sorry for inconvenience.");
      });
      const response = await auctionController.getAllAuctionsController(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    });
  });
  describe("addAuction", () => {
    it("should add an auction successfully", async () => {
      auction.setAuction(auctionModel);
      const auctionBody = {
        auction_name: "Test a1 auction",
        auction_description: "Test a1auction description",
        auction_country:"India",
        auction_image:"string",
        start_time: "2023-11-31T13:00:00.000Z",
        end_time: "2023-12-31T13:00:00.000Z",
        purse_value: 1000,
        no_of_teams: 10,
        min_team_size: 12,
        max_team_size: 15,
        is_deleted: 0,
        created_by: "Sunil",
      };
      const responseBody = {
        auction_id: 1,
        auction_name: "Test a1 auction",
        auction_description: "Test a1auction description",
        auction_country:"India",
        auction_image:"string",
        start_time: "2023-11-31T13:00:00.000Z",
        end_time: "2023-12-31T13:00:00.000Z",
        purse_value: 1000,
        no_of_teams: 10,
        min_team_size: 14,
        max_team_size: 15,
        is_deleted: 0,
        created_by: "Sunil",
        createdAt: "2023-11-06T07:36:38.000Z",
        updatedAt: "2023-11-06T07:36:38.000Z",
      };

      const req = {
        body: auctionBody,
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
      auctionModel.create = jest.fn().mockImplementation(() => {
        return responseBody;
      });

      const response = await auctionController.addAuctionController(req, res);
      //expect(AWS.S3.prototype.upload).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(200);
      expect(response.body.auction_name).toBe(auctionBody.auction_name);
    });

    it("should insert data into db without image", async () => {
      auction.setAuction(auctionModel);
      const auctionBody = {
        auction_name: "Test a1 auction",
        auction_description: "Test a1auction description",
        auction_country:"India",
        auction_image:null,
        start_time: "2023-11-31T13:00:00.000Z",
        purse_value: 1000,
        no_of_teams: 10,
        min_team_size: 11,
        max_team_size: 15,
        is_deleted: 0,
        created_by: "Sunil",
      };

      const responseBody = {
        auction_id: 1,
        auction_name: "Test a1 auction",
        auction_description: "Test a1auction description",
        auction_country:"India",
        auction_image:null,
        start_time: "2023-11-31T13:00:00.000Z",
        purse_value: 1000,
        no_of_teams: 10,
        min_team_size: 14,
        max_team_size: 15,
        is_deleted: 0,
        created_by: "Sunil",
        createdAt: "2023-11-06T07:36:38.000Z",
        updatedAt: "2023-11-06T07:36:38.000Z",
      };
      const req = {
        body: auctionBody
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
      auctionModel.create = jest.fn().mockImplementation(() => {
        return responseBody;
      });

      const response = await auctionController.addAuctionController(req, res);
      console.log("response", response);
      //expect(AWS.S3.prototype.upload).not.toHaveBeenCalledTimes();
      expect(response.statusCode).toBe(200);
      expect(response.body.auction_name).toBe(auctionBody.auction_name);
    });

    it("should handle errors and return a proper response for add Auction", async () => {
      auction.setAuction(auctionModel);
      const auctionBody = {
        auction_name: "Test a1 auction",
        auction_description: "Test a1auction description",
        auction_country:"India",
        auction_image:"qwertyuiozxcv",
        start_time: "2023-11-31T13:00:00.000Z",
        end_time: "2023-12-31T13:00:00.000Z",
        purse_value: 1000,
        no_of_teams: 10,
        min_team_size: 12,
        max_team_size: 15,
        is_deleted: 0,
        created_by: "Sunil",
      };
      const req = {
        body: {
          auction: auctionBody,
        },
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
      auctionModel.create = jest.fn().mockImplementation(() => {
        throw new Error("There seems to be some issue. Sorry for inconvenience.");
      });
      const response = await auctionController.addAuctionController(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    });

    it("should handle errors when min_team_size is greater then max_team_size for addAuction", async () => {
      auction.setAuction(auctionModel);
      const auctionBody = {
        auction_name: "Test a1 auction",
        auction_description: "Test a1auction description",
        auction_country:"India",
        auction_image:"qwertyuiozxcv",
        start_time: "2023-11-31T13:00:00.000Z",
        end_time: "2023-12-31T13:00:00.000Z",
        purse_value: 1000,
        no_of_teams: 10,
        min_team_size: 15,
        max_team_size: 12,
        is_deleted: 0,
        created_by: "Sunil",
      };
      const req = {
        body: auctionBody,
      };
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
      auctionModel.create = jest.fn().mockImplementation(() => {
        return responseBody;
      });

      const response = await auctionController.addAuctionController(req, res);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Minimum team size cannot be greater than max team size");
    });    
  });
  describe("update Auction", () => {
    it("should update auction successfully", async () => {
      auction.setAuction(auctionModel);
      auctionTeamService.setAuctionTeam(auctionTeamModel);
 
      const auctionBody = {
        auction_name: "Test a1 auction",
        start_time: "2024-11-31T13:00:00.000Z",
        end_time: "2024-12-31T13:00:00.000Z",
        purse_value: 1000,
        no_of_teams: 10,
        min_team_size: 12,
        max_team_size: 15,
        is_deleted: 0,
        created_by: "Sunil",
        auction_description: "cricket",
        auction_country: "india"
      };
 
      const responseBody = {
        message: "Updated Successfully",
      };
 
      const req = {
        params: { auction_id: 1 },
        body: {
          auction: auctionBody,
        },
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
 
      auctionTeamModel.findAll = jest.fn().mockImplementation(() => {
        return [1];
      })
      auctionTeamService.getTeamsUserIds = jest.fn().mockImplementation(() => {
        return [];
      })
      util.getUserDetails = jest.fn().mockImplementation(() => {
        return [name = "dharmesh", email = "dharmesh.rane@gamil.com", phone = "7389874753"];
      })
      util.sendNotification = jest.fn().mockImplementation(() => {
        return [];
      })
      auctionModel.update = jest.fn().mockImplementation(() => {
        return responseBody;
      });
      auctionModel.findOne = jest.fn().mockImplementation(() => {
        return auctionBody;
      })
      const response = await auctionController.updateAuctionController(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(responseBody.message);
    });

    it("should handle errors and return a proper response for update Auction", async () => {
      auction.setAuction(auctionModel);
      const req = {
        params: { auction_id: 1 },
        body: {},
      };
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
      auctionModel.update = jest.fn().mockImplementation(() => {
        throw new Error("There seems to be some issue. Sorry for inconvenience.");
      });
      const response = await auctionController.updateAuctionController(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    });

    it("should handle errors when min_team_size is greater then max_team_size for updateAuction", async () => {
      auction.setAuction(auctionModel);
      const auctionBody = {
        auction_name: "Test a1 auction is now a2 auction",
        start_time: "2024-11-31T13:00:00.000Z",
        end_time: "2024-12-31T13:00:00.000Z",
        purse_value: 1000,
        no_of_teams: 10,
        min_team_size: 15,
        max_team_size: 12,
        is_deleted: 0,
        created_by: "Sunil",
      };
      const req = {
        params: { auction_id: 1 },
        body: auctionBody,
      };
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
      auctionModel.update = jest.fn().mockImplementation(() => {
        return responseBody;
      });

      const response = await auctionController.updateAuctionController(req, res);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Minimum team size cannot be greater than max team size");
    });
  });
});

describe("Testing Auction API - Soft Delete an Auction By ID", () => {
  it("should delete auction successfully", async () => {
    auction.setAuction(auctionModel);
    const auctions = [
      {
        auction_name: "Test auction",
        start_time: "2024-11-31T13:00:00.000Z",
        end_time: "2024-12-31T13:00:00.000Z",
        purse_value: 100000,
        no_of_teams: 8,
        min_team_size: 11,
        max_team_size: 16,
        is_deleted: 0,
        created_by: "Avni",
      },
    ];

    const req = {
      params: {
        auction_id: 1,
      },
      body: {
        auction: auctions,
      },
      data: {
        a_is_deleted: 1,
      },
    };

    const responseBody = {
      message: "Auction deleted Successfully",
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
    auctionModel.update = jest.fn().mockImplementation(() => {
      return [1];
    });
    const response = await auctionController.deleteAuctionController(req, res);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("Auction deleted Successfully");
  });

  it("should return 404 while deleting Auction", async () => {
    auction.setAuction(auctionModel);
    const auctions = [
      {
        auction_name: "Test auction",
        start_time: "2024-11-31T13:00:00.000Z",
        end_time: "2024-12-31T13:00:00.000Z",
        purse_value: 100000,
        no_of_teams: 10,
        min_team_size: 11,
        max_team_size: 16,
        is_deleted: 0,
        created_by: "Avni",
      },
    ];

    const req = {
      params: {
        auction_id: 100,
      },
      body: {
        auction: auctions,
      },
      data: {
        a_is_deleted: 1,
      },
    };

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
    auctionModel.update = jest.fn().mockImplementation(() => {
      return [0];
    });
    const response = await auctionController.deleteAuctionController(req, res);
    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Auction not found or already deleted");
  });

  it("should return 500 while deleting Auction", async () => {
    auction.setAuction(auctionModel);
    const auctions = [
      {
        auction_name: "Test auction",
        start_time: "2024-11-31T13:00:00.000Z",
        end_time: "2024-12-31T13:00:00.000Z",
        purse_value: 100000,
        no_of_teams: 8,
        min_team_size: 11,
        max_team_size: 16,
        is_deleted: 0,
        created_by: "Avni",
      },
    ];

    const req = {
      params: {
        auction_id: 1,
      },
      body: {
        auction: auctions,
      },
      data: {
        a_is_deleted: 1,
      },
    };

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
    auctionModel.update = jest.fn().mockImplementation(() => {
      new Error("There seems to be some issue. Sorry for inconvenience.");
    });
    const response = await auctionController.deleteAuctionController(req, res);
    expect(response.statusCode).toBe(417);
    expect(response.body.error).toBe(
      "There seems to be some issue. Sorry for inconvenience."
    );
  });
});

describe("get auction details", () => {
  it("should get auction details successfully", async () => {
    auction.setAuction(auctionModel);
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    const auctions = [{
        a_id: 1,
        a_name: "IPL",
        a_start_time: null,
        a_end_time: null,
        a_purse_value: 1000000,
        a_no_of_teams: 2,
        a_min_team_size: 8,
        a_max_team_size: 10,
        a_is_deleted: 0,
        a_created_by: "avni",
        createdAt: null,
        updatedAt: "2023-12-11T03:33:54.000Z",
   } ]

    const responseBody = {
        auctionDetail: {
          a_id: 1,
          a_name: "IPL",
          a_start_time: null,
          a_end_time: null,
          a_purse_value: 1000000,
          a_no_of_teams: 2,
          a_min_team_size: 8,
          a_max_team_size: 10,
          a_is_deleted: 0,
          a_created_by: "avni",
          createdAt: null,
          updatedAt: "2023-12-11T03:33:54.000Z",
        },
      };

    const req = {
      params: {
        auction_id: 1,
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
    auctionModel.findOne = jest.fn().mockImplementation(() => {
      return auctions;
    });
    const response = await auctionController.auctionDetailController(req, res);
    expect(response.statusCode).toBe(200);
    expect(response.body.a_name).toBe(responseBody.a_name);
  });

  it("should handle unexpected error for auction details", async () => {
    auction.setAuction(auctionModel);
    const req = {};
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
    auctionModel.findOne = jest.fn().mockImplementation(() => {
      throw new Error("There seems to be some issue. Sorry for inconvenience.");
    });
    const response = await auctionController.auctionDetailController(req, res);
    expect(response.statusCode).toBe(417);
    expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
  });
  
  it("should handle 404 error for auction details", async () => {
    auction.setAuction(auctionModel);
    const req = {
      params: {
        auction_id: 1,
      }
    };
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
    auctionModel.findOne = jest.fn().mockImplementation(() => {
      return null;
    });
    const response = await auctionController.auctionDetailController(req, res);
    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Provided auction does not exist or is deleted");
  });
});

describe("should return details for auction by id", () => {
  it("should return details for auction by id", async () => {
    auction.setAuction(auctionModel);
    const auctionStartTime = {
      dataValues: { a_start_time: "2023-12-20T13:00:00.000Z" },
    }
    const auctionId = 1;
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
    auctionModel.findOne = jest.fn().mockImplementation(() => {
      return auctionStartTime
    });
    const response = await auction.getAuctionById(auctionId);
    expect(response).toBe(auctionStartTime);
  });

  it("should handle unexpected error for getting auction by id", async () => {
    auction.setAuction(auctionModel);
    const auctionId = 1;
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
    auctionModel.findOne = jest.fn().mockImplementation(() => {
      return false;
    });
    const response = await auction.getAuctionById(auctionId);
    console.log("response", response);
    expect(response).toBe(false);
});
});
  
describe("get list of auction objects by auction ids", () => {
  it("should get all auction objects successfully", async () => {
    auction.setAuction(auctionModel);
    const taskIds = [1,2];
      const auctions = [
        {
          auction_name: "Test a1auction",
          start_time: "2023-11-31T13:00:00.000Z",
        },
        {
          auction_name: "Test a2auction",
          start_time: "2023-11-31T13:00:00.000Z",
        },
      ];
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
      auctionModel.findAll = jest.fn().mockImplementation(() => {
        return auctions;
      });
      const response = await auction.getAuctionByIds(taskIds);
      console.log(response)
      expect(response.length).toBe(auctions.length);
      expect(response.auction_name).toBe(auctions.auction_name);
      expect(response.start_time).toBe(auctions.start_time);
  })
});

describe("get ongoing auction details", () => {
  it("should get all ongoing auction successfully", async () => {
    auction.setAuction(auctionModel);
    
      const auctions = [
      {
          "a_id": 4,
          "a_name": "SFKJ",
          "a_start_time": "2024-01-23T00:00:00.000Z",
          "a_country": "India"
      }
  ]

     req={};
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
      auctionModel.findAll = jest.fn().mockImplementation(() => {
        return auctions;
      });
      const response = await auctionController.getOngoingAuctionsController(req,res);
      expect(response.statusCode).toBe(200);
      expect(response.body.a_name).toBe(auctions.auction_name);
      
  })
});

it("should return 404 when there is no ongoing auction", async () => {
  auction.setAuction(auctionModel);
    req={};
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
    auctionModel.findAll = jest.fn().mockImplementation(() => {
      return null;
    });
    const response = await auctionController.getOngoingAuctionsController(req,res);
    expect(response.statusCode).toBe(404);
    
})
it("should return 417 if internal server error occur", async () => {
  auction.setAuction(auctionModel);
    req={};
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
    auctionModel.findAll = jest.fn().mockImplementation(() => {
    throw new Error("There seems to be some issue. Sorry for inconvenience.")
    });
    const response = await auctionController.getOngoingAuctionsController(req,res);
    expect(response.statusCode).toBe(417);
    
})
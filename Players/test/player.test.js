const axios=require('axios')
const player = require("../Service/PlayerService");
const playerController = require("../Controller/PlayerController");
const playerModel = require("../models/players");
const AWS = require("aws-sdk");
describe("Player Test Cases", () => {
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
  describe("Testing Player API - List All Players", () => {
    it("should return the list of all the players", async () => {
      player.setPlayer(playerModel);
      const players = [
        {
          p_id: 1,
          p_name: "ajay redhu",
          p_email: "redhu@gmail.com",
          p_age: 25,
          p_image: "asdfghjklhfdsnzfghj",
          p_type: "all-rounder",
          p_contact: 8269896041,
          p_is_deleted: false,
        },
      ];

      const req = {
        body: {
          player: players,
        },
      };

      playerModel.findAll = jest.fn().mockImplementation(() => {
        return players;
      });
      const response = await playerController.listAllPlayers(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(players.length);
      expect(response.body[0].p_name).toBe(players[0].p_name);
    });

    it("should return 404 if no player exists while getting list of players", async () => {
      player.setPlayer(playerModel);
      const players = [];

      const req = {
        body: {
          player: players,
        },
      };

      playerModel.findAll = jest.fn().mockImplementation(() => {
        return players;
      });
      const response = await playerController.listAllPlayers(req, res);
      expect(response.statusCode).toBe(404);
    });

    it("should return 417 while getting list of players", async () => {
      player.setPlayer(playerModel);
      const players = [
        {
          p_id: 1,
          p_name: "ajay redhu",
          p_email: "redhu@gmail.com",
          p_age: 25,
          p_image: "asdfghjklhfdsnzfghj",
          p_type: "all-rounder",
          p_contact: 8269896041,
          p_is_deleted: false,
        },
      ];

      const req = {
        body: {
          player: players,
        },
      };

      playerModel.findAll = jest.fn().mockImplementation(() => {
        new Error("Internal Server Error")
      });
      const response = await playerController.listAllPlayers(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    });
  });
  describe("Testing Player API - Soft Delete A Player By ID", () => {
    it("should delete player successfully when player not associated with any auction", async () => {
      player.setPlayer(playerModel);
      const req={
        params:{
          player_id:1
        },
        query:{
          auction_id: []
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

      playerModel.update = jest.fn().mockImplementation(() => {
        return [1];
      });
      const response = await playerController.deletePlayer(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe("Player Deleted Successfully");
    });

    it("should delete player successfully when player associated with any auction", async () => {
      player.setPlayer(playerModel);
      const req={
        params:{
          player_id:1
        },
        query:{
          auction_id: [101]
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
      const internalResponse={data: true}
      jest.mock('axios')
      axios.delete = jest.fn().mockResolvedValue(internalResponse);

      playerModel.update = jest.fn().mockImplementation(() => {
        return [1];
      });
      const response = await playerController.deletePlayer(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe("Player Deleted Successfully");
    });

    it("should return 400 while deleting player if player not found or player already deleted", async () => {
      player.setPlayer(playerModel);
      const req={
        params:{
          player_id:1
        },
        query:{
          auction_id: [101]
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
      const internalResponse={data: false}
      jest.mock('axios')
      axios.delete = jest.fn().mockResolvedValue(internalResponse);

      playerModel.update = jest.fn().mockImplementation(() => {
        return false;
      });
      const response = await playerController.deletePlayer(req, res);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Unable to delete player");    
    });

    it("should return 403 error when auction date is greater while deleting player", async () => {
      player.setPlayer(playerModel);
      const req={
        params:{
          player_id:1
        },
        query:{
          auction_id: "[101]",
          start_time:"[2023-01-5 15:19:00]"
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
      const response = await playerController.deletePlayer(req, res);
      expect(response.statusCode).toBe(403);
      expect(response.body.error).toBe("Can't delete as auction start time is less than 24 hrs or the auction is ongoing.");
    });

    it("should return 417 error while deleting a player", async () => {
      player.setPlayer(playerModel);
      const req={
        params:{
          player_id:1
        },
        query:{
          auction_id: [],
          start_time:[]
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
      playerModel.update = jest.fn().mockImplementation(() => {
        throw Error("There seems to be some issue. Sorry for inconvenience.")
      });
      const response = await playerController.deletePlayer(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    });
  });

  describe("Testing Player API - Create A New Player", () => {
    it("should insert data into db without image", async () => {
      player.setPlayer(playerModel);
      const players =
      {
        "p_is_deleted": 0,
        "p_id": 5,
        "p_name": "shradha",
        "p_email": "shradha33@gmail.com",
        "p_type": "batsman",
        "p_age": 32,
        "p_contact": 1234077777,
        "p_image": null,
        "updated_at": "2023-12-05T17:31:09.278Z",
        "created_at": "2023-12-05T17:31:09.278Z"
      };

      const reqBody = {
        "player_age": 32,
        "player_contact": 1234077777,
        "player_email": "shradha33@gmail.com",
        "player_name": "shradha",
        "player_type": "batsman",
      };
      const req = {
        body: reqBody
      };
      playerModel.create = jest.fn().mockResolvedValue(() => {
        return { dataValues: players };
      });
      await playerController.createPlayer(req, res);
      expect(AWS.S3.prototype.upload).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    it("should insert data into db with image", async () => {

      player.setPlayer(playerModel);
      const players =
      {
        "p_is_deleted": 0,
        "p_id": 5,
        "p_name": "shradha",
        "p_email": "shradha33@gmail.com",
        "p_type": "batsman",
        "p_age": 32,
        "p_contact": 1234077777,
        "p_image": "string",
        "updated_at": "2023-12-05T17:31:09.278Z",
        "created_at": "2023-12-05T17:31:09.278Z"
      };

      const reqBody = {
        "player_age": 32,
        "player_contact": 1234077777,
        "player_email": "shradha33@gmail.com",
        "player_name": "shradha",
        "player_type": "batsman",
        "player_image": "string"
      };
      const req = {
        body: reqBody,
        file: {
          fieldname: 'player_image',
          originalname: 'cricket.jfif',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/Users/Yukta.Nagle/Desktop/UAS_Auction/UAS_UI_Updated/UAS_UI/src/public/images/players',
          filename: '1704829932583cricket.jfif',
          path: '\\Users\\Yukta.Nagle\\Desktop\\UAS_Auction\\UAS_UI_Updated\\UAS_UI\\src\\public\\images\\players\\1704829932583cricket.jfif',
          size: 5130
        }
      };
      playerModel.create = jest.fn().mockResolvedValue(() => {
        return { dataValues: players };
      });
      await playerController.createPlayer(req, res);
      expect(AWS.S3.prototype.upload).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
    });

    it("should not insert data into db", async () => {
      player.setPlayer(playerModel);

      const reqBody = {
        player_name: "",
        player_email: "",
        player_type: "",
        player_age: undefined,
        player_contact: undefined,
        player_image: null
      };

      const req = {
        body: reqBody
      };
      playerModel.create = jest.fn().mockReturnValueOnce(
        () => {
          return new Error("Wrong Input");
        });
      await playerController.createPlayer(req, res);
      expect(AWS.S3.prototype.upload).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toEqual("Wrong Input");
    });
  });
  describe("Testing Player API - Update An Existing Player Details", () => {

    it("should update player details successfully with no new image", async () => {
      player.setPlayer(playerModel);
      const req = {
        params: {
          player_id: 1
        },
        body: {
          "player_age": 32,
          "player_contact": 1234077777,
          "player_email": "shradha33@gmail.com",
          "player_name": "shradha",
          "player_type": "batsman",
          "player_image": "https://image-bucket-for-ecs.s3.us-east-2.amazonaws.com/someimagename.png"
        },
      };
      playerModel.findOne = jest.fn().mockReturnValueOnce({
        p_is_deleted: 0,
        p_id: 5,
        p_name: "shradha",
        p_email: "shradha33@gmail.com",
        p_type: "batsman",
        p_age: 32,
        p_contact: 1234077777,
        p_image: "https://image-bucket-for-ecs.s3.us-east-2.amazonaws.com/someimagename.png",
        updated_at: "2023-12-05T17:31:09.278Z",
        created_at: "2023-12-05T17:31:09.278Z"
      });
      playerModel.update = jest.fn().mockReturnValueOnce([1]);
      await playerController.updatePlayer(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body[0]).toEqual(1);
    });

    it("should update player details successfully with new image", async () => {
      player.setPlayer(playerModel);
      const req = {
        params: {
          player_id: 1
        },
        body: {
          "player_age": 32,
          "player_contact": 1234077777,
          "player_email": "shradha33@gmail.com",
          "player_name": "shradha",
          "player_type": "batsman",
          "player_image": "image data for new image"
        },
        file: {
          fieldname: 'player_image',
          originalname: 'cricket.jfif',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/Users/Yukta.Nagle/Desktop/UAS_Auction/UAS_UI_Updated/UAS_UI/src/public/images/players',
          filename: '1704785445025cricket.jfif',
          path: '\\Users\\Yukta.Nagle\\Desktop\\UAS_Auction\\UAS_UI_Updated\\UAS_UI\\src\\public\\images\\players\\1704785445025cricket.jfif',
          size: 5130
        }
      };
      playerModel.findOne = jest.fn().mockReturnValueOnce({
        p_is_deleted: 0,
        p_id: 5,
        p_name: "shradha",
        p_email: "shradha33@gmail.com",
        p_type: "batsman",
        p_age: 32,
        p_contact: 1234077777,
        p_image: "https://image-bucket-for-ecs.s3.us-east-2.amazonaws.com/somenewimagename.png",
        updated_at: "2023-12-05T17:31:09.278Z",
        created_at: "2023-12-05T17:31:09.278Z"
      });

      playerModel.update = jest.fn().mockReturnValueOnce([1]);
      await playerController.updatePlayer(req, res);
      expect(AWS.S3.prototype.upload).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
      expect(res.body[0]).toEqual(1);
    });
    it("should return 404 if player ID is doesn't exists while updating player details", async () => {

      const req = {
        params: {
          player_id: 3,
        },
        body: {
          player_age: 32,
          player_contact: 1234077777,
          player_email: "shradha33@gmail.com",
          player_name: "shradha",
          player_type: "batsman",
          player_image: "https://image-bucket-for-ecs.s3.us-east-2.amazonaws.com/someimagename.png"
        },
      };

      playerModel.findOne = jest.fn().mockReturnValueOnce([0]);
      await playerController.updatePlayer(req, res);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toEqual("Player is already deleted or doesn't exists");
    });

    it("should not update data into db", async () => {
      player.setPlayer(playerModel);

      const req = {
        params: {
          player_id: 1,
        },
        body: {
          player_age: undefined,
          player_contact: undefined,
          player_email: "",
          player_name: "",
          player_type: "",
          player_image: null
        },
      };
      playerModel.update = jest.fn().mockReturnValueOnce(
        () => {
          return new Error("Wrong Input");
        });
      playerModel.findOne = jest.fn().mockReturnValueOnce([1]);
      await playerController.updatePlayer(req, res);
      expect(AWS.S3.prototype.upload).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toEqual("Wrong Input");
    });
  });

  describe("List all players detail based on ids", () => {
    it("should return the list of players", async () => {
      player.setPlayer(playerModel);
      const players = [
        {
          p_id: 1,
          p_name: "Rohit",
          p_email: "abc@gmail.com",
          p_age: 35,
          p_image: "asdfghjklhfdsnzfghj",
          p_type: "batsman",
          p_contact: 8269896041
        },
        {
          p_id: 2,
          p_name: "Shami",
          p_email: "adhc@gmail.com",
          p_age: 32,
          p_image: "asdfghjkffdsnzfghj",
          p_type: "bowler",
          p_contact: 8267596041
        },
      ];

      const req = {
        body: {
          player_id: [1, 2]
        }
      };

      playerModel.findAll = jest.fn().mockImplementation(() => {
        return players;
      });
      const response = await playerController.getPlayerByIds(req, res);
      expect(response.statusCode).toBe(200);
    });

    it("should return 417 while getting list of players", async () => {
      player.setPlayer(playerModel);

      const req = {
        body: {
          player_id: [1, 2],
        },
      };

      playerModel.findAll = jest.fn().mockImplementation(() => {
        throw new Error("There seems to be some issue. Sorry for inconvenience.")
      });
      const response = await playerController.getPlayerByIds(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    });
  });

  describe("Test cases for listing player_auction association",()=>{
    it("should return list of auction_player association successfully",async ()=>{
      player.setPlayer(playerModel);

      const req={
        params:{
          player_id: 1
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
      const playersDetail=[{
        dataValues: {
        p_id: 4,
        p_name: 'Hardik Pandya',
        p_email: 'pondya@gmail.com',
        p_age: 32,
        p_contact: +916734239354,
        p_image: '',
        p_type: 'allRounder',
        p_is_deleted: 0,
        created_at: "2024-01-09T13:18:34.000Z",
        updated_at: "2024-01-09T13:18:34.000Z"
      }
    }]
      const internalResponse={
        data: [
        {
            "auctionId": 1,
            "auctionName": "IPL",
            "auctionStartTime": "2024-02-02T13:00:00.000Z"
        }
    ]}
      jest.mock('axios')
      axios.get = jest.fn().mockResolvedValue(internalResponse);

      playerModel.findAll=jest.fn().mockImplementation(()=>{
        return playersDetail;
      })
      const response= await playerController.getPlayerAssociation(req,res)
      console.log("response",response);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(internalResponse.data);
    })

    it("should return 400 error while trying to get list of auction_player association successfully",async ()=>{
      player.setPlayer(playerModel);

      const req={
        params:{
          player_id: 1
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
      const playersDetail=null;
      playerModel.findAll=jest.fn().mockImplementation(()=>{
        return playersDetail;
      })
      const response= await playerController.getPlayerAssociation(req,res)
      console.log("response",response);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("No Player found");
    })
    it("should return 417 error while trying to get list of auction_player association successfully",async ()=>{
      player.setPlayer(playerModel);
  
      const req={
        params:{
          player_id: 1
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
      const playersDetail=null;
      playerModel.findAll=jest.fn().mockImplementation(()=>{
        throw Error("There seems to be some issue. Sorry for inconvenience.")
      })
      const response= await playerController.getPlayerAssociation(req,res)
      console.log("response",response);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    })
  })
});
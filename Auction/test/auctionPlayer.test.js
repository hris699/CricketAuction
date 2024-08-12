const axios = require("axios");
const auctionPlayer = require("../services/auctionPlayerService");
const auctionTeam = require("../services/auctionTeamService");
const auctionPlayerModel = require("../models/auctionPlayerModel");
const auctionTeamModel = require("../models/auctionTeamModel");
const auctionModel = require("../models/auctionModel");
const auction = require("../services/auctionService");
const auctionPlayerController = require('../controllers/auctionPlayerController')

describe("auction player controller", () => {
  describe("addAuctionPlayer", () => {
    it("should add an player in auction successfully", async () => {
      auctionPlayer.setAuctionPlayer(auctionPlayerModel);
      const auctionPlayerBody = {
        player_id: 101,
        team_id: 201,
        sold_status: "Unsold",
        base_value: 400000,
        sold_value: 2000,
      };
      const responseBody = {
        a_id: 1,
        player_id: 101,
        team_id: 201,
        sold_status: "Unsold",
        base_value: 400000,
        sold_value: 2000,
        createdAt: "2023-12-05T02:12:55.509Z",
        updatedAt: "2023-12-05T02:12:55.509Z",
      };
 
      const req = {
        params: { auction_id: 1 },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'MockToken',
 
        },
 
        body: auctionPlayerBody,
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
      auctionPlayerModel.create = jest.fn().mockImplementation(() => {
        return responseBody;
      });
      axios.post = jest.fn().mockImplementation(() => {
        return { data: [] };
      })
 
      const response = await auctionPlayerController.addAuctionPlayerController(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body.a_id).toBe(1);
    });

    it("should handle errors and return a proper response for add player in Auction", async () => {
      auctionPlayer.setAuctionPlayer(auctionPlayerModel);
      const auctionPlayerBody = {
        player_id: 101,
        team_id: 201,
        sold_status: "Unsold",
        base_value: 400000,
        sold_value: 2000,
      };
      const req = {
        params: { auction_id: 1 },
        body: {
          auction: auctionPlayerBody,
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
      auctionPlayerModel.create = jest.fn().mockImplementation(() => {
        throw new Error("There seems to be some issue. Sorry for inconvenience.");
      });
      const response = await auctionPlayerController.addAuctionPlayerController(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    });
  });

  describe("Remove player from auction based on start time", () => {
    it("should delete an player from auction successfully", async () => {
      auctionPlayer.setAuctionPlayer(auctionPlayerModel);
      auction.setAuction(auctionModel);
      const auctionStartTime = {
        dataValues: {
          a_start_time: "9028-12-20T16:00:00.000Z",
        },
      };
      const req = {
        params: {
          auction_id: 1,
          player_id: 101,
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
      auctionPlayerModel.destroy = jest.fn().mockImplementation(() => {
        return 1;
      });

      auctionModel.findOne = jest.fn().mockImplementation(() => {
        return auctionStartTime;
      });
      const response = await auctionPlayerController.deleteAuctionPlayerController(req, res);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe("Player Deleted Successfully");
    });

    it("should return 404 error while deleting an player from auction", async () => {
      auctionPlayer.setAuctionPlayer(auctionPlayerModel);
      auction.setAuction(auctionModel);
      const auctionStartTime = {
        dataValues: {
          a_start_time: "9028-12-20T16:00:00.000Z"
        },
      };

      const req = {
        params: {
          auction_id: 1,
          player_id: 101,
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
      auctionPlayerModel.destroy = jest.fn().mockImplementation(() => {
        return 0;
      });
      auctionModel.findOne = jest.fn().mockImplementation(() => {
        return auctionStartTime;
      });
      const response = await auctionPlayerController.deleteAuctionPlayerController(req, res);
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("Player not found in this auction or already deleted");
    });

    it("should return 417 error while deleting an player from auction", async () => {
      auctionPlayer.setAuctionPlayer(auctionPlayerModel);
      const req = {
        params: {
          auction_id: 1,
          player_id: 101,
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
      auctionPlayerModel.destroy = jest.fn().mockImplementation(() => {
        throw new Error("There seems to be some issue. Sorry for inconvenience.");
      });
      const response = await auctionPlayerController.deleteAuctionPlayerController(req, res);
      expect(response.statusCode).toBe(417);
      expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
    });

    it("should return 404 error if auction not found for deleting a player from auction", async () => {
      auction.setAuction(auctionModel);
      const req = {
        params: {
          auction_id: 1,
          player_id: 101,
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
      auctionModel.findOne = jest.fn().mockImplementation(() => {
        return false;
      });
      const response = await auctionPlayerController.deleteAuctionPlayerController(req, res);
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("Auction Not Found");
    });

    it("should return 404 error if player not found or already deleted while deleting an player from auction", async () => {
      auctionPlayer.setAuctionPlayer(auctionPlayerModel);
      auction.setAuction(auctionModel);
      const auctionStartTime = {
        dataValues: {
          a_start_time: "2023-12-12T16:00:00.000Z",
        },
      };
      const req = {
        params: {
          auction_id: 1,
          player_id: 101,
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
      auctionModel.findOne = jest.fn().mockImplementation(() => {
        return auctionStartTime;
      });
      const response = await auctionPlayerController.deleteAuctionPlayerController(req, res);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Cannot remove player from the auction as the auction is about to start in 24 hours or already completed");
    });
  });

describe("update players sold status in auction player table", () => {
  it("should update the player sold status and team id successfully in auction player table", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    const playerSoldDetails = {
      auction_id: 1,
      player_id: 101,
      team_id: 10,
      player_sold_value: 9008765,
    };

    auctionPlayerModel.update = jest.fn().mockImplementation(() => {
      return [1];
    });
    const response = await auctionPlayer.updatePlayerSoldStatus(playerSoldDetails);
    expect(response).toBe("Player sold status updated successfully");
  });

  it("should handle error for update the player sold status and team id successfully in auction player table", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    const playerSoldDetails = {
      auction_id: 1,
      player_id: 101,
      team_id: 10,
      player_sold_value: 9008765,
    };

    auctionPlayerModel.update = jest.fn().mockImplementation(() => {
      throw new Error("There seems to be some issue.Sorry for inconvenience.");
    });
    const response = await auctionPlayer.updatePlayerSoldStatus(playerSoldDetails);
    expect(response).toBe("There seems to be some issue.Sorry for inconvenience.");
  });

  it("should handle error if already updated the player sold status and team id successfully in auction player table", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    const playerSoldDetails = {
      auction_id: 1,
      player_id: 101,
      team_id: 10,
      player_sold_value: 9008765,
    };

    auctionPlayerModel.update = jest.fn().mockImplementation(() => {
      return [0];
    });
    const response = await auctionPlayer.updatePlayerSoldStatus(playerSoldDetails);
    expect(response).toBe("Player not found or already updated");
  });
});

describe("get list of unsold players", () => {
  it("should successfully return list of unsold players", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    const data = [
      {
        dataValues: { ap_player_id: 1 },
      },
    ];

    const internalResponse = {
      data: [
        {
          p_id: 1,
          p_name: "Rohit ",
          p_email: "abc@gmail.com",
          p_age: 35,
          p_type: "batsman",
          p_image: null,
          p_contact: 9987678765,
        },
      ],
    };

    const responseBody = {
      batsman: [
        {
          p_id: 1,
          p_name: "Rohit ",
          p_email: "abc@gmail.com",
          p_age: 35,
          p_type: "batsman",
          p_image: null,
          p_contact: 9987678765,
        },
      ],
    };

    const req = {
      params: { auction_id: 1 },
      query: { sold_status: "sold" },
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
    axios.post = jest.fn().mockResolvedValue(internalResponse);
    auctionPlayerModel.findAll = jest.fn().mockImplementation(() => {
      return data;
    });
    const response = await auctionPlayerController.getSoldUnsoldPlayersController(req, res);
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual(responseBody);
  });

  it("should handle unexpected error for getting list of player details", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
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
    auctionPlayerModel.findAll = jest.fn().mockImplementation(() => {
      throw new Error("There seems to be some issue. Sorry for inconvenience.");
    });
    const response = await auctionPlayerController.getSoldUnsoldPlayersController(req, res);
    expect(response.statusCode).toBe(417);
    expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
  });
});

describe("get player detail in an auction", () => {
  it("should successfully return detail list of players in an auction", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    const data = [
      { ap_player_id: 1 },
    ];

    const responseBody = {
      data: [
        {
          p_id: 1,
          p_name: "Rohit ",
          p_email: "abc@gmail.com",
          p_age: 35,
          p_type: "batsman",
          p_image: null,
          p_contact: 9987678765,
        },
      ],
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
    auctionPlayerModel.findAll = jest.fn().mockImplementation(() => {
      return data;
    });
    const response = await auctionPlayerController.getPlayersInAuctionController(req,res);
    console.log("response", response);
    expect(response.statusCode).toBe(200);
    expect(response.body.p_name).toBe(responseBody.data.p_name);
  });

  it("should return 400 when no association found between player and auction", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    const data = [];

    const responseBody = {
      data: [
        {
          p_id: 1,
          p_name: "Rohit ",
          p_email: "abc@gmail.com",
          p_age: 35,
          p_type: "batsman",
          p_image: null,
          p_contact: 9987678765,
        },
      ],
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
    auctionPlayerModel.findAll = jest.fn().mockImplementation(() => {
      return data;
    });
    const response = await auctionPlayerController.getPlayersInAuctionController(req,res);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("No player associated with this auction");
  });

  it("should return 417 while fetching player details from auction player", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    const data = [
      { ap_player_id: 1 },
    ];

    const responseBody = {
      data: [
        {
          p_id: 1,
          p_name: "Rohit ",
          p_email: "abc@gmail.com",
          p_age: 35,
          p_type: "batsman",
          p_image: null,
          p_contact: 9987678765,
        },
      ],
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
    auctionPlayerModel.findAll = jest.fn().mockImplementation(() => {
      throw Error("There seems to be some issue. Sorry for inconvenience.");
    });
    const response = await auctionPlayerController.getPlayersInAuctionController(req, res);
    expect(response.statusCode).toBe(417);
    expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
  });
});

describe("Test cases to provide details of player_auction association", () => {
  it("should return auctionPlayer association successfully", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    auction.setAuction(auctionModel);
    const req = {
      params: { player_id: 1 }
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
    const playerAuctionDetails = [{ dataValues: { ap_auction_id: 1 } }]

    const auctionDetails = [{
      dataValues: {
        a_id: 1,
        a_name: 'IPL',
        a_start_time: '2024-02-02T13:00:00.000Z'
      }
    }
    ]
    const responseBody = {
      data: [
        {
          auctionId: 1,
          auctionName: 'IPL',
          auctionStartTime: '2024-02-02T13:00:00.000Z'
        }
      ]
    }

    auctionPlayerModel.findAll = jest.fn().mockImplementation(() => {
      return playerAuctionDetails;
    })
    auctionModel.findAll = jest.fn().mockImplementation(() => {
      return auctionDetails;
    })
    const response = await auctionPlayerController.getPlayerStatusInAuctionController(req, res)
    console.log("response", response)
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual(responseBody.data);
  });

  it("should return 400 error when no auctionPlayer association found", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    auction.setAuction(auctionModel);
    const req = {
      params: { player_id: 1 }
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
    const playerAuctionDetails = [{ dataValues: { ap_auction_id: 1 } }]

    const auctionDetails = []
    const responseBody = { data: "Player not associated with auction" };

    auctionPlayerModel.findAll = jest.fn().mockImplementation(() => {
      return playerAuctionDetails;
    })
    auctionModel.findAll = jest.fn().mockImplementation(() => {
      return auctionDetails;
    })
    const response = await auctionPlayerController.getPlayerStatusInAuctionController(req, res)
    console.log("response", response)
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toStrictEqual(responseBody.data);
  })

  it("should return 417 error when accessing auctionPlayer association", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    auction.setAuction(auctionModel);
    const req = {
      params: { player_id: 1 }
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
    const auctionDetails = []

    auctionPlayerModel.findAll = jest.fn().mockImplementation(() => {
      throw Error("There seems to be some issue. Sorry for inconvenience.");
    })
    const response = await auctionPlayerController.getPlayerStatusInAuctionController(req, res)
    console.log("response", response)
    expect(response.statusCode).toBe(417);
    expect(response.body.error).toStrictEqual("There seems to be some issue. Sorry for inconvenience.");
  })
});

describe("Test cases for delete auction player association", () => {
  it("should delete an auctionPlayer association successfully", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    const req = {
      params: {
        player_id: 1
      },
      query: {
        auction_id: [1]
      }
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
    const deleteResponse = true;

    auctionPlayerModel.destroy = jest.fn().mockImplementation(() => {
      return deleteResponse;
    })
    const response = await auctionPlayerController.deleteAuctionPlayerAssociationController(req, res)
    console.log("response", response)

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(true);
  })

  it("should return 400 while unable to delete an auctionPlayer association successfully", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
    const req = {
      params: {
        player_id: 1
      },
      query: {
        auction_id: [1]
      }
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
    const deleteResponse = false;

    auctionPlayerModel.destroy = jest.fn().mockImplementation(() => {
      return deleteResponse;
    })
    const response = await auctionPlayerController.deleteAuctionPlayerAssociationController(req, res)
    console.log("response", response)

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Unable to delete");
  })

  it("should return 417 while trying to delete an auctionPlayer association", async () => {
    const req = {
      params: {
        player_id: 1
      },
      query: {
        auction_id: [1]
      }
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

    auctionPlayerModel.destroy = jest.fn().mockImplementation(() => {
      throw Error("There seems to be some issue. Sorry for inconvenience.");
    })
    const response = await auctionPlayerController.deleteAuctionPlayerAssociationController(req, res)
    console.log("response", response)

    expect(response.statusCode).toBe(417);
    expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
  });
});

describe("returns count of players in each team with team details according to auction id", () => {
  it.skip("return list of objects of teams", async () => {
    auctionPlayer.setAuctionPlayer(auctionPlayerModel);
          auctionTeam.setAuctionTeam(auctionTeamModel);
          auction.setAuction(auctionModel)
                const req = {
                  params: { at_team_id: 1 }
                }
                const responseTeamAuction = [
                  {
                    team_id: 1,
                    team_name: 'new3',
                    team_logo: null,
                    team_players: 1,
                    team_balance: 300000
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
                auctionTeam.getTeamsInAuction = jest.fn().mockImplementation(() => {
                    return [
                        { t_id: 1, t_name: 'new3', t_logo: null }
                      ]
                })
                auctionTeam.getTeamWalletBalanceForAuction = jest.fn().mockImplementation(() => {
                  return {
                    dataValues: { at_current_wallet_balance: 300000 },
                  }
              })
                auctionPlayerModel.count = jest.fn().mockImplementation(() => {
                  return 1;
                });
                
          
                const response = await auctionPlayerController.getPlayerCountTeamsDetailsController(req,res);
                console.log(response);
                expect(response.statusCode).toBe(200);
                expect(response.body.length).toBe(responseTeamAuction.length);
      })

      it("should return 417 for request", async () => {
        auctionPlayer.setAuctionPlayer(auctionPlayerModel);
              auctionTeam.setAuctionTeam(auctionTeamModel);
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
                    auctionTeam.getTeamsInAuction = jest.fn().mockImplementation(() => {
                        return [
                            { t_id: 1, t_name: 'new3', t_logo: null }
                          ]
                    })
                    auctionTeam.getTeamWalletBalanceForAuction = jest.fn().mockImplementation(() => {
                      throw Error("There seems to be some issue. Sorry for inconvenience.");
                  })
                    auctionPlayerModel.count = jest.fn().mockImplementation(() => {
                      return 1;
                    });
                    
              
                    const response = await auctionPlayerController.getPlayerCountTeamsDetailsController(req,res);
                    console.log(response);
                    expect(response.statusCode).toBe(417);
                    expect(response.body.error).toBe("There seems to be some issue. Sorry for inconvenience.");
          })
})
});
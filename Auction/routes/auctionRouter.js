const auctionController = require('../controllers/auctionController.js')
const auctionPlayerController = require('../controllers/auctionPlayerController.js')
const auctionTeamController = require('../controllers/auctionTeamController.js')
const auctionLinksController = require("../controllers/auctionLinksController.js")
const {updateRequest,validateUser,validateAccess,checkEndDateGreaterThenStartDate} = require('../common-function/util')
const router = require('express').Router()
const multer = require('multer')

//For local storage
let upload;
if (process.env.NODE_ENV == 'local') {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, process.env.AUCTION_LOCAL_STORAGE_PATH)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now()
      console.log("in multer ",file)
      cb(null, uniqueSuffix + file.originalname)
    }

  })
  upload = multer({ storage: storage })
}else{
  upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // limit file size to 5MB
    },
  });
}

router.get('/auctions/teams/teamRequests',validateUser, auctionTeamController.getTeamRequestForAuctionController)
router.post('/auctions',validateUser,validateAccess,updateRequest,checkEndDateGreaterThenStartDate,upload.single('auction_image'), auctionController.addAuctionController)
router.get('/auctions',validateUser,auctionController.getAllAuctionsController)
router.put('/auctions/:auction_id',validateUser,validateAccess,checkEndDateGreaterThenStartDate,upload.single('auction_image'), auctionController.updateAuctionController)
router.delete('/auctions/:auction_id/players/:player_id',validateUser,validateAccess,auctionPlayerController.deleteAuctionPlayerController)
router.delete('/auctions/:auction_id',validateUser,validateAccess, auctionController.deleteAuctionController);
router.post('/auctions/:auction_id/register',auctionTeamController.requestToRegisterForAuctionController)
router.get('/auctions/auction_detail/:auction_id',validateUser,auctionController.auctionDetailController)
router.put('/auctions/:auction_id/register/status',validateUser,validateAccess,auctionTeamController.approvalOrDenialOfRegisterForAuctionController)
router.get('/auctions/team/:team_id',validateUser,auctionTeamController.getAuctionByTeamIdController)
router.get('/auctions/:auction_id/players/status',auctionPlayerController.getSoldUnsoldPlayersController)
router.get('/auctions/player_detail/:auction_id',validateUser,validateAccess,auctionPlayerController.getPlayersInAuctionController)
router.get('/auctions/team_detail/:auction_id',validateUser,validateAccess,auctionTeamController.getTeamsInAuctionController)
router.get('/auctions/teams/:team_id',validateUser,validateAccess,auctionTeamController.getTeamStatusInAuctionController)
router.delete('/auctions/teams/:team_id',validateUser,validateAccess,auctionTeamController.deleteAuctionTeamController);
router.get('/auctions/:auction_id/users/:user_id/teams',validateUser,auctionTeamController.getTeamInAuctionByUserIdController)
router.get('/auctions/players/:player_id',validateUser,auctionPlayerController.getPlayerStatusInAuctionController)
router.get('/auctions/:auction_id/teams',auctionPlayerController.getPlayerCountTeamsDetailsController)
router.delete('/auctions/players/:player_id',validateUser,validateAccess,auctionPlayerController.deleteAuctionPlayerAssociationController);
router.get('/auctions/links',validateUser,auctionLinksController.getUserAllowedLinks);
router.post('/auctions/:auction_id/players',validateUser,auctionPlayerController.addSelectedPlayersInAuctionController);
router.get('/auctions/ongoingAuction',auctionController.getOngoingAuctionsController);
router.get('/auctions/auction/detail/:auction_id',auctionController.getAuctionDetailsByAuctionId);
router.get('/auctions/:auction_id/teams/:team_id/players',validateUser,validateAccess,auctionPlayerController.getPlayersinTeamController);
module.exports = router
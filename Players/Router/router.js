const express = require('express')
const router = express.Router();
const PlayerController = require('../Controller/PlayerController');
const playerLinksController = require("../Controller/playerLinksController.js")
const { validateUser,validateAccess } = require("../common-function/util")
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
      console.log("in multer ", file)
      cb(null, uniqueSuffix + file.originalname)
    }

  })
  upload = multer({ storage: storage })
} else {
  upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // limit file size to 5MB
    },
  });
}
router.get('/players', validateUser,PlayerController.listAllPlayers);
router.post('/players', validateUser,validateAccess,upload.single("player_image"), PlayerController.createPlayer);
router.put('/players/:player_id', validateUser,validateAccess, upload.single("player_image"), PlayerController.updatePlayer);
router.post('/players/details', PlayerController.getPlayerByIds);
router.get('/players/:player_id/auctions', validateUser, PlayerController.getPlayerAssociation);
router.delete('/players/:player_id/auctions', validateUser, validateAccess, PlayerController.deletePlayer );
router.get('/players/links',validateUser,playerLinksController.getUserAllowedLinks)

module.exports = router;
const express = require('express')
const router = express.Router();
const TeamController = require('../Controller/teamController');
const teamLinksController = require("../Controller/teamLinksController.js")
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

router.get('/teams',validateUser, TeamController.getAllTeams)
router.get('/teams/:team_id',validateUser,validateAccess, TeamController.getTeamById)
router.post('/teams', validateUser,validateAccess,upload.single("team_logo"),TeamController.addTeam)
router.put('/teams/:team_id',validateUser,validateAccess,upload.single("team_logo"), TeamController.updateTeam)
router.get('/teams/:team_id/auctions',validateUser,validateAccess, TeamController.getTeamAssociation);
router.delete('/teams/:team_id/auctions',validateUser,validateAccess, TeamController.deleteTeam );
router.post('/teams/details',TeamController.getTeamByIds);
router.get('/users/:user_id/teams',validateUser,validateAccess, TeamController.getTeamByUserId);
router.get('/teams/users/links',validateUser,teamLinksController.getUserAllowedLinks);

module.exports = router;
const express = require('express')
const app = express()
const router = require('./routes/auctionRouter.js')
const PORT = process.env.PORT || 8080
const dotenv = require('dotenv');
const path = require('path');
const cors = require("cors");
const cron = require("node-cron");
const { getTodaysAuction } = require("./services/auctionService");
const { getSecretString } = require('./common-function/util')
let timer = [];
console.log(path.resolve(__dirname, `${process.env.NODE_ENV}.env`))
dotenv.config({
  path: path.resolve(__dirname, `${process.env.NODE_ENV}.env`)
});
const OpenApiValidator = require('express-openapi-validator');
const apiSpec = path.join(__dirname, 'auctionSwagger.yaml');
const { swaggerServe, swaggerSetup } = require('./auctionSwaggerConfig')
let db = require('./config/dbConnect')
const ws = require('./websocket/websocket');
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(express.json());
const corsOptions = {
  origin: '*',
  credentials: true,            //access-control-allow-credentials:true
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions));

app.use('/spec', express.static(apiSpec));
app.use(
  OpenApiValidator.middleware({
    apiSpec,
    validateResponses: false,
    validateRequests: true,
    ignorePaths: (path) => path.includes("/api/auctions")
  }),
);

app.use("/swagger", swaggerServe, swaggerSetup);
app.use('/api', router)
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});
cron.schedule("*/5 * * * *", async function () {
  try {
    console.log("In Cron")
    //const secret = await getSecretString(process.env.SECRET_NAME)
    //process.env.CRON = secret.CRON;
    if (timer.length > 0) {
      timer.map(time => {
        clearTimeout(time);
      })
    }

    let auctions = await getTodaysAuction();
    console.log("Auctions ", auctions);
    if (auctions.length > 0) {
      auctions.map(auction => {
        if(auction.a_end_time==null){
        let auctionTime = auction.a_start_time;
        const total = new Date(auctionTime) - new Date();
        console.log(total);
        let auctionsTimer = setTimeout(ws.startAuction, total, auction.a_id);
        timer.push(auctionsTimer);
        }
      })
    }
  } catch (error) {
    console.log("error in Cron", error)
  }

})
// cron.schedule(process.env.CRON, async function () {
//   console.log("In Cron job")
//   let auctions = await getTodaysAuction();
//   console.log("Auctions ",auctions);
//   if (auctions.length > 0) {
//     auctions.map(auction => {
//       let auctionTime = auction.a_start_time;
//       const total = new Date(auctionTime) - new Date();
//       console.log(total);
//       let nextPlayer = setTimeout(ws.startAuction, total,auction.a_id);
//     })
//   }

// });
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`)
})
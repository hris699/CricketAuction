const express = require('express')
const app = express()
const router = require('./Router/router.js')
const PORT = process.env.PORT || 8080
const dotenv = require('dotenv');
const path = require('path');
const cors = require("cors");

console.log(path.resolve(__dirname, `${process.env.NODE_ENV}.env`))
dotenv.config({
    path: path.resolve(__dirname, `${process.env.NODE_ENV}.env`)
});
const OpenApiValidator = require('express-openapi-validator');
const apiSpec = path.join(__dirname, 'open-api.yaml');
const { swaggerServe, swaggerSetup } = require('./swaggerConfig.js')
let db = require('./config/database.js')
app.use(cors({origin:"*"}));
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(express.json());

app.use('/spec', express.static(apiSpec));
app.use(
    OpenApiValidator.middleware({
      apiSpec,
      validateResponses: false,
      validateRequests: true,
      ignorePaths: (path)=> path.includes("/api/players")
    }),
  );
app.use("/swagger", swaggerServe, swaggerSetup);
app.use(express.json());
app.use('/api', router);

app.listen(process.env.PORT, () => {
    console.log(`This app is running on ${process.env.PORT}`)
})

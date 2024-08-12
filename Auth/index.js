const express = require('express')
const app = express()
const router = require('./routes/authRouter.js')
const PORT = process.env.PORT || 9000
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const {getSecretString} = require('./common-function/util.js')
console.log(path.resolve(__dirname, `${process.env.NODE_ENV}.env`))
dotenv.config({
    path: path.resolve(__dirname, `${process.env.NODE_ENV}.env`)
});
const OpenApiValidator = require('express-openapi-validator');
const apiSpec = path.join(__dirname, 'authSwagger.yaml');
const { swaggerServe, swaggerSetup } = require('./authSwaggerConfig')


app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(express.json());
app.use(cors());

app.use('/spec', express.static(apiSpec));
app.use(
  OpenApiValidator.middleware({
    apiSpec,
    validateResponses: false,
    validateRequest: true
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
const callSecret = async () => {
  if(!process.env.NODE_ENV == 'local')
  {
    console.log(process.env.NODE_ENV)
    await getSecretString(process.env.SECRET_NAME);
  }
 
}
callSecret()


app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`)
})
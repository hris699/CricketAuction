const authController = require('../controllers/authController.js')
const dashboardController = require('../controllers/dashboardController.js')
const router = require('express').Router()
const {validateUser} = require('../common-function/util')
router.post('/auth/sign-up', authController.signUpUser)
router.post('/auth/login', authController.loginUser)
router.post('/auth/confirm-user',validateUser, authController.confirmUser)
router.get('/auth/requestToRegister',validateUser,authController.requestToRegister)
router.get('/auth/dashboard',dashboardController.redirectUser)
router.put('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

module.exports = router
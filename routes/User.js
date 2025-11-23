const express = require("express");

const router = express.Router();

// const {resetPasswordToken,resetPassword} = require("../controllers/ResetPassword")
const{
    login,
    signUp,
    sendOTP,
    changePassword,
} = require("../controllers/Auth");
const{
    resetPasswordToken,
    resetPassword,
} = require("../controllers/ResetPassword");

const{auth} = require("../middlewares/auth");

//Routes for Login, signup and Authentication


            //Authentication Routes


            //Route for user login
router.post("/login",login);

//Route for user signup
router.post("/signUp",signUp);

//Route for sendotp
router.post("/sendotp",sendOTP);

//Route for changing password
router.post("/changepassword",auth,changePassword)

//*********************************************************
//                Reset Password
//****************************************************/

//Route for generating a reset password token
router.post("/reset-password-token",resetPasswordToken)

//Route for resetting user's password after verification
router.post("/reset-password",resetPassword);

//Export the router for use in the main application
module.exports = router
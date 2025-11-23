const bcrypt = require("bcrypt");
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const {passwordUpdated} = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile")
require("dotenv").config();

//send OTP 
exports.sendOTP = async (req,res)=>{
    try{
        //fetch email from the request's body
        const {email} = req.body;

        //check if user already registered
        const checkUserPresent = await User.findOne({email});

        //if user already exists , then return a response
        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message:"User is already registered",
            })
        }

        //generate otp
        var otp = otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        console.log("OTP generated",otp);

        //check unique otp or not
        let result = await OTP.findOne({otp:otp});
        console.log("OTP",otp);
        console.log("Result",result);

        while(result){
            otp = otpGenerator.generate(6,{
                upperCaseAlphabets:false,
               
            });
           
        }

        const otpPayload = {email,otp};
        
        //create an entry for Otp
        const otpBody = await OTP.create(otpPayload);
        console.log("otpbody",otpBody);

        ///return response successfully
        res.status(200).json({
            succss:true,
            message:"OTP sent successfully",
            otp,
        })
    }

    catch(err){
        console.log(err.message);
        return res.status(500).json({success:false,
        error:err.message}
        );
    }
}

//signup controllers for registering Users
exports.signUp = async(req,res) =>{
    try{
    //data fetch from the req body
    const{
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        accountType,
        contactNumber,
        otp,
    } = req.body;

    //validate 
    if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
        return res.status(403).json({
            success:false,
            message:"All fields are required",
        })
    }

    //2 password match
    if(password !== confirmPassword){
        return res.status(400).json({
            success:false,
            message:"Password and confirmPassword value does not match, please try again",
        });

    }

    //check user already exists or not
    const existingUser = await User.findOne({email});
    if(existingUser){
        return  res.status(400).json({
            success:false,
            message:"user is already registered. Please sign in to continue",
        });
    }

    //find most recent OTP stored for the user

    const response = await OTP.find({email}).sort({createdAt:-1}).limit(1);

    console.log(response);
    // console.log(otp)
    //validate OTP
    if(response.length == 0){
        //OTP not found
        return res.status(400).json({
            success:false,
            message:"Otp not found",
        });
    } 
    else if(otp !== response[0].otp){
        //invalid otp
        return res.status(400).json({
            success:false,
            message:"Invalid Otp",
        });
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password,10);

    //create the user
    let approved = "";
    approved === "Instructor" ? (approved = false) : (approved = true);

    //create entry in DB
    const profileDetails = await Profile.create({
        gender:null,
        dateOfBirth:null,
        about:null,
        contactNumber:null,
    });
    
    const user = await User.create({
        firstName,
        lastName,
        email,
        contactNumber,
        password:hashedPassword,
        accountType:accountType,
        approved:approved,
        additionalDetails:profileDetails._id,
        image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName}${lastName}`
    });

    // return response
    return res.status(200).json({
        success:true,
        message:"User is registered Successfully",
        user,
    });  
}
catch(err){
      console.error(err);
      return res.status(500).json({
        success:false,
        message:"Use cannot be registered . Please try again",
      })

}
}

//login
exports.login = async (req,res) =>{
      try{
        //get data from the body req
        const {email, password} = req.body;
        //validation data
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"All fields are required , please try again",
            })

        }
        //user check exist or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User is not registered , please signup to continue",
            })

        }
        //generate JWT , after password matching
        if(await bcrypt.compare(password,user.password)){
            const payload = {
                email:user.email,
                id:user._id,
                accountType:user.accountType,
            }
         const token = jwt.sign(payload,process.env.JWT_SECRET,{
            expiresIn:"24h",
            
         });

         //save token to user document in db
         user.token = token;
         user.password = password;

         //create cookie send response
         const options = {
            expires:new Date(Date.now() +  3 * 24 * 60 * 60 * 1000),
            httOnly:true,
         }
         res.cookie("token",token,options).status(200).json({
            success:true,
            token,
            user,
            message:"Logged in Successfully",
         })
        }
        else{
            return res.status(401).json({
                success:false,
                message:"password is incorrect",
            });
        }
      }
      catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Login Failure , please try again",
        });
      }
}

//Controllers for changing password
exports.changePassword = async(req,res)=>{
    try{
        //Get user data from req.user
        const userDetails = await User.findById(req.user.id);

        //Get old password , new password, and confirm new password from req.body
        
        const {oldPassword,newPassword} =  req.body;

        //validate old password
        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        );
        if(!isPasswordMatch){
            //if old password does not match, return a 401 (unathourized error)
            return res.status(401).json({
                success:false,
                message:"The password is incorrect"
            })
        }
        
        //update password
        const encrypedPassword = await bcrypt.hash(newPassword,10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            {password:encrypedPassword},
            {new : true},
        );
        //send notification email
        try{
            const emailResponse = await mailSender(        updatedUserDetails.email,    
            passwordUpdated(

                `Password updated successfully for
                ${updatedUserDetails.firstName}
                ${updatedUserDetails.lastName}`
                )
            )   
            console.log("Email sent successfully",emailResponse.response);         
        }
        catch(error){
            // if there's an error sending the email, then return a response with 500 (internal server error)
            console.error("error occurred while sending email",error);
            return res.status(500).json({
                success:false,
                message:"Error occurred while sending email",
                error:error.message,
            })
        }
        return res.status(200).json(
            {
                success:true,
                message:"Password updated successfully"
            }
        );

    }
    catch(error){
        // // if there's an error updating the password, then return a response with 500 (internal server error)
        console.error("Error occurred while updating password : ", error);
        return res.status(500).json({
            success:false,
            message:"error occurred while updating password",
            error:error.message,
        })
    }
};
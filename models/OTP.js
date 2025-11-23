const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,

    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:60*5,//th document will be automatically deleted after 5 minutes of its creation time
        
    }
});

// a function -> to send emails
async function  sendVerificationEmail(email,otp){
    try{
        const mailResponse = await mailSender(email,
            " Verification email ",
            emailTemplate(otp)
            );
        console.log("Email sent successfully",
        mailResponse.response);


    }
    catch(err){
        console.log("error occurred while sending email",err);
        throw err;
    }
}

OTPSchema.pre("save",async function(next){
    console.log("New document saved to database");

    //only send an email when a  new document is created 
    if(this.isNew){
        await sendVerificationEmail(this.email,this.otp);
    }
    next();
})

module.exports = mongoose.model("OTP",OTPSchema);
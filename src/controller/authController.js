import user from "../model/user.js";
import jwt from "jsonwebtoken";
import express from "express";
import {generateRefreshToken,generateTokens,verifyRefreshToken,} from "../service/auth/authService.js";
import {convertToResponse,decrypt,encrypt,generateRandomNumber,getCurrentTime,} from "../util/util.js";
import {accessDenied,accessTokenCreatedSuccessfully,internalServerError,invalidPassword,  loginSuccessfully,logout,registrationSuccessFully,userAlreadyExist,userNotFound,verifyEmail,} from "../constants/message.js";
import userToken from "../model/userToken.js";
import { emailService } from "../service/email/emailService.js";
import { veriFyOtp } from "../template/emailVerifyTemplate.js";
import passport from '../service/auth/passportService.js';
import cors from 'cors';
const router = express.Router();
const clientUri = process.env.CLIENT_URL;

export const decodeObject = (obj) => {
  const decodedObj = {};
  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      const encodedValue = obj[key];
      const decodedValue = atob(encodedValue);
      decodedObj[key] = decodedValue;
    }
  }
  return decodedObj;
};



router.get('/google',passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', passport.authenticate('google', { successRedirect:`${clientUri}/`, failureRedirect: `${clientUri}/auth` }));

router.get('/google/profile', (req, res) => {
  console.log('Inside profile route' , req.user);
  if (req.user) {
    return  res.json(convertToResponse({data:{userData:req?.user?.userData,accessToken: req?.user?.accessToken},status:200,messageType:'success' , messageText:'User Logged-in'})); 
  }
  else{
    res.json(convertToResponse({data:{},status:400,messageType:'error' , messageText:'something went wrong'}))
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, mobile, password } = decodeObject(req.body);
    const newPassword = encrypt(password);
    const existingUser = await user.findOne({ email: email });

    if (existingUser) {
      console.log(convertToResponse({data:{},status:400,messageType:'error' , messageText:'User already exists'}));
      return res.json(convertToResponse({data:{},status:400,messageType:'error' , messageText:'User already exists'}));
    }

    const otp = generateRandomNumber();
    const verificationExpiryTime = getCurrentTime(30);

    console.log(otp, verificationExpiryTime, name, email, mobile, newPassword);

    const newUser = new user({
      name,
      email,
      mobile,
      password: newPassword,
      createdAt: Date.now(),
      verificationCode: otp,
      isVerified: false,
      verificationExpiryTime,
    });

    const savedUser = await newUser.save();

    const emailResult = await emailService({
      to: email,
      subject: "Please verify your email",
      html:veriFyOtp(otp),
      text: `Welcome to Merizameen. Here is your verification OTP: ${otp}. It will expire in 30 minutes.`,
    });

    console.log(savedUser, emailResult);
    return res.status(200).json(convertToResponse({data:{id: savedUser.id},status:200,messageType:'success' , messageText:verifyEmail}));
  } catch (error) {
    console.error(error);
    return res.json(convertToResponse({data:{},status:500,messageType:'error' , messageText:internalServerError}));
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { id, otp } = req.body;

    if (!id || !otp) {
     return res.json(convertToResponse({data:{},status:400,messageType:'error' , messageText:"Missing user ID or OTP"}));  
    }

    const retriveUser = await user.findById(id);

    if (retriveUser?.verificationExpiryTime >= getCurrentTime()) {
      if (otp == retriveUser?.verificationCode) {
        await generateRefreshToken(retriveUser);
        
        return res.status(200).json(convertToResponse({data:{},status:200,messageType:'success' , messageText:"User created successfully"}));
      } else {
        return res.json(convertToResponse({data:{},status:400,messageType:'error' , messageText:"otp invalid "}));
      }
    } else {
      await user.findByIdAndDelete(id);
      return res
        .status(400)
        .json(
          convertToResponse({data:{},status:400,messageType:'error' , messageText:"OTP expired, please register again"}));
    }
  } catch (error) {
          res.json(convertToResponse({data:{},status:500,messageType:'error' , messageText:"Internal server error"}));
  }
});



router.post("/login", async (req, res) => {
  try {
    const { email, password } = decodeObject(req.body);
    const userRecord = await user.findOne({ email });
    if (!userRecord) {
      return res.json(
        convertToResponse({data:{},status:400,messageType:'error' , messageText:userNotFound}));
    }
    const decryptedPassword = decrypt(userRecord.password);
    if (password !== decryptedPassword) {
      return res.json(
        convertToResponse({data:{},status:400,messageType:'error' , messageText:invalidPassword})       );
    }
    if (!userRecord.isVerified) {
      return res.json(
        convertToResponse({data:{},status:400,messageType:'error' , messageText:"Not Verified please contact to our customer support "}));
    }
    const { accessToken } = await generateTokens(userRecord);
    const userData = btoa(
      `${userRecord._id}:${userRecord.name}:${userRecord.email}:${userRecord.mobile}:${userRecord.roles}`
    );

    return res
      .status(200)
      .json(
        convertToResponse({data:{accessToken, userData},status:200,messageType:'success' , messageText:loginSuccessfully})      );
  } catch (error) {
    console.log(error);
    return res.json(
      convertToResponse({data:{},status:500,messageType:'error' , messageText:internalServerError}));
  }
});

router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(
      convertToResponse({data:{},status:400,messageType:'error' , messageText:accessDenied}));        
    }

    const reqToken = authHeader.substring("Bearer ".length);
    if (!reqToken) {
      return res.json(
        convertToResponse({data:{},status:400,messageType:'error' , messageText:'session already expired'}));
    }

    const token = await userToken.findOneAndDelete({ token: reqToken });
    console.log(token);
    if (!token) {
      return res.status(200).json(
        convertToResponse({data:{},status:200,messageType:'success' , messageText:'logged-out'}));
    }
    res.status(200).json(convertToResponse({data:{},status:200,messageType:'success' , messageText:'logged-out'}));
  } catch (err) {
    console.log(err);
    res.json(
      convertToResponse({data:{},status:500,messageType:'error' , messageText:internalServerError}));
  }
});

router.post("/refreshToken", async (req, res) => {
  verifyRefreshToken(req.body.refreshToken)
    .then((tokenDetails) => {
      console.log(tokenDetails);
      const payload = { _id: tokenDetails._id, roles: tokenDetails.roles };
      const accessToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_TIME,
      });
      res.status(200).json({
        accessToken,
        message: accessTokenCreatedSuccessfully,
      });
    })
    .catch((err) => {
      res.json(err);
      console.log(err);
    });
});

export default router;

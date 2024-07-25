import express from "express";
import jwt from "jsonwebtoken";
import { accessDenied, accessTokenCreatedSuccessfully, internalServerError, invalidPassword, loginSuccessfully, userNotFound, verifyEmail } from "../constants/message.js";
import user from "../model/user.js";
import userToken from "../model/userToken.js";
import { generateRefreshToken, generateTokens, verifyRefreshToken, } from "../service/auth/authService.js";
import { emailService } from "../service/email/emailService.js";
import { veriFyOtp } from "../template/emailVerifyTemplate.js";
import { convertToResponse, decrypt, encrypt, generatePassword, generateRandomNumber, getCurrentTime, } from "../util/util.js";
import FeedBack from "../model/feedBack.js";
import { feedBackTemplate } from "../template/feedBackTemplate.js";

const router = express.Router();

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



async function handleExistingGoogleUser(userRecord, res) {
  const { accessToken } = await generateTokens(userRecord);
  const userData = btoa(`${userRecord._id}:${userRecord.name}:${userRecord.email}:${userRecord.mobile}:${userRecord.roles}`);
  return res.status(200).json(convertToResponse({ data: { accessToken, userData }, status: 200, messageType: 'success', messageText: loginSuccessfully }));
}

async function createNewGoogleUser({ name, email, password, jti, picture }) {
  return new user({ name, email, password, isGoogleUser: true, googleId: jti, profilePic: picture, isVerified: true, });
}


router.post('/googleLogin', async (req, res) => {
  const { credentials } = req.body;
  try {
    const decoded = await jwt.decode(credentials);
    const password = generatePassword(16);
    const { name, picture, email, jti } = decoded || {};

    const existingUser = await user.findOne({ email });

    if (existingUser && existingUser?.isGoogleUser) {
      return await handleExistingGoogleUser(existingUser, res);
    } else if (existingUser?.isVerified && existingUser?.verificationCode && !existingUser?.isGoogleUser) {
      return res.status(200).json(convertToResponse({ data: {}, status: 200, messageType: 'error', messageText: 'Something went wrong, or the user is already registered with the same email using local sign-in. Please use your password to log in. If you don’t remember it, please reset your password or contact our customer support team.' }));
    } else {
      const newUser = await createNewGoogleUser({ name, email, password, jti, picture });
      const savedUser = await newUser.save();
      const retrievedUser = await user.findById(savedUser._id);
      const refreshToken = await generateRefreshToken(retrievedUser);
      return await handleExistingGoogleUser(retrievedUser, res);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(convertToResponse({ data: { error }, status: 500, messageType: 'error', messageText: internalServerError }));
  }
});




router.post("/signup", async (req, res) => {
  try {
    const { name, email, mobile, password } = decodeObject(req.body);
    const newPassword = encrypt(password);
    const existingUser = await user.findOne({ email: email });

    if (existingUser) {
      return res.json(convertToResponse({ data: {}, status: 400, messageType: 'error', messageText: 'User already exists' }));
    }

    const otp = generateRandomNumber();
    const verificationExpiryTime = getCurrentTime(30);

    const newUser = new user({ name, email, mobile, password: newPassword, createdAt: Date.now(), verificationCode: otp, isVerified: false, verificationExpiryTime, });

    const savedUser = await newUser.save();

    const emailResult = await emailService({
      to: email,
      subject: "Please verify your email",
      html: veriFyOtp(otp),
      text: `Welcome to Merizameen. Here is your verification OTP: ${otp}. It will expire in 30 minutes.`,
    });

    return res.status(200).json(convertToResponse({ data: { id: savedUser.id }, status: 200, messageType: 'success', messageText: verifyEmail }));
  } catch (error) {
    console.error(error);
    return res.json(convertToResponse({ data: {}, status: 500, messageType: 'error', messageText: internalServerError }));
  }
});



router.post("/verify", async (req, res) => {
  try {
    const { id, otp } = req.body;

    if (!id || !otp) {
      return res.json(convertToResponse({ data: {}, status: 400, messageType: 'error', messageText: "Missing user ID or OTP" }));
    }

    const retriveUser = await user.findById(id);

    if (retriveUser?.verificationExpiryTime >= getCurrentTime()) {
      if (otp == retriveUser?.verificationCode) {
        await generateRefreshToken(retriveUser);

        return res.status(200).json(convertToResponse({ data: {}, status: 200, messageType: 'success', messageText: "User created successfully" }));
      } else {
        return res.json(convertToResponse({ data: {}, status: 400, messageType: 'error', messageText: "otp invalid " }));
      }
    } else {
      await user.findByIdAndDelete(id);
      return res.status(400).json(convertToResponse({ data: {}, status: 400, messageType: 'error', messageText: "OTP expired, please register again" }));
    }
  } catch (error) {
    res.json(convertToResponse({ data: {}, status: 500, messageType: 'error', messageText: "Internal server error" }));
  }
});



router.post("/login", async (req, res) => {
  try {
    const { email, password } = decodeObject(req?.body);
    const userRecord = await user.findOne({ email });
    const decryptedPassword = decrypt(userRecord.password);
    if (!userRecord) return res.json(convertToResponse({ data: {}, status: 400, messageType: 'error', messageText: userNotFound }));

    if (password !== decryptedPassword) return res.json(convertToResponse({ data: {}, status: 400, messageType: 'error', messageText: invalidPassword }));

    if (!userRecord.isVerified) return res.json(convertToResponse({ data: {}, status: 400, messageType: 'error', messageText: "Not Verified please contact to our customer support " }));


    const { accessToken } = await generateTokens(userRecord);

    const userData = btoa(`${userRecord._id}:${userRecord.name}:${userRecord.email}:${userRecord.mobile}:${userRecord.roles}`);
    return res.status(200).json(convertToResponse({ data: { accessToken, userData }, status: 200, messageType: 'success', messageText: loginSuccessfully }));
  } catch (error) {
    console.log(error);
    return res.json(convertToResponse({ data: {}, status: 500, messageType: 'error', messageText: internalServerError }));
  }
});

router.post("/logout", async (req, res) => {

  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(
        convertToResponse({ data: {}, status: 400, messageType: 'error', messageText: accessDenied }));
    }

    const reqToken = authHeader.substring("Bearer ".length);
    if (!reqToken) {
      return res.json(
        convertToResponse({ data: {}, status: 400, messageType: 'error', messageText: 'session already expired' }));
    }

    const token = await userToken.findOneAndDelete({ token: reqToken });
    if (!token) {
      return res.status(200).json(
        convertToResponse({ data: {}, status: 200, messageType: 'success', messageText: 'logged-out' }));
    }
    res.status(200).json(convertToResponse({ data: {}, status: 200, messageType: 'success', messageText: 'logged-out' }));

  } catch (err) {
    res.json(
      convertToResponse({ data: {}, status: 500, messageType: 'error', messageText: internalServerError }));
  }
});

router.post("/refreshToken", async (req, res) => {
  verifyRefreshToken(req.body.refreshToken)
    .then((tokenDetails) => {
      const payload = { _id: tokenDetails._id, roles: tokenDetails.roles };
      const accessToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_TIME,
      });
      res.status(200).json({ accessToken, message: accessTokenCreatedSuccessfully, });
    })
    .catch((err) => { res.json(err) });
});


router.post('/feedBack', async (req, res) => {
  const { name, email, feedBack } = req.body;
  if (name && email && feedBack) {
    const newFeedBack = new FeedBack({
      name: name,
      email: email,
      feedBack: feedBack,
    })
    await newFeedBack.save();
    await emailService({
      to: process.env.ACC_EMAIL,
      subject: 'General FeedBack',
      text: '',
      html: feedBackTemplate({ userName: name, email: email, feedBack: feedBack })
    })
    res.json(convertToResponse({ data: {}, status: 200 }))
  } else {
    res.json(convertToResponse({ data: {}, status: 400 }))
  }
});

export default router;

import user from "../model/user.js";
import jwt from "jsonwebtoken";
import express from "express";
import {
  generateRefreshToken,
  generateTokens,
  verifyRefreshToken,
} from "../service/auth/authService.js";
import {
  decrypt,
  encrypt,
  generateRandomNumber,
  getCurrentTime,
} from "../util/util.js";
import {
  accessDenied,
  accessTokenCreatedSuccessfully,
  internalServerError,
  invalidPassword,
  loginSuccessfully,
  logout,
  registrationSuccessFully,
  userAlreadyExist,
  userNotFound,
} from "../constants/message.js";
import userToken from "../model/userToken.js";
import { emailService } from "../service/email/emailService.js";
import { veriFyOtp } from "../template/emailVerifyTemplate.js";

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

router.post("/signup", async (req, res) => {
  console.log("Inside signup");
  try {
    const { name, email, mobile, password } = decodeObject(req.body);
    const newPassword = encrypt(password);
    const existingUser = await user.findOne({ email: email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
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
    return res
      .status(200)
      .json({
        status: 200,
        id: savedUser.id,
        message: "Please verify your email and enter OTP.",
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { id, otp } = req.body;

    if (!id || !otp) {
      return res.status(400).json({ message: "Missing user ID or OTP" });
    }

    const retriveUser = await user.findById(id);

    if (retriveUser?.verificationExpiryTime >= getCurrentTime()) {
      if (otp == retriveUser?.verificationCode) {
        await generateRefreshToken(retriveUser);
        return res.status(200).json({status:200, message: "User created successfully" });
      } else {
        return res.status(400).json({ message: "Invalid OTP" });
      }
    } else {
      await user.findByIdAndDelete(id);
      return res
        .status(400)
        .json({ message: "OTP expired, please register again" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});



router.post("/login", async (req, res) => {
  try {
    const { email, password } = decodeObject(req.body);
    const userRecord = await user.findOne({ email });
    if (!userRecord) {
      return res.status(400).json({ message: userNotFound });
    }
    const decryptedPassword = decrypt(userRecord.password);
    if (password !== decryptedPassword) {
      return res.status(400).json({ message: invalidPassword });
    }
    if (!userRecord.isVerified) {
      return res.status(400).json({ message: 'Not Verified please contact to our customer support ' });
    }
    const { accessToken } = await generateTokens(userRecord);
    const userData = btoa(
      `${userRecord._id}:${userRecord.name}:${userRecord.email}:${userRecord.mobile}:${userRecord.roles}`
    );
    console.log(accessToken, userData);

    return res
      .status(200)
      .json({ message: loginSuccessfully, accessToken, userData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: internalServerError });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: accessDenied });
    }

    const reqToken = authHeader.substring("Bearer ".length);
    if (!reqToken) {
      return res.status(401).json({ message: "session already expired" });
    }

    console.log("reqToken", reqToken);
    const token = await userToken.findOneAndDelete({ token: reqToken });
    console.log(token);
    if (!token) {
      return res.status(200).json({ error: false, message: "logged-out" });
    }
    res.status(200).json({ error: false, message: logout });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: internalServerError });
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
      res.status(400).json(err);
      console.log(err);
    });
});

export default router;

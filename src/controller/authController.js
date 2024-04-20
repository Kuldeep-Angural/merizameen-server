import user from "../model/user.js";
import jwt from "jsonwebtoken";
import express from "express";
import {
  generateRefreshToken,
  generateTokens,
  verifyRefreshToken,
} from "../service/auth/authService.js";
import { decrypt, encrypt } from "../util/util.js";
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

const router = express.Router();

const decodeObject = (obj) => {
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
  try {
    const { name, email, mobile, password } = decodeObject(req.body);
    const newPassword = encrypt(password);

    const existingUser = await user.findOne({ email: email });

    if (existingUser) {
      return res.status(400).json({ message: userAlreadyExist });
    }

    const newUser = new user({
      name,
      email,
      mobile,
      password: newPassword,
      createdAt: Date.now(),
    });
    const data = await newUser.save();
    await generateRefreshToken(data);
    return res.status(200).json({ message: registrationSuccessFully });
  } catch (error) {
    return res.status(500).json({ message: internalServerError });
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

    console.log("reqToken",reqToken);
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

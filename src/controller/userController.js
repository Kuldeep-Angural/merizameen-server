import express from 'express';
import { generateRandomNumber, getCurrentTime, encrypt } from '../util/util.js';
import { forgotEmailTemplate } from '../template/forgotEmailTemplate.js';
import { emailService } from '../service/email/emailService.js';
import User from '../model/user.js';
import { decodeObject } from './authController.js';
import { accountDeleted, badRequest, internalServerError, invalidOrExpireOtp, passwordResetOtpMail, passwordUpdate, someThingWentWrong, userNotFound } from '../constants/message.js';

const router = express.Router();

const sendForgotPasswordEmail = async (user, otp) => {
  const emailResult = await emailService({
    to: user.email,
    subject: 'Forgot Password',
    html: forgotEmailTemplate(otp),
    text: `Welcome to Merizameen. Here is your verification OTP: ${otp}. It will expire in 30 minutes.`,
  });
};

router.post('/otpRequestForPasswordChange', async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateRandomNumber();
    const verificationExpiryTime = getCurrentTime(30);

    const existUser = await User.findOne({ email });

    if (!existUser) {
      return res.status(400).json( convertToResponse({data:{},status:400,messageType:'error' , messageText:userNotFound}));
    }

    await User.findByIdAndUpdate(existUser._id, {
      ...existUser.toObject(),
      verificationCode: otp,
      verificationExpiryTime,
    });

    await sendForgotPasswordEmail(existUser, otp);

    return res.status(200).json(
      convertToResponse({data:{id: existUser.id},status:200,messageType:'success' , messageText:passwordResetOtpMail}));
  } catch (error) {
    console.error('Error in OTP request for password change:', error);
    return res.status(500).json(convertToResponse({data:{},status:500,messageType:'error' , messageText:internalServerError}));
      
  }
});

router.post('/changePassword', async (req, res) => {
  try {
    const { id, otp, password } = decodeObject(req.body);
    const newPassword = encrypt(password);

    const existingUser = await User.findById(id);

    if (existingUser && Number(otp) === existingUser.verificationCode && existingUser.verificationExpiryTime >= getCurrentTime()) {
      await User.findByIdAndUpdate(id, {
        ...existingUser.toObject(),
        password: newPassword,
        isVerified: true,
        
      });

      return res.status(200).json(
        convertToResponse({data:{},status:200,messageType:'success' , messageText:passwordUpdate}));

    } else {
      return res.status(400).json(
        convertToResponse({data:{},status:400,messageType:'error' , messageText:invalidOrExpireOtp}));
        
    }
  } catch (error) {
    console.error('Error in changing password:', error);
    return res.status(500).json(
      convertToResponse({data:{},status:500,messageType:'error' , messageText:someThingWentWrong}));
      
  }
});

router.delete('/delete', async (req, res) => {
  try {
    const { email, id } = req.body;

    if (id) {
      await User.findByIdAndDelete(id);
      return res.json({ message: accountDeleted });
    }

    if (email) {
      const user = await User.findOne({ email });

      if (user) {
        await User.findByIdAndDelete(user._id);
        return res.json({ message: accountDeleted });
      }
    }

    return res.status(400).json({ message: badRequest });
  } catch (error) {
    console.error('Error in deleting user:', error);
    return res.status(500).json({ message: someThingWentWrong });
  }
});

export default router;

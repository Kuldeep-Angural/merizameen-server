import express from 'express';
import { generateRandomNumber, getCurrentTime, encrypt, convertToResponse } from '../util/util.js';
import { forgotEmailTemplate } from '../template/forgotEmailTemplate.js';
import { emailService } from '../service/email/emailService.js';
import User from '../model/user.js';
import { decodeObject } from './authController.js';
import { accountDeleted, badRequest, internalServerError, invalidOrExpireOtp, passwordResetOtpMail, passwordUpdate, someThingWentWrong, userNotFound } from '../constants/message.js';
import user from '../model/user.js';
import { uploadOnCLoudnary } from '../service/cloudnary/cloudnary.js';
import propertyLikes from '../model/propertyLikes.js';
import property from '../model/post.js';

const router = express.Router();

const sendForgotPasswordEmail = async (user, otp) => {
  const emailResult = await emailService({
    to: user.email,
    subject: 'Forgot Password',
    html: forgotEmailTemplate(otp),
    text: `Welcome to Merizameen. Here is your verification OTP: ${otp}. It will expire in 30 minutes.`,
  });
};

router.post('/details', async (req, res) => {
  try {
    const userId = req.body.id;
    const existUser = await user.findById(userId);

    if (!existUser) {
      return res.json(convertToResponse({ data: {}, status: 400, messageType: 'error', messageText: userNotFound }));
    } else {
      delete existUser.password;
      res.json(convertToResponse({ data: existUser, status: 200, messageType: 'success', messageText: 'User Details' }));
    }
  } catch (error) {
    return res.json(convertToResponse({ data: {}, status: 400, messageType: 'error', messageText: someThingWentWrong }));
  }
});


router.post('/updateUser', async (req, res) => {
  try {
    const { _id, profilePic, name, mobile } = req.body;
    const existUser = await user.findById(_id);

    if (!existUser) {
      return res.json(convertToResponse({ 
        data: {}, 
        status: 400, 
        messageType: 'error', 
        messageText: userNotFound 
      }));
    }

    const updateUser = {
      updatedAt:Date.now(),
    };

    if (profilePic) {
      const mainImageUrl = await uploadOnCLoudnary(profilePic, `${_id}`, 'ProfilePictures');
      updateUser.profilePic = mainImageUrl;
    }

    if (name) updateUser.name = name;
    if (mobile) updateUser.mobile = mobile;

    const updatedUser = await user.findByIdAndUpdate(_id, updateUser, { new: true });

    res.json(convertToResponse({ 
      data: updatedUser, 
      status: 200, 
      messageType: 'success', 
      messageText: 'Details Updated Successfully' 
    }));
  } catch (error) {
    res.json(convertToResponse({ 
      data: {}, 
      status: 400, 
      messageType: 'error', 
      messageText: someThingWentWrong 
    }));
  }
});



router.post('/otpRequestForPasswordChange', async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateRandomNumber();
    const verificationExpiryTime = getCurrentTime(30);

    const existUser = await User.findOne({ email });

    if (!existUser) {
      return res.json( convertToResponse({data:{},status:400,messageType:'error' , messageText:userNotFound}));
    }

    await User.findByIdAndUpdate(existUser._id, {
      ...existUser.toObject(),
      verificationCode: otp,
      verificationExpiryTime,
    });

    await sendForgotPasswordEmail(existUser, otp);

    return res.json(
      convertToResponse({data:{id: existUser.id},status:200,messageType:'success' , messageText:passwordResetOtpMail}));
  } catch (error) {
    console.error('Error in OTP request for password change:', error);
    return res.json(convertToResponse({data:{},status:500,messageType:'error' , messageText:internalServerError}));
      
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
      return res.json(
        convertToResponse({data:{},status:400,messageType:'error' , messageText:invalidOrExpireOtp}));
        
    }
  } catch (error) {
    console.error('Error in changing password:', error);
    return res.json(
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

    return res.json({ message: badRequest });
  } catch (error) {
    console.error('Error in deleting user:', error);
    return res.json({ message: someThingWentWrong });
  }
});


router.get('/getUserLikes', async (req, res) => {
  try {
    const user = JSON.parse(req.headers['appcontext']);
    const userLikes = await propertyLikes.find({ userId: user._id });
    const allLikedPropertiesPromises = userLikes.map(element => property.findById(element?.property));
    const allLikedProperties = await Promise.all(allLikedPropertiesPromises);

const allLikedPropertiesWithUserLikes = allLikedProperties.map((property, index) => {
  return {
    ...property.toObject(), // Convert MongoDB document to a plain JavaScript object
    userLikes: userLikes[index]
  };
});

    if (!allLikedPropertiesWithUserLikes) {
      res.json(convertToResponse({ 
        data: {}, 
        status: 200, 
        messageType: 'Success', 
        messageText: "No Likes" 
      }));
    }else{
      res.json(convertToResponse({ 
        data: allLikedPropertiesWithUserLikes, 
        status: 200, 
        messageType: 'Success', 
        messageText: "Total Likes" 
      }));
    }
  }
  catch(error){
    res.json(convertToResponse({ 
      data: {}, 
      status: 500, 
      messageType: 'ERROR', 
      messageText: someThingWentWrong
    }));
    console.log(Error);
  }

})




router.get('/getSellerLikes', async (req, res) => {
  try {
    const userData = JSON.parse(req.headers['appcontext']);
    const sellerLikes = await propertyLikes.find({sellerId:userData._id});
    
    const users = await user.find({_id:sellerLikes?.userId});
    console.log(users);
    const allLikedPropertiesPromises = sellerLikes.map(element => property.findById(element?.property) );

    const allLikedProperties = await Promise.all(allLikedPropertiesPromises);
    const allLikedPropertiesWithsellerLikes = allLikedProperties.map((property, index) => {
  return {
    ...property.toObject(), 
    sellerLikes: sellerLikes[index]
  };
});
    if (!allLikedPropertiesWithsellerLikes) {
      res.json(convertToResponse({ 
        data: {}, 
        status: 200, 
        messageType: 'Success', 
        messageText: "No Likes" 
      }));
    }else{
      res.json(convertToResponse({ 
        data: allLikedPropertiesWithsellerLikes, 
        status: 200, 
        messageType: 'Success', 
        messageText: "Total Likes" 
      }));
    }
  }
  catch(error){
    res.json(convertToResponse({ 
      data: {}, 
      status: 500, 
      messageType: 'ERROR', 
      messageText: someThingWentWrong
    }));
    console.log(Error);
  }

})



router.get('/getPostedProperties', async (req, res) => {
  try {
    const user = JSON.parse(req.headers['appcontext']);
    const postedProperty = await property.find({userId:user._id});
    if (!postedProperty) {
      res.json(convertToResponse({ 
        data: {}, 
        status: 200, 
        messageType: 'Success', 
        messageText: "No Property Posted Yet" 
      }));
    }else{
      res.json(convertToResponse({ 
        data: postedProperty, 
        status: 200, 
        messageType: 'Success', 
        messageText: "Total Properties" 
      }));
    }
  }
  catch(error){
    res.json(convertToResponse({ 
      data: {}, 
      status: 500, 
      messageType: 'ERROR', 
      messageText: someThingWentWrong
    }));
    console.log(Error);
  }

})


export default router;

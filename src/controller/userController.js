import express from "express";
import {
  generateRandomNumber,
  getCurrentTime,
  encrypt,
  convertToResponse,
} from "../util/util.js";
import { forgotEmailTemplate } from "../template/forgotEmailTemplate.js";
import { emailService } from "../service/email/emailService.js";
import User from "../model/user.js";
import { decodeObject } from "./authController.js";
import {
  accountDeleted,
  badRequest,
  internalServerError,
  invalidOrExpireOtp,
  passwordResetOtpMail,
  passwordUpdate,
  someThingWentWrong,
  userNotFound,
} from "../constants/message.js";
import user from "../model/user.js";
import { uploadOnCLoudnary } from "../service/cloudnary/cloudnary.js";
import propertyLikes from "../model/propertyLikes.js";
import property from "../model/post.js";

const router = express.Router();

const sendForgotPasswordEmail = async (user, otp) => {
  const emailResult = await emailService({
    to: user.email,
    subject: "Forgot Password",
    html: forgotEmailTemplate(otp),
    text: `Welcome to Merizameen. Here is your verification OTP: ${otp}. It will expire in 30 minutes.`,
  });
};

router.post("/details", async (req, res) => {
  try {
    const userId = req.body.id;
    const existUser = await user.findById(userId);

    if (!existUser) {
      return res.json(
        convertToResponse({
          data: {},
          status: 400,
          messageType: "error",
          messageText: userNotFound,
        })
      );
    } else {
      delete existUser.password;
      res.json(
        convertToResponse({
          data: existUser,
          status: 200,
          messageType: "success",
          messageText: "User Details",
        })
      );
    }
  } catch (error) {
    return res.json(
      convertToResponse({
        data: {},
        status: 400,
        messageType: "error",
        messageText: someThingWentWrong,
      })
    );
  }
});

router.post("/updateUser", async (req, res) => {
  try {
    const { _id, profilePic, name, mobile } = req.body;
    const existUser = await user.findById(_id);

    if (!existUser) {
      return res.json(
        convertToResponse({
          data: {},
          status: 400,
          messageType: "error",
          messageText: userNotFound,
        })
      );
    }

    const updateUser = {
      updatedAt: Date.now(),
    };

    if (profilePic) {
      const mainImageUrl = await uploadOnCLoudnary(
        profilePic,
        `${_id}`,
        "ProfilePictures"
      );
      updateUser.profilePic = mainImageUrl;
    }

    if (name) updateUser.name = name;
    if (mobile) updateUser.mobile = mobile;

    const updatedUser = await user.findByIdAndUpdate(_id, updateUser, {
      new: true,
    });

    res.json(
      convertToResponse({
        data: updatedUser,
        status: 200,
        messageType: "success",
        messageText: "Profile Updated Successfully",
      })
    );
  } catch (error) {
    res.json(
      convertToResponse({
        data: {},
        status: 400,
        messageType: "error",
        messageText: someThingWentWrong,
      })
    );
  }
});

router.post("/otpRequestForPasswordChange", async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateRandomNumber();
    const verificationExpiryTime = getCurrentTime(30);

    const existUser = await User.findOne({ email });

    if (!existUser) {
      return res.json(
        convertToResponse({
          data: {},
          status: 400,
          messageType: "error",
          messageText: userNotFound,
        })
      );
    }

    await User.findByIdAndUpdate(existUser._id, {
      ...existUser.toObject(),
      verificationCode: otp,
      verificationExpiryTime,
    });

    await sendForgotPasswordEmail(existUser, otp);

    return res.json(
      convertToResponse({
        data: { id: existUser.id },
        status: 200,
        messageType: "success",
        messageText: passwordResetOtpMail,
      })
    );
  } catch (error) {
    console.error("Error in OTP request for password change:", error);
    return res.json(
      convertToResponse({
        data: {},
        status: 500,
        messageType: "error",
        messageText: internalServerError,
      })
    );
  }
});

router.post("/changePassword", async (req, res) => {
  try {
    const { id, otp, password } = decodeObject(req.body);
    const newPassword = encrypt(password);

    const existingUser = await User.findById(id);

    if (
      existingUser &&
      Number(otp) === existingUser.verificationCode &&
      existingUser.verificationExpiryTime >= getCurrentTime()
    ) {
      await User.findByIdAndUpdate(id, {
        ...existingUser.toObject(),
        password: newPassword,
        isVerified: true,
      });

      return res
        .status(200)
        .json(
          convertToResponse({
            data: {},
            status: 200,
            messageType: "success",
            messageText: passwordUpdate,
          })
        );
    } else {
      return res.json(
        convertToResponse({
          data: {},
          status: 400,
          messageType: "error",
          messageText: invalidOrExpireOtp,
        })
      );
    }
  } catch (error) {
    console.error("Error in changing password:", error);
    return res.json(
      convertToResponse({
        data: {},
        status: 500,
        messageType: "error",
        messageText: someThingWentWrong,
      })
    );
  }
});

router.delete("/delete", async (req, res) => {
  const { email, id } = req.body;
  try {
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
    console.error("Error in deleting user:", error);
    return res.json({ message: someThingWentWrong });
  }
});

router.get("/getUserLikes", async (req, res) => {
    const userData = JSON.parse(req.headers["appcontext"]);
    try {
      const likes = await propertyLikes.find({ userId: userData._id });
      if (likes?.length>0) {
        const propertyIds = likes.map(like => like.property);
        const properties = await property.find({ _id: { $in: propertyIds } });
    
        const results = likes.map(like => {
          const likedProperty = properties.find(prop => prop._id.equals(like.property));
          return {
            likeId: like._id,
            userId: like.userId,
            sellerId: like.sellerId,
            likedAt: like.likedAt,
            property: likedProperty
          };
        });
        res.json( convertToResponse({ data: results, status: 200, messageType: "SUCCESS", messageText: "Here is The Likes",}))
      }else{
      res.json(convertToResponse({ data: {},status: 200,messageType: "SUCCESS",messageText: 'No Data Found',}));
      }
    } catch (error) {
      res.json(convertToResponse({ data: {},status: 500,messageType: "ERROR",messageText: someThingWentWrong,}));
    }
});

router.get("/getSellerLikes", async (req, res) => {
  const userData = JSON.parse(req.headers["appcontext"]);
  try {
    const likes = await propertyLikes.find({ sellerId: userData._id });
    if (likes?.length>0) {
      const propertyIds = likes.map(like => like.property);
      const properties = await property.find({ _id: { $in: propertyIds } });
  
      const results = likes.map(like => {
        const likedProperty = properties.find(prop => prop._id.equals(like.property));
        return {
          likeId: like._id,
          userId: like.userId,
          sellerId: like.sellerId,
          userName: like.userName,
          likedAt: like.likedAt,
          property: likedProperty
        };
      });
      res.json( convertToResponse({ data: results, status: 200, messageType: "SUCCESS", messageText: "Here is The Likes",}))
    }else{
    res.json(convertToResponse({ data: {},status: 200,messageType: "SUCCESS",messageText: 'No Data Found',}));
    }
  } catch (error) {
    res.json(convertToResponse({ data: {},status: 500,messageType: "ERROR",messageText: someThingWentWrong,}));
  }
});


router.get("/getPostedProperties", async (req, res) => {
  const user = JSON.parse(req.headers["appcontext"]);
  console.log(user);
  try {
    const postedProperty = await property.find({ userId: user._id });
    if (postedProperty) {
      res.json(convertToResponse({ data: postedProperty, status: 200, messageType: "Success", messageText: "Total Properties",}))
    } else{
      res.json( convertToResponse({ data: {}, status: 200, messageType: "Success",messageText: "No Property Posted Yet",}));
    }
  } catch (error) {
    res.json( convertToResponse({ data: {},status: 500, messageType: "ERROR",messageText: someThingWentWrong}));
  }
});

router.post("/markSoldProperty", async (req, res) => {
  const { propertyId } = req.body;
  try {
    await property.findByIdAndUpdate( { _id: propertyId }, {isSold: true,isActive: false,} );
    return res.json( convertToResponse({data: {}, status: 200, messageType: "Success", messageText: "Property set to be sold",}) );
  } catch (error) {
    return res.json( convertToResponse({ data: {}, status: 500, messageType: "ERROR", messageText: someThingWentWrong,}));
  }
});

router.post("/setActiveProperty", async (req, res) => {
  const { propertyId } = req.body;
  const userData = JSON.parse(req.headers["appcontext"]);

  try {
    const usersD = await user.findById(userData._id);
    const activeProperties = await property.find({ userId: userData._id, isActive: true });
    if(usersD.memberShip.type==='Standard Access' && activeProperties?.length<2){
        await property.findByIdAndUpdate( { _id: propertyId }, {isActive:true} );
    }else if (usersD.memberShip.type==='Premium Access' && activeProperties?.length<10) {
      await property.findByIdAndUpdate( { _id: propertyId }, {isActive:true} );
    }else{
    return res.json( convertToResponse({data: {}, status: 200, messageType: "ERROR", messageText: "Property Active / Post Limit Reached as per your Membership.",}) );
    }
    return res.json( convertToResponse({data: {}, status: 200, messageType: "Success", messageText: "Property set to be Active",}) );
  } catch (error) {
    return res.json( convertToResponse({ data: {}, status: 500, messageType: "ERROR", messageText: someThingWentWrong,}));
  }
});


router.post("/buyPlan", async (req, res) => {
  const user = JSON.parse(req.headers["appcontext"]);
  const { startDate, endDate, type } = req?.body?.mebmerShipDetails;

  try {
    const userData = await User.findById(user._id);

    if (userData && userData?.memberShip?.type === "Standard Access") {
      if (type === "Premium Access") {
        await User.findByIdAndUpdate(userData._id, {
          memberShip: {
            type: "Premium Access",
            startDate: startDate || Date?.now(),
            endDate: endDate,
          },
        });
      }
    }

    return res.json(
      convertToResponse({
        data: {},
        status: 200,
        messageType: "Success",
        messageText: "MemberShip Updated!",
      })
    );
  } catch (error) {
    console.error("Error:", error);

    return res.json(
      convertToResponse({
        data: {},
        status: 500,
        messageType: "ERROR",
        messageText: "Something went wrong",
      })
    );
  }
});



export default router;

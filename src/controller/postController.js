import express from "express";
import multer from "multer";
import addPost from "../model/post.js";
import { authentication, checkRoles } from "../middelware/authenticate.js";
import { convertToResponse, storage } from "../util/util.js";
import { uploadOnCLoudnary } from "../service/cloudnary/cloudnary.js";
import property from "../model/post.js";
import propertyLikes from "../model/propertyLikes.js";
import user from "../model/user.js";

const router = express.Router();
const upload = multer({ storage });



router.post("/addProperty",upload.array("propertyImages"), async (req, res) => {
    const { mainImage,propertyImages,basicInfo,landMarks,amenities,location,} = req?.body || {};
    const { state, city, district, pinCode } = location || {};
    const { propertyType,bedRoom,bathRoom,totalArea,carpetArea,propertyAge,description,title,price,postFor,} = basicInfo || {};
    const { carParking,maintenance,vastuCompliant,gym,park,powerBackup,clubHouse,} = amenities || {};
    const { hospital, atm, bank, railway, metro, airport } = landMarks || {};
    let index = 0;
    const userId = req?.user?._id;
    const propertyImagesUrl = [];

    const retrivedUser = await user.findById(userId);

    const newProperty = new property({
      userId: userId,
      title: title || undefined,
      description: description || undefined,
      propertyType: propertyType || undefined,
      postFor: postFor || undefined,
      price: price || undefined,
      location: {
        city: city,
        state: state,
        district: district,
        pinCode: pinCode,
      },
      basicInfo: {
        bedRooms: bedRoom,
        bathRooms: bathRoom,
        totalArea: totalArea,
        carPetArea: carpetArea,
        ageOfProperty: propertyAge,
      },
      amenities: {
        carParking: carParking || undefined,
        mainMaintenance: maintenance || undefined,
        vastuCompliant: vastuCompliant || undefined,
        powerBackup: powerBackup || undefined,
        park: park || undefined,
        gym: gym || undefined,
        clubHouse: clubHouse || undefined,
      },
      landMarks: {
        hospital: hospital || undefined,
        bank: bank || undefined,
        atm: atm || undefined,
        metro: metro || undefined,
        railway: railway || undefined,
        airport: airport || undefined,
      },
    });

    if (
      retrivedUser?.memberShip.type === "Standard Access" &&
      retrivedUser?.usage?.posts >= 2
    ) {
      return res.status(200).json({ message: "You have Free Account you only add 2 properties" });
    } else if (retrivedUser?.memberShip.type === "seller" &&retrivedUser?.usage?.posts >= 10) {
      return res.status(200).json({message:"You have Seller Membership Account you only add 10 properties",});
    } else if (retrivedUser?.memberShip === "Buyer" &&retrivedUser?.usage?.posts >= 10) {
      return res.status(200).json({message: "You have Buyer Membership Account you only add 2 properties",});
    } else if (retrivedUser?.memberShip === "both" &&retrivedUser?.usage?.posts >= 20) {
      return res.status(200).json({message: "You have Both Membership Account you only add 20 properties",});
    }

    const newPost = await newProperty.save();

    const mainImageUrl = await uploadOnCLoudnary( mainImage,`mainImage`,`propertyId:${newPost._id}`);

    for (const file of propertyImages) {
      const result = await uploadOnCLoudnary(file,`propertyImages${index}`,`propertyId:${newPost._id}`);
      if (result) {
        propertyImagesUrl.push(result);
      }
      index++;
    }

    const existingPost = await addPost.findByIdAndUpdate(newPost._id, {
      mainImage: mainImageUrl,
      propertyImages: propertyImagesUrl,
    });

    await user.findByIdAndUpdate(userId, {
      usage: {
        posts: Number(retrivedUser?.usage?.posts || 0) + 1,
      },
    });
    res.status(200).json({ message: "Post Added please wait for some time if not visible" });
  }
);



router.get("/allPropertys", async (req, res) => {
  const data = JSON.parse(req.headers["appcontext"]);
  try {
    const properties = await property.find({ isActive: true });
    res.json( convertToResponse({data: properties,status: 200,messageType: "Success",messageText: "", }) );
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json( convertToResponse({ data: null, status: 500, messageType: "Error", messageText: "An error occurred while fetching properties.",}));
  }
});



router.post("/getProperty",  async (req, res) => {
  const data = JSON.parse(req.headers["appcontext"]);
  try {
    const p = await property.findById(req?.body?.id);
    if (p) {
      const maskedProperties = p;res.status(200).json(convertToResponse({data: maskedProperties,status: 200,messageType: "Success",messageText: "Property.",}));
      } else {
        res.status(200).json( convertToResponse({data: p,status: 200,messageType: "Success",messageText: "Property.",}));
      }
  } catch (error) {
    res.status(500).json(convertToResponse({data: null,status: 500,messageType: "Error",messageText: "An error occurred while fetching properties.",}));
  }
});



router.post("/likes", authentication,checkRoles() ,async (req, res) => {
  const user = JSON.parse(req.headers["appcontext"]);
  const retrivedproperty = await property.findById(req?.body.id);

  const likes = new propertyLikes({
    userId: user._id,
    property: retrivedproperty,
    sellerId: retrivedproperty?.userId,
    userName: user?.name,
  });

  await likes.save();
  res.json( convertToResponse({data: {},status: 200,messageType: "Success",messageText:" Likes Property SuccessFully Likes Property Added into your Dashboard. ",}));
});



router.post("/deleteProperty", async (req, res) => {
  try {
    const retrievedProperty = await property.findById(req.body.id);

    if (!retrievedProperty.isSold && retrievedProperty.isActive) {
      res.json( convertToResponse({ data: {}, status: 200, messageType: "Warning", messageText: "Please refrain from deleting this property immediately. Instead, mark it as sold first, and then proceed with deletion.",}));
    } else {
      const likes = await propertyLikes.find({property:retrievedProperty._id});
      likes.map(async (l)=>{ await propertyLikes.findByIdAndDelete(l._id) })
      await property.findByIdAndDelete(retrievedProperty._id);

      const updatedUser = await user.findByIdAndUpdate(
        retrievedProperty.userId,
        {
          $inc: { "usage.posts": -1 },
        },
        { new: true }
      );
      res.json( convertToResponse({ data: {}, status: 200, messageType: "Success", messageText: "Property deleted successfully.",}));
    }
  } catch (error) {
    res.status(500).json( convertToResponse({ data: {}, status: 500, messageType: "Error",messageText: "An error occurred while processing your request.",}) );
  }
});

export default router;

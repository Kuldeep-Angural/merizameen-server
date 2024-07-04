
import express from 'express';
import multer from 'multer';
import addPost from '../model/post.js';
import { authentication, checkRoles } from '../middelware/authenticate.js';
import { storage } from '../util/util.js';
import { uploadOnCLoudnary } from '../service/cloudnary/cloudnary.js';
import property from '../model/post.js';

const router = express.Router();
const upload = multer({ storage });
router.post('/testValidated',authentication,checkRoles(),async(req,res)=>{
  res.json("validated user")
})
router.post('/addProperty', authentication,checkRoles(),upload.array('propertyImages'), async (req, res) => {
      let index = 0; 
      const userId = req?.user?._id;
      const propertyImagesUrl = [];
      const { location, mainImage, propertyImages, postFor, description, landMarks, propertyType, amenities, basicInfo, title ,price } = req?.body;
      const { state, city, district, pinCode } = location || {};
      const { hospital, atm, bank, railway, metro, airport } = landMarks || {};
      const { bedRooms, bathRooms, totalArea, carPetArea, ageOfProperty } = basicInfo || {};
      const { carParking, maintenance, vastuCompliant, gym, park, powerBackup, clubHouse } = amenities || {};
          
      const newPostData = new property( {
        userId,
        title,
        description,
        propertyType,
        postFor,
        price,
        location: { state, city, district, pinCode },
        basicInfo: { bedRooms, bathRooms, totalArea, carPetArea, ageOfProperty },
        amenities: {
            carParking: amenities?.carParking || 'N',
            mainMaintenance: amenities?.maintenance || 'N',
            vastuCompliant: amenities?.vastuCompliant || 'N',
            powerBackup: amenities?.powerBackup || 'N',
            park: amenities?.park || 'N',
            gym: amenities?.gym || 'N',
            clubHouse: amenities?.clubHouse || 'N'
        },
        landMarks: { hospital, bank, atm, metro, railway, airport },
    });
     
        const newPost = await newPostData.save();

          const mainImageUrl = await uploadOnCLoudnary(mainImage,`mainImage`,`propertyId:${newPost._id}`);

          for (const file of propertyImages) {
          const result = await uploadOnCLoudnary(file,`propertyImages${index}`,`propertyId:${newPost._id}`);
          if (result) { propertyImagesUrl.push(result); }
               index++; 
          }

          const existingPost = await addPost.findByIdAndUpdate(newPost._id,
            {
              mainImage:mainImageUrl,
              propertyImages:propertyImagesUrl,
            }
          );
     res.status(200).json({ message: 'Post Added please wait for some time if not visible' });
  }
);

export default router;
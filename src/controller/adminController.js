import express from "express";
import user from "../model/user.js";
import { convertToResponse, encrypt } from "../util/util.js";
import property from "../model/post.js";
import feedBack from "../model/feedBack.js";
import { userAlreadyExist } from "../constants/message.js";
import propertyLikes from "../model/propertyLikes.js";
import { uploadOnCLoudnary } from "../service/cloudnary/cloudnary.js";
import callRequest from "../model/callRequest.js";

const router = express.Router();


router.post('/allUsers', async (req, res) => {
    const allUsers = await user.find({ roles: { $nin: ['owner'] } });
    if (allUsers.length > 0) {
        res.json(convertToResponse({ data: allUsers, status: 200, messageType: "SUCCESS", messageText: "Here is The All users of the Merizameen", }))
    } else {
        res.json(convertToResponse({ data: [], status: 200, messageType: "SUCCESS", messageText: "There is No User", }))
    }
})


router.post('/getuser', async (req, res) => {
    const { id } = req.body;
    console.log(req.body);
    const retrievedUser = await user.findById(id);
    if (retrievedUser) {
        res.json(convertToResponse({ data: retrievedUser, status: 200, messageType: "SUCCESS", messageText: "Here is The All users of the Merizameen", }))
    } else {
        res.json(convertToResponse({ data: [], status: 200, messageType: "SUCCESS", messageText: "There is No User", }))
    }
})




router.post('/user/properties', async (req, res) => {
    const { id } = req.body;
    const AllProperties = await property.find({ userId: id });
    if (AllProperties?.length>0 ) {
        res.json(convertToResponse({ data: AllProperties, status: 200, messageType: "SUCCESS", messageText: "Here is The All Properties of the user", }))
    } else {
        res.json(convertToResponse({ data: [], status: 200, messageType: "SUCCESS", messageText: "There is No properties added by this user", }))
    }
})


router.post('/deleteuser', async (req, res) => {
    const { ids } = req.body;

    if (ids?.length > 0) {
        try {
            await Promise.all(ids.map(async (id) => {
                const retrievedUser = await user.findById(id);
                if (retrievedUser) {
                    const usersProperties = await property.find({ userId: id });
                    if (usersProperties.length > 0) {
                        await Promise.all(usersProperties.map(async (element) => {
                            await property.findByIdAndDelete(element._id);
                        }));
                    }
                    await user.findByIdAndDelete(id);
                }
            }));
            res.json(convertToResponse({ data: '', status: 200, messageType: "SUCCESS", messageText: "User Removed Successfully" }));
        } catch (error) {
            res.json(convertToResponse({ data: [], status: 500, messageType: "ERROR", messageText: 'Something went wrong', error }));
        }
    } else {
        res.json(convertToResponse({ data: [], status: 400, messageType: "ERROR", messageText: 'No IDs provided' }));
    }

})



router.post('/updateuser', async (req, res) => {
    const { _id, name, email, mobile, password, memberShip, usage, roles } = req.body;
    console.log(req.body);
    const retrivedUser = await user.findById(_id);
    if (retrivedUser) {
        const newPassword = encrypt(password);
        await user.findByIdAndUpdate(_id, {
            name: name,
            email: email,
            mobile: mobile,
            memberShip: memberShip,
            roles: roles,
            password: newPassword,
        })
        res.json(convertToResponse({ data: {}, status: 200, messageType: "Success", messageText: " User Updated Successfully ! ", }));
    } else {
        res.json(convertToResponse({ data: {}, status: 201, messageType: "error", messageText: "user not found  or some thing went wrong", }));

    }
})



router.post('/deleteproperty', async (req, res) => {
    const { id, } = req.body;

    const prop = await property.findById(id);
    const u = await user.findById(prop.userId);
    if (prop) {

        await propertyLikes.deleteMany({ property: prop._id })
        const propUser = await user.findByIdAndUpdate(prop.userId, {
            usage: {
                posts: Number(u.usage.posts) - 1
            }
        })

        await property.findByIdAndDelete(id);

        res.json(convertToResponse({ data: {}, status: 200, messageType: "Success", messageText: " Property Deleted Successfully ! ", }));
    } else {
        res.json(convertToResponse({ data: {}, status: 201, messageType: "error", messageText: " some thing went wrong", }));

    }
})




router.post('/userJourney', async (req, res) => {
    const { id, } = req.body;

    const allProperties = await property.find({ userId: id }).sort({ postedAt: -1 });

    if (allProperties) {
        const newPropertyWithLikesAndMessages = await Promise.all(
            allProperties.map(async (item) => {
                const [likes, messages] = await Promise.all([
                    propertyLikes.find({ property: item._id }),
                    callRequest.find({ propertyId: item._id })
                ]);
    
                return {
                    ...item.toObject(),
                    likes,
                    messages
                };
            })
        );
    
        res.json(convertToResponse({data: { newPropertyWithLikesAndMessages },status: 200,messageType: "SUCCESS",messageText: "Here are all the properties of the user."}));
    } else {
        res.json(convertToResponse({ data: {}, status: 201, messageType: "SUCCESS", messageText: "No Data Found", }))
    }


});






/* Property Related Routes by Admin */
router.post('/allProperties', async (req, res) => {
    const allProperties = await property.find();
    if (allProperties.length > 0) {
        res.json(convertToResponse({ data: allProperties, status: 200, messageType: "SUCCESS", messageText: "Here is The All users of the Merizameen", }))
    } else {
        res.json(convertToResponse({ data: [], status: 200, messageType: "SUCCESS", messageText: "There is No User", }))
    }
})


router.post('/allFeedbacks', async (req, res) => {
    const allFeedbacks = await feedBack.find();
    if (allFeedbacks.length > 0) {
        res.json(convertToResponse({ data: allFeedbacks, status: 200, messageType: "SUCCESS", messageText: "Here is The All users of the Merizameen", }))
    } else {
        res.json(convertToResponse({ data: [], status: 200, messageType: "SUCCESS", messageText: "There is No User", }))
    }
})





export default router;
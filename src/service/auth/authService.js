
import  jwt  from 'jsonwebtoken';
import  userToken  from'../../model/userToken.js';
import  { invalidRefreshToken, validRefreshToken } from '../../constants/message.js';
import dotenv from "dotenv";
import token from '../../model/userToken.js';
import user from '../../model/user.js';
import { emailService } from '../email/emailService.js';
import { welcomeEmail } from '../../template/welcomeEmailTemplate.js';
dotenv.config();


export const generateTokens = async (user) => {
    try {
        const payload = { _id: user._id, roles: user.roles };
        const accessToken = jwt.sign(
            payload,
            process.env.TOKEN_SECRET,
            { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_TIME }
        );

        const existingToken = await token.findOneAndDelete({ userId: user._id });
        
        await new userToken({ userId: user._id, token: accessToken }).save();
        return { accessToken:accessToken };
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const generateRefreshToken = async (data) => {
    try {
        const payload = { _id: user._id, roles: user.roles };
        const refreshToken = jwt.sign(
            payload,
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_TIME }
        );
     const updated =  await user.findByIdAndUpdate(data._id,{
            name:data.name,
            email:data.email,
            mobile:data.mobile,
            password:data.password,
            refreshToken:refreshToken,
            roles:data.roles,
            isVerified:true,
        })
       await  emailService({to:updated.email,subject:'welcome to merizameen',html:welcomeEmail({name:updated.name,email:updated.email})});
        return refreshToken;
    } catch (error) {
            return error
    }
}

export const verifyRefreshToken = async (refreshToken) => {
    try {
        const privateKey = process.env.REFRESH_TOKEN_SECRET;
        const doc = await token.findOne({ token: refreshToken });
        
        if (!doc) {
            throw { message: invalidRefreshToken };
        } else {
            const tokenDetails = jwt.verify(refreshToken, privateKey);
            return {
                tokenDetails,
                message: validRefreshToken
            };
        }
    } catch (error) {
        throw error;
    }
};

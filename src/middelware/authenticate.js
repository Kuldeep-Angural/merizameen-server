import jwt from 'jsonwebtoken';
import { accessDeniedNotValidToken, accessDenied, notAuthorized } from '../constants/message.js';
import dotenv from 'dotenv';
import { verifyRefreshToken } from '../service/auth/authService.js';
import userToken from '../model/userToken.js';
dotenv.config();


const DEFAULT_ERROR_MESSAGES = {
    accessDenied: 'Access denied. Please log in again.',
    accessDeniedNotValidToken: 'Invalid token. Please log in again.',
    tokenExpired: 'Session expired. Please log in again.',
};


export const authentication = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message:accessDenied });
    }

    const token = authHeader.substring('Bearer '.length);
    if (!token) {
        return res.status(401).json({ message: accessDenied });
    }

    try {
        const tokenDetails = jwt.verify(token, process.env.TOKEN_SECRET);
        const dbUserToken = await userToken.findOne({ token: token });
        
        if (dbUserToken.userId.toString() !== tokenDetails._id) {
            return res.status(403).json({ message: 'Session logged out' });
        }

        req.user = tokenDetails;
        const isTokenExpired = tokenDetails.exp * 1000 < Date.now();
        if (isTokenExpired) {
            return res.status(403).json({ message: DEFAULT_ERROR_MESSAGES.tokenExpired });
        }

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(403).json({ message: DEFAULT_ERROR_MESSAGES.tokenExpired });
        }
        res.status(403).json({ message: accessDeniedNotValidToken });
    }
};

export const checkRoles = () => {
    return (req, res, next) => {
        const user = req?.user;
        if (user && (user.roles[0]==='user' || user.roles[0] ==='owner')) {
            next();
        } else {
            console.log(notAuthorized);
            res.status(403).json({ error: true, message: notAuthorized });
        }
    };
};



export const isAdmin = () => {
    return (req, res, next) => {
        const user = req?.user;
        if (user && user.roles[0]==='owner') {
            next();
        } else {
            res.status(403).json({ error: true, message: notAuthorized  });
        }
    };
};

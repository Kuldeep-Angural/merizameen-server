import mongoose from "mongoose";
import { userAlreadyExist } from "../constants/message.js";
import user from "../model/user.js";
import { encrypt } from "../util/util.js";
import dotenv from 'dotenv';
import winston from 'winston'; 
dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});


const createUser = async ({ name, email, mobile, password }) => {
    const uri = process.env.MONGO_DB_URI;
    await mongoose.connect(uri,{
        bufferCommands: false, 
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, 
        socketTimeoutMS: 45000, 
      });
    try {
      const existingUser = await user.findOne({ email }).exec(); 
      if (existingUser) {
        return logger.error(userAlreadyExist);
      } else {
        const newPassword = encrypt(password);
        const newUser = new user({ name, email, mobile,roles:["owner"], password: newPassword });
        await newUser.save();
        logger.info("User created");
      }
    } catch (error) {
      if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
        logger.error('Timeout error: Operation timed out');
      } else {
        logger.error(`Error creating user: ${error.message}`);
      }
    }
  };
  

const validateArgsAndCreateUser = () => {
  if (process.argv.length !== 6) {
    console.error('Usage: npm run app:db:create-master-user NAME EMAIL MOBILE PASSWORD');
    process.exit(1);
  }

  const [name, email, mobile, password] = process.argv.slice(2);
  if (name.length > 4 && email.includes('@') && email.includes('.com') && mobile.length === 10 && password.length > 6) {
    createUser({ name, email, mobile, password });
  } else {
    console.error('Validation Error:');
    if (name.length <= 4) {
      console.error("The length of the name should be greater than 4");
    }
    if (!email.includes('@') || !email.includes('.com')) {
      console.error("The Email should contain '@' and '.com'");
    }
    if (mobile.length !== 10) {
      console.error("The length of the Mobile Number should be equal to 10");
    }
    if (password.length <= 6) {
      console.error("The length of the Password should be greater than 6");
    }
    process.exit(1);
  }
};

validateArgsAndCreateUser();

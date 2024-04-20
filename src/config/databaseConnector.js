import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

const databaseConnector = async () => {
  try {
    const uri = process.env.MONGO_DB_URI;
    await mongoose.connect(uri,{
      bufferCommands: false, 
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000, 
    });
    console.log("Database connected successfully😊",);
    console.log("Database URI:", uri);
  } catch (error) {
    console.error("MongoDB connection error:❌", error);
    process.exit(1);
  }
};

export default databaseConnector;

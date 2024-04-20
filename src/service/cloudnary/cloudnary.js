import { v2 as cloudinary } from 'cloudinary';          
import fs from'fs';


cloudinary.config({ 
  cloud_name: process.env.CLOUDNARY_NAME, 
  api_key: process.env.CLOUDNARY_API_KEY, 
  api_secret: process.env.CLOUDNARY_API_SECRET 
});


export const uploadOnCLoudnary = async (localFilePath,filename,folderName) => {
    try {
        if (!localFilePath) return null 
           const response =await cloudinary.uploader.upload(localFilePath,{
                public_id: filename,
                folder:folderName,
                resource_type:'auto',
            });
            return response.url
    } catch (error) {
        return null;
    }
}

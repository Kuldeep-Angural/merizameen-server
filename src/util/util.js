import CryptoJS from 'crypto-js';
import multer from 'multer';



export const encrypt = (text) => {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
};

export const decrypt = (data) => {
  return CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
};

export const getExtensionFromMimeType = (mimeType)=> {
  if (!mimeType) return false;
  return mime.extension(mimeType);
};

export const imageDataValidator = (fileData) => {
  return fileData && fileData.filename && fileData.filename.mimeType && fileData.filename.mimeType.match(/^image\//);
};


export const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"./public/temp");
    },
    filename:function(req,file,cb){
        cb(null,file.originalname)
    }
})

export const  generateRandomNumber = () => {
  return Math.floor(Math.random() * 900000) + 100000;
}

export const  getCurrentTime = (incremented) =>  {
  const now = new Date();
  incremented && now.setMinutes(now.getMinutes() + incremented);
  const options = {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return now.toLocaleString('en-IN', options);
}


export const convertToResponse = ({data,messageText , messageType , status}) => {
  return  {
        data:data,
        message:{ messageText:messageText,messageType:messageType, },
        status:status

    }
    ;
}

export const  generatePassword = (length) =>{
  const letters = 5;
  const numbers = 3;
  const either = 2;
  const chars = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', // letters
    '0123456789', // numbers
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', // either
  ];

  return [letters, numbers, either].map((len, i) =>{
    return Array(len).fill(chars[i]).map((x) => {
      return x[Math.floor(Math.random() * x.length)];
    }).join('');
  }).concat().join('').split('').sort(() => {
    return 0.5 - Math.random();
  }).join('')
};
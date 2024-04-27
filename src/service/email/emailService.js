import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  secure: false, 
  auth: {
    user: process.env.ACC_EMAIL,
    pass: process.env.GOOGLE_APP_EMAIL_PASSWORD,
  },
});

export const emailService = async ({ to, subject, text, html }) => {
    console.info(text);
  try {
    const info = await transporter.sendMail({
      from: process.env.ACC_EMAIL, 
      to:to,
      subject:subject||"", 
      text:text||"", 
      html:html||`<b>${text}</b>`, 
    });

    return info;
  } catch (error) {
    return console.error(error);
  }
};

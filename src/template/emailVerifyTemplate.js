export const veriFyOtp = (otp) => {
  return(`
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4a90e2; font-size: 2em;">Welcome to Merizameen</h1>
      </div>
      <div style="margin-bottom: 20px;">
        <p>Hello there,</p>
        <p>
          Please verify your email. Here is your one-time passcode to
          verify your email. It will expire in 30 minutes.<br></br>
          ${otp}
        </p>
        <p>Stay connected and explore all that we have to offer!</p>
      </div>
     <div style="text-align: center;">
      <p style="color: #555;">
        Best regards,<br>
        <a href="http://navv.info" style="color: #007BFF; text-decoration: none;">Merizameen/navv.info</a>
      </p>
       <p style="color: #555; font-size: 0.9em;">
          Pathankot, Punjab, India 
        </p>
    </div>
    </div>
  </body>
`)
};

export const feedBackTemplate = ({ userName, email, feedBack }) => {
  return (`
   <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #4a90e2; font-size: 2em;">Callback Request </h1>
    </div>
    <div style="margin-bottom: 20px;">
      <p>Hello Kuldeep( MerZameen's Owner)</p>
      <p>
         You received General Feedback  from  <br/>
         ${userName} 
        <br/>
        Please response as soon as possible.
      </p>
      <p>
        <div> Requested by : <b>${userName}</b> , email : <b>${email} </b>, 
        <br/>

        feedBack : <b>${feedBack}</b> </div>
        
      </p>
    </div>
    <div style="text-align: center;">
      <p style="color: #555;">
        Best regards,<br>
        <a href="https://merizameen.vercel.app/" style="color: #007BFF; text-decoration: none;">Merizameen Team</a>
      </p>
      <p style="color: #555; font-size: 0.9em;">
        Pathankot, Punjab, India
      </p>
    </div>
  </div>
</body>
  
  `)
};
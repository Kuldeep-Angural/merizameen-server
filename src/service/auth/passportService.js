import dotenv from "dotenv";
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { generateRefreshToken, generateTokens } from "./authService.js";
import user from "../../model/user.js";
import { encrypt } from "../../util/util.js";
dotenv.config();

  
passport.use(new GoogleStrategy.Strategy(
    {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      scope:['profile','email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await user.findOne({ email:profile?.emails[0]?.value  });
        if (!existingUser) {
            const newPassword = encrypt(profile.displayName+'@1234');
            const newUser = new user({
                googleId:profile.id,
                name:profile.displayName,
                email:profile.emails[0].value,
                password:newPassword,
                createdAt: Date.now(),
                isVerified: true,
                isGoogleUser:true,
                refreshToken:refreshToken,
                profilePic:profile.photos[0].value,
              });

             const savedUser = await newUser.save();
             const { accessToken } = await generateTokens(savedUser);
             const userData = btoa(
                `${savedUser._id}:${savedUser.name}:${savedUser.email}:${savedUser.mobile}:${savedUser.roles}`
              );
             return done(null, {accessToken:accessToken,userData:userData,profilePic:savedUser.profilePic});
        }
        else{
            if (existingUser.isGoogleUser) {
                const { accessToken } = await generateTokens(existingUser);
                const userData = btoa(
                    `${existingUser._id}:${existingUser.name}:${existingUser.email}:${existingUser.mobile}:${existingUser.roles}`
                  );
                 return done(null, {accessToken:accessToken,userData:userData,profilePic:existingUser.profilePic});
            }else{
              return done(null, null);
            }
        }
      } catch (error) {
        return done(error, null);
        
      }
    }
  ));

passport.serializeUser((user, done) => {
  // Serialize user.id or whatever unique identifier you have to be stored in the session
  done(null, user);
});

passport.deserializeUser((user, done) => {
  // Deserialize user.id or the unique identifier to retrieve the user from the session
  done(null, user);
});





export default passport;
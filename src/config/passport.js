import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import userRepo from '../repository/user.repo.js';


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;

            let user = await userRepo.findByEmail(email);

            if (!user) {
                user = await userRepo.create({
                    email,
                    name: profile.displayName,
                    avatar: profile.photos[0]?.value
                });
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));
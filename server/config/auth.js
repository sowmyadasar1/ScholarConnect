/**
 * Passport OAuth Strategies
 *
 * Configures GitHub and Google OAuth2 flows.
 * Each strategy finds-or-creates a user in our DB,
 * then passes the user object to the callback.
 */

const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const UserModel = require('../models/user.model');

// ----------- GitHub OAuth -----------

if (process.env.GITHUB_CLIENT_ID) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email', 'read:user', 'repo'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log(`[GitHub Auth] Verify callback triggered for profile: ${profile.id} (${profile.username})`);
          const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
          let user = await UserModel.findByGithubId(profile.id);

          if (!user) {
            console.log(`[GitHub Auth] User not found by GitHub ID, checking email: ${email}`);
            user = await UserModel.findByEmail(email);
            if (user) {
              console.log(`[GitHub Auth] Linking existing user ${user.id} to GitHub ID ${profile.id}`);
              await UserModel.linkGithub(user.id, profile.id, accessToken);
            } else {
              console.log(`[GitHub Auth] Creating new user for GitHub profile: ${email}`);
              const userId = await UserModel.create({
                email,
                name: profile.displayName || profile.username,
                avatar_url: profile.photos?.[0]?.value || null,
                github_id: profile.id,
                github_access_token: accessToken,
              });
              user = await UserModel.findById(userId);
            }
          } else {
            console.log(`[GitHub Auth] Updating token for existing user ${user.id}`);
            await UserModel.updateGithubToken(user.id, accessToken);
          }
          console.log(`[GitHub Auth] Authentication successful for: ${email}`);
          return done(null, user);
        } catch (err) {
          console.error('[GitHub Auth] Strategy Verify Error:', err.message);
          return done(err, null);
        }
      }
    )
  );
}

// ----------- Google OAuth -----------

if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          let user = await UserModel.findByGoogleId(profile.id);

          if (!user) {
            user = await UserModel.findByEmail(email);
            if (user) {
              await UserModel.linkGoogle(user.id, profile.id);
            } else {
              const userId = await UserModel.create({
                email,
                name: profile.displayName,
                avatar_url: profile.photos?.[0]?.value || null,
                google_id: profile.id,
              });
              user = await UserModel.findById(userId);
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

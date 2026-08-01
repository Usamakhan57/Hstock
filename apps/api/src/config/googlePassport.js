import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env.js';
import { logger } from './logger.js';

let configured = false;

/**
 * Configure Passport Google OAuth strategy once.
 * No-op when GOOGLE_CLIENT_ID / SECRET are missing (feature stays disabled).
 */
export function configureGooglePassport() {
  if (configured) return passport;
  configured = true;

  if (!env.googleOAuthConfigured) {
    logger.warn('Google OAuth is not configured — /auth/google routes will return 503');
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.googleCallbackUrl,
      },
      (accessToken, refreshToken, profile, done) => {
        // Tokens from Google are not persisted — we only need profile for account linking.
        done(null, {
          id: profile.id,
          googleId: profile.id,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
          name: profile.name,
          photos: profile.photos,
          picture: profile.photos?.[0]?.value,
        });
      },
    ),
  );

  // Stateless OAuth — serialize/deserialize unused but required by passport init
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  logger.info('Google OAuth strategy configured', { callbackURL: env.googleCallbackUrl });
  return passport;
}

export default { configureGooglePassport, passport };

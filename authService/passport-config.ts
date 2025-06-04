import passport from 'passport';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import axios from 'axios';
import { IUser } from './src/models/user_model'; // Keep just for the interface

// Error constants
const AUTH_ERRORS = {
  EMAIL_EXISTS: 'email_exists'
};

// Create a userService for API calls
const userServiceBaseUrl = process.env.USER_SERVICE_URL || 'http://users-service:4001';
console.log(`Configuring passport with User Service URL: ${userServiceBaseUrl}`);

// Make sure the callback URLs are absolute
const baseUrl = process.env.ENV_URL || 'http://localhost:4002';
const githubCallbackUrl = process.env.GITHUB_CALLBACK_URL?.startsWith('http') 
  ? process.env.GITHUB_CALLBACK_URL 
  : `${baseUrl}${process.env.GITHUB_CALLBACK_URL}`;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL?.startsWith('http') 
  ? process.env.GOOGLE_CALLBACK_URL 
  : `${baseUrl}${process.env.GOOGLE_CALLBACK_URL}`;

console.log(`GitHub callback URL: ${githubCallbackUrl}`);
console.log(`Google callback URL: ${googleCallbackUrl}`);

// Add the internal service header to all requests
const userServiceApi = axios.create({
  baseURL: userServiceBaseUrl,
  headers: {
    'X-Internal-Service': 'true',
    'Content-Type': 'application/json'
  }
});

// Helper function to log axios errors
const logAxiosError = (error: any) => {
  if (axios.isAxiosError(error)) {
    console.error('Axios error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }
    });
  } else {
    console.error('Non-axios error:', error);
  }
};

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: githubCallbackUrl,
      scope: ['user:email'] 
    },
    async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: (err: any, user?: any) => void) => {
      try {
        console.log('GitHub auth callback started for profile:', profile.id);
        // Fetch the user's email addresses
        const emails = profile.emails || [];
        const primaryEmail = emails[0]?.value;
        console.log('Primary email from GitHub:', primaryEmail);

        if (primaryEmail) {
          try {
            // Check if user already exists with this email
            console.log(`Checking if email ${primaryEmail} exists`);
            const response = await userServiceApi.get(`/findByEmail/${primaryEmail}`);
            const existingUser = response.data;
            
            if (existingUser) {
              console.log('User exists with email:', primaryEmail);
              // Check if user exists but doesn't have a githubId
              if (!existingUser.githubId) {
                console.log('User exists but has no githubId');
                // User exists with email but hasn't used GitHub login before
                return done(new Error(AUTH_ERRORS.EMAIL_EXISTS), false);
              }
              
              // User exists and has used GitHub login before - continue with login
              console.log('Updating existing user with githubId');
              try {
                const updatedUserResponse = await userServiceApi.put(`/${existingUser._id}`, {
                  githubId: profile.id
                });
                return done(null, updatedUserResponse.data);
              } catch (updateError) {
                logAxiosError(updateError);
                return done(updateError, null);
              }
            }
          } catch (error) {
            // User not found with this email, which is fine for new users
            if (axios.isAxiosError(error) && error.response?.status !== 404) {
              logAxiosError(error);
              return done(error, null);
            }
            console.log('Email not found, will try to create new user');
          }
        }
        
        // Try to find a user with this githubId
        try {
          console.log(`Looking for user with githubId: ${profile.id}`);
          const response = await userServiceApi.get(`/findByGithubId/${profile.id}`);
          console.log('Found user with githubId');
          return done(null, response.data);
        } catch (error) {
          // User not found with this githubId, create a new one
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            try {
              // Create a new user
              console.log('Creating new user with GitHub profile');
              const newUser = {
                githubId: profile.id,
                username: profile.username || profile.displayName || 'github_user',
                email: primaryEmail,
                authProvider: 'github' as const
              };
              console.log('New user data:', newUser);
              
              const newUserResponse = await userServiceApi.post('/add', newUser);
              console.log('User created successfully');
              return done(null, newUserResponse.data);
            } catch (createError) {
              console.error('Error creating user with GitHub profile:');
              logAxiosError(createError);
              return done(createError, null);
            }
          } else {
            logAxiosError(error);
            return done(error, null);
          }
        }
      } catch (err) {
        console.error('General error in GitHub strategy:');
        logAxiosError(err);
        return done(err, null);
      }
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: googleCallbackUrl
    },
    async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: (err: any, user?: any) => void) => {
      try {
        console.log('Google auth callback started for profile:', profile.id);
        const email = profile.emails?.[0].value;
        console.log('Email from Google profile:', email);
        
        if (email) {
          try {
            // Check if user already exists with this email
            console.log(`Checking if email ${email} exists`);
            const response = await userServiceApi.get(`/findByEmail/${email}`);
            const existingUser = response.data;
  
            if (existingUser) {
              console.log('User exists with email:', email);
              // Check if user exists but doesn't have a googleId
              if (!existingUser.googleId) {
                console.log('User exists but has no googleId');
                // User exists with email but hasn't used Google login before
                return done(new Error(AUTH_ERRORS.EMAIL_EXISTS), false);
              }
              
              // User exists and has used Google login before - continue with login
              console.log('Updating existing user with googleId');
              try {
                const updatedUserResponse = await userServiceApi.put(`/${existingUser._id}`, {
                  googleId: profile.id
                });
                return done(null, updatedUserResponse.data);
              } catch (updateError) {
                logAxiosError(updateError);
                return done(updateError, null);
              }
            }
          } catch (error) {
            // User not found with this email, which is fine for new users
            if (axios.isAxiosError(error) && error.response?.status !== 404) {
              logAxiosError(error);
              return done(error, null);
            }
            console.log('Email not found, will try to create new user');
          }
        }
        
        // Try to find a user with this googleId
        try {
          console.log(`Looking for user with googleId: ${profile.id}`);
          const response = await userServiceApi.get(`/findByGoogleId/${profile.id}`);
          console.log('Found user with googleId');
          return done(null, response.data);
        } catch (error) {
          // User not found with this googleId, create a new one
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            try {
              // Create a new user
              console.log('Creating new user with Google profile');
              const newUser = {
                googleId: profile.id,
                username: profile.name?.givenName || profile.displayName || 'google_user',
                email: email,
                authProvider: 'google' as const
              };
              console.log('New user data:', newUser);
              
              const newUserResponse = await userServiceApi.post('/add', newUser);
              console.log('User created successfully');
              return done(null, newUserResponse.data);
            } catch (createError) {
              console.error('Error creating user with Google profile:');
              logAxiosError(createError);
              return done(createError, null);
            }
          } else {
            logAxiosError(error);
            return done(error, null);
          }
        }
      } catch (err) {
        console.error('General error in Google strategy:');
        logAxiosError(err);
        return done(err, null);
      }
    }
  )
);

export default passport;
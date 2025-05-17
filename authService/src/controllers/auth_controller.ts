import { NextFunction, Request, Response } from 'express';
import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';
import axios from 'axios';

// Get the User Service URL from environment variables or use a default
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://users-service:4001';

// Create axios instance with default headers for internal service communication
const userServiceClient = axios.create({
    baseURL: USER_SERVICE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'true'
    }
});

interface TokenPayload {
    userId: string;
    email: string;
    nonce: string;
}

interface User {
    _id: string;
    username: string;
    email: string;
    role?: string;
    avatarUrl?: string;
    tokens?: string[];
    password?: string;
    createdAt?: Date;
    googleId?: string;
}

const generateToken = (
    userId: string, 
    email: string, 
    secret: Secret, 
    expiresIn: number | string
): string => {
    if (!secret) throw new Error('JWT secret is not defined');
    
    const payload: TokenPayload = {
        userId,
        email,
        nonce: Math.random().toString()
    };

    const signOptions: SignOptions = {
        expiresIn: expiresIn as jwt.SignOptions['expiresIn']
    };

    return jwt.sign(payload, secret, signOptions);
};

const register = async (req: Request, res: Response) => {
    const { username, email, password, role } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
    }
   
    try {
        const response = await userServiceClient.post('/add', { username, email, password, role });
        return res.status(response.status).json(response.data);

    } catch (error: any) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            console.error('Error connecting to user service:', error.request);
            return res.status(503).json({ message: "User service unavailable" });
        } else {
            console.error('Error creating user:', error.message);
            return res.status(500).json({ message: "Error during registration", error: error.message });
        }
    }
};

// Helper function to get user with password by email
const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
        const response = await userServiceClient.get(`/findByEmail/${email}?includePassword=true`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return null;
        }
        throw error;
    }
};

// Helper function to save user's refresh token
const saveUserToken = async (userId: string, token: string): Promise<void> => {
    try {
        await userServiceClient.put(`/${userId}/token`, { token });
    } catch (error) {
        console.error('Error saving user token:', error);
        throw error;
    }
};

// Helper function to validate password
const validatePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    try {
        const response = await userServiceClient.post('/validatePassword', { 
            password, 
            hashedPassword 
        });
        return response.data.valid;
    } catch (error) {
        console.error('Error validating password:', error);
        return false;
    }
};

// Login a user - return a token
const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    
    try {
        // Get user by email
        const user = await getUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({ message: 'Wrong email or password' });
        }
        
        // Validate password
        const isValid = await validatePassword(password, user.password || '');
        
        if (!isValid) {
            return res.status(401).json({ message: 'Wrong email or password' });
        }
        
        // Update last login and auth provider
        await userServiceClient.put(`/${user._id}`, {
            lastLogin: new Date(),
            authProvider: 'local'
        });
        
        // Generate tokens
        const token = generateToken(
            user._id, 
            user.email, 
            process.env.JWT_KEY as Secret, 
            process.env.JWT_EXPIRES_IN as string
        );
        
        const refreshToken = generateToken(
            user._id, 
            user.email, 
            process.env.JWT_REFRESH_KEY as Secret, 
            process.env.JWT_REFRESH_EXPIRES_IN as string
        );
        
        // Save refresh token
        await saveUserToken(user._id, refreshToken);
        
        // Set cookies
        res.cookie('accessToken', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
        
        res.cookie('refreshToken', refreshToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
        
        // Return user data
        res.status(200).json({
            message: 'Auth successful',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                authProvider: 'local',
                lastLogin: new Date()
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Login External users - after login with google or github for tokens
const loginExternal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as User;
        if (!user) {
            return res.redirect(`/oauth/callback?error=auth_failed`);
        }

        // Determine auth provider based on OAuth source
        const authProvider = user.googleId ? 'google' : 'github';

        // Update last login and auth provider
        await userServiceClient.put(`/${user._id}`, {
            lastLogin: new Date(),
            authProvider
        });

        // Generate tokens
        const token = generateToken(
            user._id, 
            user.email, 
            process.env.JWT_KEY as Secret, 
            process.env.JWT_EXPIRES_IN as string
        );
        
        const refreshToken = generateToken(
            user._id, 
            user.email, 
            process.env.JWT_REFRESH_KEY as Secret, 
            process.env.JWT_REFRESH_EXPIRES_IN as string
        );
      
        // Set cookies with debug logging
        res.cookie('accessToken', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax',
            path: '/',
        });
        
        res.cookie('refreshToken', refreshToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax',
            path: '/',
        });
        
        await saveUserToken(user._id, refreshToken);
        console.log('Cookies set, redirecting to:', `/oauth/callback`);
      
        // Redirect to the correct frontend route
        res.redirect(`/oauth/callback?userId=${user._id}&username=${encodeURIComponent(user.username)}&email=${user.email}&role=${user.role}&createdAt=${user.createdAt}&authProvider=${authProvider}&lastLogin=${new Date()}`);
    } catch (error: any) {
        console.error('Error in external login:', error);
        return res.redirect(`/oauth/callback?error=auth_failed`);
    }
};

// Helper function to verify and remove refresh token
const removeRefreshToken = async (userId: string, refreshToken: string): Promise<boolean> => {
    try {
        await userServiceClient.delete(`/${userId}/token/${refreshToken}`);
        return true;
    } catch (error) {
        console.error('Error removing refresh token:', error);
        return false;
    }
};

// Logout a user - remove refreshToken from user
const logout = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
        return res.status(401).json({ message: 'Auth failed: refresh token not included in headers' });
    }
    
    try {
        // Verify the refresh token with the correct key
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY as string) as TokenPayload;
        
        // Remove token from user
        const success = await removeRefreshToken(decoded.userId, refreshToken);
        
        if (!success) {
            return res.status(401).json({ message: 'Invalid request: could not remove token' });
        }
        
        // Clear cookies with the SAME options they were set with
        console.log('Clearing cookies with path=/');
        res.clearCookie('accessToken', { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
        
        res.clearCookie('refreshToken', { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
        
        return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error during logout:', error);
        return res.status(401).json({ message: 'Auth failed: invalid token' });
    }
};

type Payload = {
    userId: string;
    email: string;
};

// Authentification middleware - check if token is valid
export const authentification = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken as string;
    
    if (!token) {
        return res.status(401).json({ message: 'Auth failed: No credentials were given' });
    }
    
    try {
        jwt.verify(token, process.env.JWT_KEY as string, (err, payload) => {
            if (err) {
                return res.status(401).json({ message: 'Auth failed' });
            }
            req.params.userId = (payload as Payload).userId;
            next();
        });
    } catch (error) {
        return res.status(401).json({ message: 'Auth failed' });
    }
};

// Helper function to update user token
const updateUserToken = async (userId: string, oldToken: string, newToken: string): Promise<boolean> => {
    try {
        await userServiceClient.put(`/${userId}/updateToken`, { 
            oldToken, 
            newToken 
        });
        return true;
    } catch (error) {
        console.error('Error updating user token:', error);
        return false;
    }
};

// Refresh token - return a new token
const refreshToken = async (req: Request, res: Response, next: any) => {
    const refreshToken = req.cookies.refreshToken as string;
    
    if (!refreshToken) {
        return res.status(401).json({ message: 'Auth failed: No refresh token provided' });
    }
    
    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY as string) as TokenPayload;
        
        // Get user by ID to verify token exists
        const response = await userServiceClient.get(`/${decoded.userId}/verifyToken/${refreshToken}`);
        const validToken = response.data.valid;
        
        if (!validToken) {
            return res.status(401).json({ message: 'Invalid request: Refresh token not found' });
        }
        
        // Generate new tokens
        const newToken = generateToken(
            decoded.userId, 
            decoded.email, 
            process.env.JWT_KEY as Secret, 
            process.env.JWT_EXPIRES_IN as string
        );
        
        const newRefreshToken = generateToken(
            decoded.userId, 
            decoded.email, 
            process.env.JWT_REFRESH_KEY as Secret, 
            process.env.JWT_REFRESH_EXPIRES_IN as string
        );
        
        // Update token in user document
        const success = await updateUserToken(decoded.userId, refreshToken, newRefreshToken);
        
        if (!success) {
            return res.status(500).json({ message: 'Server error: Failed to update token' });
        }
        
        // Set new cookies
        res.cookie('accessToken', newToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
        
        res.cookie('refreshToken', newRefreshToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
        
        return res.status(200).json({ message: 'Auth successful' });
    } catch (error) {
        console.error('Error refreshing token:', error);
        return res.status(401).json({ message: 'Auth failed' });
    }
};

// Test endpoint to verify authentication
const test = async (req: Request, res: Response) => {
    res.status(200).json({ message: "Auth successful", userId: req.params.userId });
};

// Get the current user based on the JWT token
const getCurrentUser = async (req: Request, res: Response) => {
    try {
        // Use the userId from authentication middleware
        const userId = req.params.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        
        // Make HTTP request to user service to get user data
        try {
            const response = await userServiceClient.get(`/${userId}`);
            return res.status(200).json(response.data);
        } catch (error: any) {
            if (error.response) {
                return res.status(error.response.status).json(error.response.data);
            } else {
                console.error('Error fetching current user:', error);
                return res.status(500).json({ message: 'Error fetching user details' });
            }
        }
    } catch (error: any) {
        console.error('Error in getCurrentUser:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


export default { 
    register, 
    login, 
    loginExternal, 
    logout, 
    refreshToken, 
    test, 
    getCurrentUser, 
    authentification 
};
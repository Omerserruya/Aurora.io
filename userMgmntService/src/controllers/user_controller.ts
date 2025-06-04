import userModel from "../models/user_model";
import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import multer from "multer";
import { authentification } from "@shared/authMiddleware";

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  dest: 'uploads/', // Destination folder for uploads
});

// Helper function to create a new user
const createUserHelper = async (username: string, email: string, password: string, role?: string) => {
  const existingEmail = await userModel.findOne({ email });

  if (existingEmail ) {
    throw new Error("User already exists");
  }

  const encryptedPassword = await bcrypt.hash(password, 10);
  const lowerEmail = email.toLowerCase();

  const user = new userModel({
    username,
    email: lowerEmail,
    password: encryptedPassword,
    role,
  });

  await user.save();
  return user;
};

export const addUser = async (req: Request, res: Response): Promise<void> => {
  // Check if this is an internal service request
  const isInternalServiceRequest = req.headers['x-internal-service'] === 'true';
  console.log('Adding user with data:', req.body);
  console.log('Internal service request:', isInternalServiceRequest);

  try {
    // Extract user data from request body
    const { username, email, password, googleId, githubId, role, authProvider } = req.body;

    // Basic validation for required fields
    if (!username || !email) {
      res.status(400).json({ message: 'Username and email are required' });
      return;
    }
    
    // For non-internal requests, require password (OAuth requests come from auth service)
    if (!isInternalServiceRequest && !password) {
      res.status(400).json({ message: 'Password is required for direct registration' });
      return;
    }
    
    // Check for at least one authentication method
    if (!password && !googleId && !githubId) {
      res.status(400).json({ message: 'At least one authentication method is required (password, googleId, or githubId)' });
      return;
    }

    // Check if user already exists with this email
    const existingEmailUser = await userModel.findOne({ email });
    if (existingEmailUser) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    // Check for existing OAuth accounts if provided
    if (googleId) {
      const existingGoogleUser = await userModel.findOne({ googleId });
      if (existingGoogleUser) {
        res.status(409).json({ message: 'Google account already linked to another user' });
        return;
      }
    }

    if (githubId) {
      const existingGithubUser = await userModel.findOne({ githubId });
      if (existingGithubUser) {
        res.status(409).json({ message: 'GitHub account already linked to another user' });
        return;
      }
    }

    // Create new user object
    const userData: any = {
      username,
      email
    };

    // Add password if provided (for regular login)
    if (password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(password, salt);
    }

    // Add OAuth IDs if provided
    if (googleId) userData.googleId = googleId;
    if (githubId) userData.githubId = githubId;
    
    // Add authProvider if provided
    if (authProvider) userData.authProvider = authProvider;
    
    // Add role if provided and this is an internal request
    if (role && isInternalServiceRequest) {
      userData.role = role;
    }

    // Create and save new user
    const newUser = new userModel(userData);
    const savedUser = await newUser.save();
    
    res.status(201).json(savedUser);
  } catch (error: any) {
    console.error('Error adding user:', error);
    res.status(500).json({ 
      message: 'Failed to add user',
      error: error.message
    });
  }
};

// Function to fetch all users 
const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userModel.find();
    res.status(200).json(users);
    return;
  } catch (error: any) {
    res.status(404).json({ message: "Error fetching users", error: error.message });
    return;
  }
};

// Function to fetch a user by ID
const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid user ID format" });
      return;
    }
    const user = await userModel.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(404).json({ message: "Error fetching user", error: error.message });
    return;
  }
};

// Function to update a user (self or admin access)
const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email, password, role, avatarUrl, googleId, githubId } = req.body;
  
  try {
    // Find the user by ID
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if this is an internal service request
    const isInternalServiceRequest = req.headers['x-internal-service'] === 'true';
    
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }
    
    // Prepare the update object
    const updateData: any = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;
    
    // If password is provided in the request, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Add OAuth IDs if provided (only for internal requests)
    if (isInternalServiceRequest) {
      if (googleId) updateData.googleId = googleId;
      if (githubId) updateData.githubId = githubId;
    }

    if (role) {
      updateData.role = role;
    }
    
    // Update the user with the new data
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user" });
    }
    
    return res.status(200).json(updatedUser);
  } catch (error: any) {
    return res.status(500).json({ 
      message: "Error updating user", 
      error: error.message 
    });
  }
};

// Function to delete a user (self or admin access)
const deleteUser = async (req: Request, res: Response) => {
  const { id: userToDeleteId, userId: adminUserId } = req.params;
  console.log('Deleting user with ID:', userToDeleteId, adminUserId);

  try {
    const adminUser = await userModel.findById(adminUserId);
    if (!mongoose.Types.ObjectId.isValid(adminUserId)) {
      res.status(400).json({ message: "Invalid user ID format" });
      return;
    }

    const userToDelete = await userModel.findById(userToDeleteId);
    if (!userToDelete) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    // Check if the user has admin privileges
    console.log('user:', adminUser);
    if (adminUser?.role !== "admin") {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    await userToDelete.deleteOne();
    console.log('User deleted successfully:', userToDeleteId);
    res.status(200).send();
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

// Add this function to handle avatar uploads
const uploadAvatar = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Check if user exists
    const user = await userModel.findById(id);
    console.debug('Uploading avatar for user:', user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Handle file upload
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // If a previous avatar exists, delete it
    if (user.avatarUrl) {
      try {
        const uploadsDir = process.env.PROFILE_UPLOAD_PATH || '/app/uploads/users';
        const previousPath = path.join(uploadsDir, path.basename(user.avatarUrl));
        if (fs.existsSync(previousPath)) {
          fs.unlinkSync(previousPath);
        }
      } catch (error) {
        console.error('Error deleting previous avatar:', error);
        // Continue with the upload even if delete fails
      }
    }
    
    // Set the new avatar URL - this should match Nginx configuration
    const avatarUrl = `/uploads/users/${req.file.filename}`;
    
    // Update user with new avatar URL
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { avatarUrl },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user avatar" });
    }

    // Return the full user object with the new avatar URL
    // Note: With Nginx, we don't need to include protocol and host as it will be handled by the reverse proxy
    return res.status(200).json({
      ...updatedUser.toObject(),
      avatarUrl
    });
  } catch (error: any) {
    console.error('Error in uploadAvatar:', error);
    return res.status(500).json({ 
      message: "Error uploading avatar", 
      error: error.message 
    });
  }
};

// Find user by email - for authentication service
export const findUserByEmail = async (req: Request, res: Response) => {
  try {
    // Check if this is an internal service request
    const isInternalServiceRequest = req.headers['x-internal-service'] === 'true';
    
    if (!isInternalServiceRequest) {
      return res.status(401).json({ message: 'Unauthorized: Internal service only endpoint' });
    }
    
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }

    const user = await userModel.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error finding user by email:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Validate password - for authentication service
const validatePassword = async (req: Request, res: Response) => {
  const { password, hashedPassword } = req.body;
  
  if (!password || !hashedPassword) {
    return res.status(400).json({ message: "Password and hashedPassword are required" });
  }
  
  try {
    const isValid = await bcrypt.compare(password, hashedPassword);
    return res.status(200).json({ valid: isValid });
  } catch (error: any) {
    return res.status(500).json({ message: "Error validating password", error: error.message });
  }
};

// Add token to user - for authentication service
const addUserToken = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }
  
  try {
    const user = await userModel.findById(id).select('+tokens');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.tokens) {
      user.tokens = [token];
    } else {
      user.tokens.push(token);
    }
    
    await user.save();
    return res.status(200).json({ message: "Token added successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: "Error adding token", error: error.message });
  }
};

// Remove token from user - for authentication service
const removeUserToken = async (req: Request, res: Response) => {
  const { id, token } = req.params;
  
  try {    
    const user = await userModel.findById(id).select('+tokens');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.tokens || !user.tokens.includes(token)) {
      console.log('Token not found - ' + user.tokens?.length);
      return res.status(400).json({ message: "Token not found" });
    }
    
    user.tokens = user.tokens.filter(t => t !== token);
    await user.save();
    
    return res.status(200).json({ message: "Token removed successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: "Error removing token", error: error.message });
  }
};

// Verify if token exists for user - for authentication service
const verifyUserToken = async (req: Request, res: Response) => {
  const { id, token } = req.params;
  
  try {    
    const user = await userModel.findById(id).select('+tokens');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const valid = user.tokens && user.tokens.includes(token);
    return res.status(200).json({ valid });
  } catch (error: any) {
    return res.status(500).json({ message: "Error verifying token", error: error.message });
  }
};

// Update token - for authentication service
const updateUserToken = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { oldToken, newToken } = req.body;
  
  if (!oldToken || !newToken) {
    return res.status(400).json({ message: "Old token and new token are required" });
  }
  
  try {    
    const user = await userModel.findById(id).select('+tokens');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.tokens || !user.tokens.includes(oldToken)) {
      return res.status(400).json({ message: "Old token not found" });
    }
    
    const tokenIndex = user.tokens.indexOf(oldToken);
    user.tokens[tokenIndex] = newToken;
    await user.save();
    
    return res.status(200).json({ message: "Token updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: "Error updating token", error: error.message });
  }
};

// Find user by GitHub ID - for OAuth authentication
export const findUserByGithubId = async (req: Request, res: Response) => {
  try {
    // Check if this is an internal service request
    const isInternalServiceRequest = req.headers['x-internal-service'] === 'true';
    
    if (!isInternalServiceRequest) {
      return res.status(401).json({ message: 'Unauthorized: Internal service only endpoint' });
    }
    
    const { githubId } = req.params;
    
    if (!githubId) {
      return res.status(400).json({ message: 'GitHub ID parameter is required' });
    }

    const user = await userModel.findOne({ githubId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error finding user by GitHub ID:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Find user by Google ID - for OAuth authentication
export const findUserByGoogleId = async (req: Request, res: Response) => {
  try {
    // Check if this is an internal service request
    const isInternalServiceRequest = req.headers['x-internal-service'] === 'true';
    
    if (!isInternalServiceRequest) {
      return res.status(401).json({ message: 'Unauthorized: Internal service only endpoint' });
    }
    
    const { googleId } = req.params;
    
    if (!googleId) {
      return res.status(400).json({ message: 'Google ID parameter is required' });
    }

    const user = await userModel.findOne({ googleId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error finding user by Google ID:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Reset password for authenticated user
const resetPassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Debug logging
    console.log('Reset password request received');
    console.log('User ID from params:', req.params.userId);
    console.log('Has currentPassword:', !!currentPassword);
    console.log('Has newPassword:', !!newPassword);
    
    // Basic validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }
    
    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: 'New password must be at least 8 characters long' 
      });
    }
    
    // Get user ID from the authenticated request (set by auth middleware)
    const userId = req.params.userId;
    
    if (!userId) {
      console.log('No userId found in request params');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Find the user and include the password field
    const user = await userModel.findById(userId).select('+password');
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', user.email);
    console.log('User has password:', !!user.password);
    
    // Check if user has a password (might be OAuth-only user)
    if (!user.password) {
      return res.status(400).json({ 
        message: 'Cannot reset password for OAuth-only accounts' 
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    console.log('Current password valid:', isCurrentPasswordValid);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        message: 'Current password is incorrect' 
      });
    }
    
    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { password: hashedNewPassword },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(500).json({ message: 'Failed to update password' });
    }
    
    console.log('Password updated successfully for user:', user.email);
    return res.status(200).json({ 
      message: 'Password updated successfully' 
    });
    
  } catch (error: any) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({ 
      message: 'Error updating password', 
      error: error.message 
    });
  }
};

export default { 
  addUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  createUserHelper, 
  uploadAvatar,
  findUserByEmail,
  findUserByGithubId,
  findUserByGoogleId,
  validatePassword,
  addUserToken,
  removeUserToken,
  verifyUserToken,
  updateUserToken,
  resetPassword
};
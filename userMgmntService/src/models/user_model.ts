import mongoose, { Schema, Document, model } from "mongoose";
import bcrypt from 'bcrypt';

// Define the User interface
export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  githubId?: string;
  googleId?: string;
  avatarUrl: string;
  role?: string;
  authProvider: 'google' | 'github' | 'local';
  lastLogin: Date;
  emailVerified: boolean;
  verificationToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tokens?: string[];
  likedPosts?: string[];

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  username: {
    type: String,
    required: true
    },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    select: false,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: false
  },
  authProvider: {
    type: String,
    enum: ['google', 'github', 'local'],
    default: 'local',
    required: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  emailVerified: {
    type: Boolean,
    default: function(this: IUser) {
      // Auto-verify email for social login users
      return this.authProvider !== 'local';
    },
    required: true
  },
  verificationToken: {
    type: String,
    required: false,
    select: false,
    default: undefined
  },
  avatarUrl: {
    type: String,
    default: '',
    required: false
  },
  githubId: {
    type: String,
    required: false
  },
  googleId: {
    type: String,
    required: false
  },
  likedPosts: {
    type: [String],
    default: [],
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tokens: {
    type: [String],
    default: [],
    select: false
  }
}, { timestamps: true });

// Custom validation to ensure at least one of password, githubId, or googleId is present
userSchema.pre('save', function (next) {
  if (this.isNew) {
    if (!this.password && !this.githubId && !this.googleId) {
      this.invalidate('password', 'At least one of password, githubId, or googleId is required.');
    }
  }
  next();
});

// Compare Password Method
userSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  try {
    if (!this.password) {
      console.error('Password not found for user.');
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error('Error comparing passwords:', err);
    return false;
  }
};

export default model<IUser>("User", userSchema);

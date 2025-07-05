import mongoose, { Schema, Document, model } from "mongoose";

// Define the AWS Connection interface
export interface IAWSConnection extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  provider: string;
  description?: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    sessionToken?: string;
  };
  accounts?: string[];
  isValidated: boolean;
  createdAt: Date;
  updatedAt: Date;
  toObject(): any;
}

// Define DTOs for type safety in service layer
export interface CreateAWSConnectionDTO {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    sessionToken?: string;
  };
  accounts?: string[];
}

export interface UpdateAWSConnectionDTO {
  name?: string;
  description?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    sessionToken?: string;
  };
  accounts?: string[];
  isValidated?: boolean;
}

const awsConnectionSchema: Schema<IAWSConnection> = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true,
    default: 'aws'
  },
  description: {
    type: String,
    required: false
  },
  credentials: {
    accessKeyId: {
      type: String,
      required: true
    },
    secretAccessKey: {
      type: String,
      required: true
    },
    region: {
      type: String,
      required: true
    },
    sessionToken: {
      type: String,
      required: false
    }
  },
  accounts: {
    type: [String],
    required: false
  },
  isValidated: {
    type: Boolean,
    required: true,
    default: false
  }
}, { timestamps: true });

// Create indexes for better query performance
awsConnectionSchema.index({ userId: 1 });
awsConnectionSchema.index({ provider: 1 });

export default model<IAWSConnection>("AWSConnection", awsConnectionSchema); 
import { ObjectId } from 'mongodb';

export interface AWSConnection {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  provider: string; // Currently only 'aws'
  description?: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    sessionToken?: string;
  };
  accounts?: string[]; // AWS account IDs
  isValidated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAWSConnectionDTO {
  userId: ObjectId;
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
import { AWSConnection } from '../types/awsConnection';
import api from '../utils/api';
import { useUser } from '../hooks/compatibilityHooks';

// API base URLs according to nginx configuration
const API_BASE_URL = '/api/db'; // Maps to db-service in nginx config
const CLOUDQUERY_SERVICE_URL = '/api/cloud'; // Maps to cloud-query-service in nginx config

export const fetchAwsConnections = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/aws-connections`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch AWS connections: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching AWS connections:', error);
    return [];
  }
};

export const createAwsConnection = async (connectionData: Partial<AWSConnection>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/aws-connections`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connectionData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create AWS connection: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating AWS connection:', error);
    throw error;
  }
};

export const updateAwsConnection = async (connection: AWSConnection): Promise<AWSConnection> => {
  try {
    const response = await fetch(`${API_BASE_URL}/aws-connections/${connection._id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connection),
    });

    if (!response.ok) {
      throw new Error(`Failed to update AWS connection: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating AWS connection:', error);
    throw error;
  }
};

export const deleteAwsConnection = async (connectionId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/aws-connections/${connectionId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete AWS connection: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting AWS connection:', error);
    throw error;
  }
};

export const validateAwsCredentials = async (credentials: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/aws-connections/validate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`Failed to validate AWS credentials: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating AWS credentials:', error);
    throw error;
  }
};

export const validateAwsCredentialsCloud = async (credentials: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}, userId?: string) => {
  try {
    // Get userId from localStorage if not provided
    const uid = userId || localStorage.getItem('user_id');
    if (!uid) throw new Error('No user ID found for validation');
    const response = await fetch('/api/cloud/validate', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userID: uid,
        awsCredentials: {
          AWS_ACCESS_KEY_ID: credentials.accessKeyId,
          AWS_SECRET_ACCESS_KEY: credentials.secretAccessKey,
          AWS_REGION: credentials.region
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to validate AWS credentials: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating AWS credentials (cloud):', error);
    throw error;
  }
};

export const executeCloudQuery = async (connectionId: string) => {
  try {
    // Call the cloud query API
    const response = await fetch(`${CLOUDQUERY_SERVICE_URL}/query/${connectionId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to execute cloud query: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing cloud query:', error);
    throw error;
  }
}; 
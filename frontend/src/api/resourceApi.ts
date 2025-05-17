import axios from 'axios';

const API_URL = process.env.REACT_APP_DB_SERVICE_URL || 'http://localhost:4003';

export interface ResourceMetrics {
    compute: number;
    storage: number;
    network: number;
    database: number;
}

export const getResourceMetrics = async (userId: string, connectionId: string): Promise<ResourceMetrics> => {
    try {
        const response = await axios.get(`${API_URL}/resources/metrics`, {
            params: { userId, connectionId },
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching resource metrics:', error);
        throw error;
    }
};

export const getResourceDetails = async (
    userId: string,
    connectionId: string,
    resourceType: 'compute' | 'storage' | 'network' | 'database'
): Promise<any[]> => {
    try {
        const response = await axios.get(`${API_URL}/resources/details`, {
            params: { userId, connectionId, resourceType },
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching resource details:', error);
        throw error;
    }
}; 
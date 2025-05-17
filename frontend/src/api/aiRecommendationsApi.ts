import { API_URL } from '../config/index';

export interface AIRecommendation {
    title: string;
    problem: string;
    impact: string;
    color: 'error' | 'warning' | 'success' | 'info';
    icon: string;
    chatPrompt: string;
}

export interface AIRecommendationsResponse {
    error?: string;
    recommendations?: AIRecommendation[];
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const DEBOUNCE_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let lastRequestTime = 0;
let pendingRequest: Promise<AIRecommendationsResponse> | null = null;

export const getAIRecommendations = async (userId: string, connectionId: string): Promise<AIRecommendationsResponse> => {
    const now = Date.now();
    
    // If there's a pending request, return it
    if (pendingRequest) {
        return pendingRequest;
    }
    
    // If the last request was less than DEBOUNCE_DELAY ago, wait
    if (now - lastRequestTime < DEBOUNCE_DELAY) {
        await sleep(DEBOUNCE_DELAY - (now - lastRequestTime));
    }
    
    let lastError: Error | null = null;
    
    // Create a new pending request
    pendingRequest = (async () => {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const url = `${API_URL}/api/chatbot/recommendations?userId=${userId}&connectionId=${connectionId}`;
                console.log(`Fetching recommendations (attempt ${attempt}/${MAX_RETRIES}) from:`, url);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                const response = await fetch(
                    url,
                    {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
                    throw new Error(errorData.error || `Failed to fetch AI recommendations: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('Received recommendations:', data);
                
                // Update last request time
                lastRequestTime = Date.now();
                
                // If we get here, the request was successful
                return data;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error occurred');
                console.error(`Attempt ${attempt} failed:`, lastError);
                
                if (attempt < MAX_RETRIES) {
                    console.log(`Retrying in ${RETRY_DELAY}ms...`);
                    await sleep(RETRY_DELAY * attempt); // Exponential backoff
                }
            }
        }
        
        // If we get here, all retries failed
        console.error('All retry attempts failed:', lastError);
        throw lastError;
    })();
    
    try {
        return await pendingRequest;
    } finally {
        pendingRequest = null;
    }
}; 
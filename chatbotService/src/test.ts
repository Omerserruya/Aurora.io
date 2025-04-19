import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Load environment variables from root .env.development file
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

// Get service URLs
const dbServiceUrl = process.env.DB_SERVICE_URL || 'http://localhost:4003';
const userId = 'aws-test-demo-user';
const connectionId = 'default-connection'; // Default connectionId for testing

/**
 * Insert sample AWS data for the demo user
 */
async function setupTestData() {
  try {
    console.log('Setting up test data for demo...');
    console.log(`Creating sample AWS data for user: ${userId}`);
    
    // Insert sample AWS data for the demo user
    const response = await axios.post(`${dbServiceUrl}/api/cloud-data/${userId}/sample`);
    
    if (response.status === 200) {
      console.log('Successfully created sample AWS data!');
      console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } else {
      console.error('Error creating sample data:', response.statusText);
      return false;
    }
  } catch (error: any) {
    console.error('Error setting up test data:', error.message);
    return false;
  }
}

/**
 * Run a chatbot query and display the result
 */
async function runChatbotQuery(prompt: string, testConnectionId: string = connectionId) {
  try {
    console.log(`\n----- DEMO QUERY -----`);
    console.log(`User query: "${prompt}"`);
    console.log(`Using connection ID: ${testConnectionId}`);
    
    const chatbotUrl = process.env.CHATBOT_SERVICE_URL || 'http://localhost:4005';
    
    // Use userId and connectionId as URL parameters
    const response = await axios.post(
      `${chatbotUrl}/api/chatbot/query/${userId}/${testConnectionId}`, 
      { prompt }
    );
    
    if (response.status === 200) {
      console.log(`\n----- AI RESPONSE -----`);
      console.log(response.data.response);
      return true;
    } else {
      console.error('Error querying chatbot:', response.statusText);
      return false;
    }
  } catch (error: any) {
    console.error('Error running chatbot query:', error.message);
    return false;
  }
}

/**
 * Run a full demo showcasing the chatbot capabilities
 */
async function runDemo() {
  console.log('======================================');
  console.log('AWS CLOUD ARCHITECTURE CHATBOT DEMO');
  console.log('======================================\n');
  
  // First, set up test data
  const dataSetup = await setupTestData();
  if (!dataSetup) {
    console.error('Failed to set up test data. Continuing with demo anyway...');
  }
  
  // Define demo queries to showcase capabilities
  const demoQueries = [
    'What AWS resources do I have in my environment?',
    'Tell me about my VPC and subnet configuration.',
    'What security measures are implemented in my AWS environment?',
    'What are some security improvements I should consider for my AWS infrastructure?',
    'How many EC2 instances do I have and what type are they?',
    'How is my database configured?'
  ];
  
  // Run each demo query
  for (const query of demoQueries) {
    await runChatbotQuery(query);
    console.log('\n--------------------------------------\n');
    
    // Add small delay between queries to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n======================================');
  console.log('DEMO COMPLETED SUCCESSFULLY');
  console.log('======================================');
}

// Run the demo
runDemo(); 
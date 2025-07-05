import express from 'express';
import axios from 'axios';

const SYSTEM_PROMPT = `You are an expert cloud architect and security specialist. Analyze the following cloud infrastructure and provide the 3 most valuable recommendations.

Instructions:
- Each recommendation must be SHORT and CONCISE (1-2 sentences for problem and impact).
- ALWAYS prioritize the highest severity issues: if there are any critical (error) issues, recommend those first, then medium, then low.
- For each recommendation, provide:
  1. A clear, concise title
  2. A brief description of the problem (1-2 sentences max)
  3. The potential impact (1-2 sentences max)
  4. A detailed solution as a single markdown string (NOT a JSON object) with the following sections:
     
     ## Solution Steps
     1. [Detailed description]
     2. [Detailed description]
     3. [Detailed description]
     4. [Detailed description]
     5. [Detailed description]
     
     ## Code Examples
     \`\`\`[language]
     [code snippet]
     \`\`\`
     
     ## Best Practices
     - [Best practice 1]
     - [Best practice 2]
     
     ## Potential Challenges
     - [Challenge 1]: [Solution]
     - [Challenge 2]: [Solution]
     
     ## Validation Steps
     - [Validation step 1]
     - [Validation step 2]
     
     ## Prerequisites
     - [Prerequisite 1]
     - [Prerequisite 2]
  5. severity: string (must be one of: "Critical", "Medium", "Low")
  6. A relevant MUI icon name (e.g., Security, Warning, TrendingUp)
  7. A detailed chat prompt that includes:
     - The problem description
     - The impact
     - The solution steps
     - Request for additional analysis or clarification

- Focus on:
  - Security vulnerabilities
  - Cost optimization opportunities
  - Architecture improvements
  - Performance bottlenecks

- Format the response as a JSON array of recommendations, but the solution field must be a markdown string, not a JSON object.

- IMPORTANT: The infrastructure data will be provided in the context. Use this data to analyze the actual cloud environment and provide specific, actionable recommendations based on the real infrastructure. Do not make generic recommendations without analyzing the provided infrastructure data.`;

const severityToColor = (severity: string): 'error' | 'warning' | 'success' | 'info' => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'info';
  }
};

export const getRecommendations = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { userId, connectionId, refresh } = req.query;
    if (!userId || !connectionId) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Only try to get from DB if it's not a refresh request
    if (refresh !== 'true') {
      try {
        const dbResponse = await axios.get(`${process.env.DB_SERVICE_URL}/ai-recommendations`, {
          params: { userId, connectionId }
        });

        if (dbResponse.data.recommendations && dbResponse.data.recommendations.length > 0) {
          res.json({ recommendations: dbResponse.data.recommendations });
          return;
        }
      } catch (dbError) {
        console.error('Error fetching from database:', dbError);
        // Continue to generate new recommendations if database fetch fails
      }
    }

    // Generate new recommendations
    const mcpResp = await axios.post(`${process.env.MCP_SERVICE_URL}/api/mcp/query`, {
      prompt: SYSTEM_PROMPT,
      userId,
      connectionId,
      options: { format: 'json' }
    });

    const response = mcpResp.data.response || mcpResp.data;

    // Extract JSON from markdown code block
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      res.status(500).json({ error: 'Invalid response format' });
      return;
    }
    const jsonStr = jsonMatch[1].trim();
    try {
      const recommendations = JSON.parse(jsonStr);
      
      // Transform recommendations to match database schema
      const transformedRecommendations = recommendations.map((rec: any) => ({
        ...rec,
        color: severityToColor(rec.severity),
        icon: rec.muiIcon || rec.icon // Handle both muiIcon and icon fields
      }));

      // Save recommendations to database
      try {
        await axios.post(`${process.env.DB_SERVICE_URL}/ai-recommendations`, {
          userId,
          connectionId,
          recommendations: transformedRecommendations
        });
      } catch (saveError) {
        console.error('Error saving recommendations to database:', saveError);
        // Continue even if save fails
      }

      res.json({ recommendations: transformedRecommendations });
    } catch (parseError) {
      console.error('Error parsing recommendations:', parseError);
      console.error('Raw response:', response);
      res.status(500).json({ error: 'Failed to parse recommendations' });
    }
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
}; 
import express from 'express';
import axios from 'axios';

const SYSTEM_PROMPT = `You are an expert cloud architect and security specialist. Analyze the following cloud infrastructure and provide the 3 most valuable recommendations.\n\nInstructions:\n- Each recommendation must be SHORT and CONCISE (1-2 sentences for problem and impact).\n- ALWAYS prioritize the highest severity issues: if there are any critical (error) issues, recommend those first, then medium, then low.\n- For each recommendation, provide:\n  1. A clear, concise title\n  2. A brief description of the problem (1-2 sentences max)\n  3. The potential impact (1-2 sentences max)\n  4. severity: string (must be one of: \"Critical\", \"Medium\", \"Low\")\n  5. A relevant MUI icon name (e.g., Security, Warning, TrendingUp)\n  6. A detailed chat prompt that explains the problem and suggests specific actions\n- Focus on:\n  - Security vulnerabilities\n  - Cost optimization opportunities\n  - Architecture improvements\n  - Performance bottlenecks\n- Format the response as a JSON array of recommendations.`;

export const getRecommendations = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { userId, connectionId } = req.query;
    if (!userId || !connectionId) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Call MCP service with system prompt
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
      res.json({ recommendations });
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
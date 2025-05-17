import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { getAIRecommendations, AIRecommendation, AIRecommendationsResponse } from '../api/aiRecommendationsApi';
import { useUser, useAccount } from '../hooks/compatibilityHooks';

interface AIInsightCardProps {
    title: string;
    description: string;
    impact: string;
    icon: string;
    color: 'error' | 'warning' | 'success' | 'info';
    chatPrompt: string;
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({ title, description, impact, icon, color, chatPrompt }) => {
    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: 1,
                borderLeft: 4,
                borderColor: `${color}.main`,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>
                <Box component="span" sx={{ color: `${color}.main` }}>
                    {icon}
                </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {description}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Impact: {impact}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {chatPrompt}
            </Typography>
        </Box>
    );
};

export const AIInsights: React.FC = () => {
    const { user } = useUser();
    const { account } = useAccount();
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!user?._id || !account?._id) {
                console.log('Missing user or account ID:', { userId: user?._id, accountId: account?._id });
                setLoading(false);
                return;
            }

            try {
                console.log('Fetching recommendations for user:', user._id, 'and account:', account._id);
                const response = await getAIRecommendations(user._id, account._id);
                console.log('Received recommendations response:', response);

                if (response.error) {
                    setError(response.error);
                    setRecommendations([]);
                } else if (response.recommendations) {
                    setRecommendations(response.recommendations);
                    setError(null);
                } else {
                    setError('No recommendations available');
                    setRecommendations([]);
                }
            } catch (err) {
                console.error('Error fetching recommendations:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
                setRecommendations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [user?._id, account?._id]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (recommendations.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info">No AI recommendations available at this time.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                AI Insights
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recommendations.map((recommendation, index) => (
                    <AIInsightCard
                        key={index}
                        title={recommendation.title}
                        description={recommendation.problem}
                        impact={recommendation.impact}
                        icon={recommendation.icon}
                        color={recommendation.color}
                        chatPrompt={recommendation.chatPrompt}
                    />
                ))}
            </Box>
        </Box>
    );
}; 
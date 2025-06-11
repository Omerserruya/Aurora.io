import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Button,
  Card,
  CardContent,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  useTheme,
  alpha,
  Chip,
  Alert
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Security as SecurityIcon,
  AttachMoney as MoneyIcon,
  Storage as StorageIcon,
  Public as PublicIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Architecture as ArchitectureIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Memory as ComputeIcon,
  Router as NetworkIcon,
  Dataset as DatabaseIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useUser } from '../hooks/compatibilityHooks';
import { useAccount } from '../hooks/compatibilityHooks';
import { AddAccountDialog } from '../components/AccountConnection';
import { getResourceMetrics, getResourceDetails, ResourceMetrics } from '../api/resourceApi';
import ResourceDetailsPanel from '../components/ResourceDetailsPanel';
import { getAIRecommendations, AIRecommendation } from '../api/aiRecommendationsApi';
import AIChatButton from '../components/AIChatButton';
import { SolutionDialog } from '../components/SolutionDialog';

interface OverviewCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  trendValue?: string;
  onClick?: () => void;
}

interface AIInsightCardProps {
  title: string;
  description: string;
  action: string;
  solution: string;
  icon: React.ReactNode;
  severity: 'critical' | 'mid' | 'low';
  impact?: string;
  recommendation: AIRecommendation;
}

const OverviewCard = ({ title, value, icon, color, trend, trendValue, onClick }: OverviewCardProps) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
            : theme.shadows[4],
          borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            bgcolor: `${color}15`, 
            p: 1.5, 
            borderRadius: 2,
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          {value}
        </Typography>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: trendValue?.startsWith('+') ? 'success.main' : 'error.main' }}>
            <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {trendValue} {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Utility to trigger chat with a pre-filled message
declare global {
  interface Window { openAIChatWithMessage?: (msg: string) => void; }
}

const AIInsightCard = ({ 
  title, 
  description, 
  action, 
  solution,
  icon, 
  severity,
  impact,
  recommendation
}: AIInsightCardProps) => {
  const theme = useTheme();
  const [showSolution, setShowSolution] = useState(false);
  const shortDescription = description.length > 120 ? description.slice(0, 117) + '...' : description;

  const handleDiscussInChat = () => {
    const enhancedPrompt = `I have an infrastructure issue that needs attention:

Problem: ${recommendation.problem}
Impact: ${recommendation.impact}

${recommendation.solution}

Please help me understand and implement this solution.`;

    if (window.openAIChatWithMessage) {
      window.openAIChatWithMessage(enhancedPrompt);
    } else {
      window.dispatchEvent(new CustomEvent('open-ai-chat', { 
        detail: { 
          message: enhancedPrompt,
          isDirectMessage: true,
          shouldOpen: true
        } 
      }));
    }
  };

  let color;
  if (severity === 'critical') color = 'error';
  else if (severity === 'mid') color = 'warning';
  else color = 'yellow';

  const muiColor = color === 'error' ? 'error' : color === 'warning' ? 'warning' : 'warning';
  const muiLight = color === 'error' ? 'error.light' : color === 'warning' ? 'warning.light' : 'warning.light';
  const muiMain = color === 'error' ? 'error.main' : color === 'warning' ? 'warning.main' : 'warning.main';
  const muiDark = color === 'error' ? 'error.dark' : color === 'warning' ? 'warning.dark' : 'warning.dark';

  return (
    <>
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
              : theme.shadows[4],
            borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : undefined
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ 
              bgcolor: muiLight,
              p: 1.5, 
              borderRadius: 2,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              <Tooltip title={description} placement="top" arrow>
                <Typography variant="body2" color="text.secondary" paragraph sx={{ cursor: 'pointer' }}>
                  {shortDescription}
                </Typography>
              </Tooltip>
              {impact && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: muiMain,
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                  Impact: {impact}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            mt: 3,
            '& > button': {
              flex: 1
            }
          }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={handleDiscussInChat}
              sx={{ 
                borderColor: alpha(theme.palette.text.primary, 0.23),
                color: theme.palette.text.primary,
                bgcolor: alpha(theme.palette.text.primary, 0.04),
                '&:hover': {
                  borderColor: alpha(theme.palette.text.primary, 0.5),
                  bgcolor: alpha(theme.palette.text.primary, 0.08),
                  color: theme.palette.text.primary,
                }
              }}
            >
              Discuss in Chat
            </Button>
            <Button 
              variant="contained" 
              size="small"
              onClick={() => setShowSolution(true)}
              sx={{ 
                bgcolor: muiMain,
                color: 'white',
                fontWeight: 700,
                '&:hover': {
                  bgcolor: muiDark,
                }
              }}
            >
              Show Solution
            </Button>
          </Box>
        </CardContent>
      </Card>
      <SolutionDialog
        open={showSolution}
        onClose={() => setShowSolution(false)}
        title={title}
        solution={solution}
      />
    </>
  );
};

const CostOverview = () => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
      Cost Overview
    </Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <OverviewCard
          title="Daily Cost"
          value="$45.20"
          icon={<MoneyIcon sx={{ color: 'success.main', fontSize: 28 }} />}
          color="success"
          trend="vs yesterday"
          trendValue="-12%"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <OverviewCard
          title="Monthly Cost"
          value="$1,356.00"
          icon={<TrendingUpIcon sx={{ color: 'warning.main', fontSize: 28 }} />}
          color="warning"
          trend="vs last month"
          trendValue="+8%"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <OverviewCard
          title="Projected Cost"
          value="$1,450.00"
          icon={<MoneyIcon sx={{ color: 'info.main', fontSize: 28 }} />}
          color="info"
          trend="this month"
          trendValue="+5%"
        />
      </Grid>
    </Grid>
  </Box>
);

const ResourceOverview = () => {
  const { user } = useUser();
  const { account } = useAccount();
  const [metrics, setMetrics] = useState<ResourceMetrics>({
    compute: 0,
    storage: 0,
    network: 0,
    database: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResourceType, setSelectedResourceType] = useState<'compute' | 'storage' | 'network' | 'database' | null>(null);
  const [resourceDetails, setResourceDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user?._id || !account?._id) return;
      
      try {
        setLoading(true);
        const data = await getResourceMetrics(user._id, account._id);
        setMetrics(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching resource metrics:', err);
        setError('Failed to load resource metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user?._id, account?._id]);

  const handleResourceClick = async (type: 'compute' | 'storage' | 'network' | 'database') => {
    if (!user?._id || !account?._id) return;

    setSelectedResourceType(type);
    setLoadingDetails(true);
    try {
      const details = await getResourceDetails(user._id, account._id, type);
      setResourceDetails(details);
    } catch (err) {
      console.error('Error fetching resource details:', err);
      setResourceDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleClosePanel = () => {
    setSelectedResourceType(null);
    setResourceDetails([]);
  };

  if (loading) {
    return (
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Resource Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Compute"
            value={metrics.compute.toString()}
            icon={<ComputeIcon sx={{ color: 'primary.main', fontSize: 28 }} />}
            color="primary"
            onClick={() => handleResourceClick('compute')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Storage"
            value={metrics.storage.toString()}
            icon={<StorageIcon sx={{ color: 'info.main', fontSize: 28 }} />}
            color="info"
            onClick={() => handleResourceClick('storage')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Network"
            value={metrics.network.toString()}
            icon={<NetworkIcon sx={{ color: 'success.main', fontSize: 28 }} />}
            color="success"
            onClick={() => handleResourceClick('network')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Database"
            value={metrics.database.toString()}
            icon={<DatabaseIcon sx={{ color: 'warning.main', fontSize: 28 }} />}
            color="warning"
            onClick={() => handleResourceClick('database')}
          />
        </Grid>
      </Grid>

      <ResourceDetailsPanel
        open={!!selectedResourceType}
        onClose={handleClosePanel}
        resourceType={selectedResourceType}
        resources={resourceDetails}
        loading={loadingDetails}
      />
    </Box>
  );
};

const AIInsights = () => {
  const { user } = useUser();
  const { account } = useAccount();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRecommendations = async (refresh: boolean = false) => {
    if (!user?._id || !account?._id) {
      console.log('Missing user or account ID:', { userId: user?._id, accountId: account?._id });
      setLoading(false);
      return;
    }

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('Fetching recommendations for user:', user._id, 'and account:', account._id, 'refresh:', refresh);
      const response = await getAIRecommendations(user._id, account._id, refresh);
      console.log('Received recommendations response:', response);
      if (response.recommendations) {
        console.log('AI Recommendations:', response.recommendations);
      }
      if (response.error) {
        setError(response.error);
        setRecommendations([]);
      } else if (response.recommendations) {
        setRecommendations(response.recommendations);
        setError(null);
        setLastUpdated(new Date());
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user?._id, account?._id]);

  const handleRefresh = () => {
    fetchRecommendations(true);
  };

  const renderContent = () => {
    if (loading && !lastUpdated) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, gap: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Loading recommendations...
          </Typography>
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
      <Grid container spacing={3}>
        {recommendations.map((recommendation, index) => (
          <Grid item xs={12} md={4} key={index}>
            <AIInsightCard
              title={recommendation.title}
              description={recommendation.problem}
              action={recommendation.chatPrompt}
              solution={recommendation.solution}
              icon={getIconForRecommendation(recommendation.icon)}
              severity={getSeverityFromRecommendation(recommendation)}
              impact={recommendation.impact}
              recommendation={recommendation}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        borderRadius: 2,
        background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
      }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            AI Recommendations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generated by CloudAI · {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </Typography>
        </Box>
        <Tooltip title="Generate new recommendations">
          <IconButton 
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ 
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' },
              transition: 'transform 0.2s',
              transform: refreshing ? 'rotate(180deg)' : 'none'
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      {refreshing ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, gap: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Analyzing your cloud infrastructure...
          </Typography>
          <CircularProgress />
        </Box>
      ) : (
        renderContent()
      )}
    </Box>
  );
};

const getIconForRecommendation = (iconName: string) => {
  switch (iconName) {
    case 'Security':
      return <SecurityIcon />;
    case 'Storage':
      return <StorageIcon />;
    case 'Money':
      return <MoneyIcon />;
    case 'Warning':
      return <WarningIcon />;
    case 'TrendingUp':
      return <TrendingUpIcon />;
    case 'Architecture':
      return <ArchitectureIcon />;
    case 'Info':
      return <InfoIcon />;
    case 'Compute':
      return <ComputeIcon />;
    case 'Network':
      return <NetworkIcon />;
    case 'Database':
      return <DatabaseIcon />;
    case 'Code':
      return <CodeIcon />;
    default:
      return <InfoIcon />;
  }
};

const getSeverityFromRecommendation = (rec: any): 'critical' | 'mid' | 'low' => {
  if (rec.severity) {
    const sev = rec.severity.toLowerCase();
    if (sev === 'critical' || sev === 'error') return 'critical';
    if (sev === 'medium' || sev === 'meduim' || sev === 'warning') return 'mid';
    if (sev === 'low' || sev === 'info' || sev === 'success') return 'low';
  }
  // fallback to color
  switch (rec.color) {
    case 'error':
      return 'critical';
    case 'warning':
      return 'mid';
    case 'success':
    case 'info':
    default:
      return 'low';
  }
};

const Home = () => {
  const { user } = useUser();
  const { account } = useAccount();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const theme = useTheme();

  const WelcomeCard = () => (
    <Card 
      sx={{ 
        maxWidth: 600, 
        mx: 'auto', 
        mt: 4,
        textAlign: 'center',
        p: 4,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        boxShadow: theme.shadows[4],
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`
            : theme.shadows[6]
        }
      }}
    >
      <CloudIcon sx={{ fontSize: 80, mb: 2, opacity: 0.8 }} />
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Let's Get Started
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, opacity: 0.9 }}>
        To explore your cloud environment, connect an account first.
      </Typography>
      <Button
        variant="contained"
        size="large"
        sx={{ 
          bgcolor: 'white',
          color: 'primary.main',
          px: 4,
          py: 1.5,
          '&:hover': {
            bgcolor: 'grey.100'
          }
        }}
        startIcon={<CloudIcon />}
        onClick={() => setIsAddDialogOpen(true)}
      >
        Connect Account
      </Button>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Box sx={{ 
        mb: 4,
        p: 3,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome back, {user?.username || 'User'}!
        </Typography>
        {account && (
          <Box sx={{ 
            display: 'inline-flex',
            alignItems: 'center',
            mt: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}>
            <CloudIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: 'primary.main',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              {account.name}
              <Chip 
                size="small" 
                label="Active" 
                color="success"
                sx={{ 
                  height: 20,
                  '& .MuiChip-label': { px: 1, fontSize: '0.75rem' }
                }}
              />
            </Typography>
          </Box>
        )}
      </Box>

      {!account ? (
        <WelcomeCard />
      ) : (
        <>
          <ResourceOverview />
          <AIInsights />
          <CostOverview />
        </>
      )}

      <AddAccountDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={async (connection) => {
          setIsAddDialogOpen(false);
          try {
            const { createAwsConnection } = await import('../api/awsConnectionApi');
            return await createAwsConnection(connection);
          } catch (error) {
            console.error('Error creating connection:', error);
            throw error;
          }
        }}
      />
    </Box>
  );
};

export default Home; 
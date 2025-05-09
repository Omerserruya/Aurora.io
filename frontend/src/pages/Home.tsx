import React, { useState } from 'react';
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
  Chip
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

interface OverviewCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  trendValue?: string;
}

interface AIInsightCardProps {
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  severity: 'high' | 'medium' | 'low';
  impact?: string;
}

const OverviewCard = ({ title, value, icon, color, trend, trendValue }: OverviewCardProps) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4]
        }
      }}
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

const AIInsightCard = ({ 
  title, 
  description, 
  action, 
  icon, 
  severity,
  impact
}: AIInsightCardProps) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ 
            bgcolor: severity === 'high' ? 'error.light' : severity === 'medium' ? 'warning.light' : 'success.light',
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
            <Typography variant="body2" color="text.secondary" paragraph>
              {description}
            </Typography>
            {impact && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: severity === 'high' ? 'error.main' : severity === 'medium' ? 'warning.main' : 'success.main',
                  fontWeight: 500,
                  mb: 1
                }}
              >
                Impact: {impact}
              </Typography>
            )}
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
              {action}
            </Typography>
          </Box>
        </Box>
        <Button 
          variant="outlined" 
          size="small"
          sx={{ 
            mt: 2,
            borderColor: severity === 'high' ? 'error.main' : severity === 'medium' ? 'warning.main' : 'success.main',
            color: severity === 'high' ? 'error.main' : severity === 'medium' ? 'warning.main' : 'success.main',
            '&:hover': {
              borderColor: severity === 'high' ? 'error.dark' : severity === 'medium' ? 'warning.dark' : 'success.dark',
              bgcolor: severity === 'high' ? 'error.light' : severity === 'medium' ? 'warning.light' : 'success.light',
            }
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
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

const ResourceOverview = () => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
      Resource Overview
    </Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <OverviewCard
          title="Compute"
          value="42"
          icon={<ComputeIcon sx={{ color: 'primary.main', fontSize: 28 }} />}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <OverviewCard
          title="Storage"
          value="156"
          icon={<StorageIcon sx={{ color: 'info.main', fontSize: 28 }} />}
          color="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <OverviewCard
          title="Network"
          value="28"
          icon={<NetworkIcon sx={{ color: 'success.main', fontSize: 28 }} />}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <OverviewCard
          title="Database"
          value="15"
          icon={<DatabaseIcon sx={{ color: 'warning.main', fontSize: 28 }} />}
          color="warning"
        />
      </Grid>
    </Grid>
  </Box>
);

const AIInsights = () => (
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
          Generated by CloudAI · Updated just now
        </Typography>
      </Box>
      <Tooltip title="Refresh insights">
        <IconButton sx={{ 
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'background.paper' }
        }}>
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    </Box>
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <AIInsightCard
          title="Overexposed Security Group"
          description="Security group sg-12345 allows inbound traffic from 0.0.0.0/0"
          action="Limit access to internal CIDRs"
          icon={<SecurityIcon />}
          severity="high"
          impact="High security risk"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <AIInsightCard
          title="Unused EBS Volumes"
          description="3 EBS volumes have been unattached for over 30 days"
          action="Review and delete unused volumes"
          icon={<StorageIcon />}
          severity="medium"
          impact="Potential cost savings: $120/month"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <AIInsightCard
          title="Cost Optimization"
          description="Potential savings of $200/month by using reserved instances"
          action="Review EC2 instance types"
          icon={<MoneyIcon />}
          severity="low"
          impact="Cost reduction opportunity"
        />
      </Grid>
    </Grid>
  </Box>
);

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
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)'
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
          <CostOverview />
          <ResourceOverview />
          <AIInsights />
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
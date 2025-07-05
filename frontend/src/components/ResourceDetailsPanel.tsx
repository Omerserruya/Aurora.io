import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Chip,
  Collapse,
  Paper,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Router as NetworkIcon,
  Dataset as DatabaseIcon,
  Memory as ComputeIcon,
  Tag as TagIcon,
  Public as PublicIcon,
  VpnLock as VpnLockIcon,
  Storage as StorageIcon2,
  Dns as DnsIcon
} from '@mui/icons-material';

interface ResourceDetailsPanelProps {
  open: boolean;
  onClose: () => void;
  resourceType: 'compute' | 'storage' | 'network' | 'database' | null;
  resources: Array<{
    groupKey: string;
    resources: any[];
  }>;
  loading: boolean;
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'compute':
      return <ComputeIcon />;
    case 'storage':
      return <StorageIcon />;
    case 'network':
      return <NetworkIcon />;
    case 'database':
      return <DatabaseIcon />;
    default:
      return <CloudIcon />;
  }
};

const getResourceTitle = (type: string) => {
  switch (type) {
    case 'compute':
      return 'Compute Resources';
    case 'storage':
      return 'Storage Resources';
    case 'network':
      return 'Network Resources';
    case 'database':
      return 'Database Resources';
    default:
      return 'Resources';
  }
};

const ResourceDetailsPanel: React.FC<ResourceDetailsPanelProps> = ({
  open,
  onClose,
  resourceType,
  resources,
  loading
}) => {
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>([]);
  const [expandedItems, setExpandedItems] = React.useState<number[]>([]);

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupKey)
        ? prev.filter(key => key !== groupKey)
        : [...prev, groupKey]
    );
  };

  const toggleItemExpand = (index: number) => {
    setExpandedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const renderResourceDetails = (resource: any, type: string) => {
    switch (type) {
      case 'compute':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Instance ID:</Typography>
                <Typography variant="body2">{resource.instanceId}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Type:</Typography>
                <Typography variant="body2">{resource.instanceType}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">State:</Typography>
                <Chip
                  size="small"
                  label={resource.state}
                  color={resource.state === 'running' ? 'success' : 'error'}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">VPC:</Typography>
                <Typography variant="body2">{resource.vpcId}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Subnet:</Typography>
                <Typography variant="body2">{resource.subnetId}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Private IP:</Typography>
                <Typography variant="body2">{resource.privateIp}</Typography>
              </Box>
              {resource.publicIp && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Public IP:</Typography>
                  <Typography variant="body2">{resource.publicIp}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Launch Time:</Typography>
                <Typography variant="body2">{new Date(resource.launchTime).toLocaleString()}</Typography>
              </Box>
            </Grid>
          </Grid>
        );
      case 'storage':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Bucket Name:</Typography>
                <Typography variant="body2">{resource.bucketName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Region:</Typography>
                <Typography variant="body2">{resource.region}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Size:</Typography>
                <Typography variant="body2">{resource.size}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Created:</Typography>
                <Typography variant="body2">{new Date(resource.creationDate).toLocaleString()}</Typography>
              </Box>
              {resource.tags && resource.tags.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tags:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {resource.tags.map((tag: any, index: number) => (
                      <Chip
                        key={index}
                        size="small"
                        icon={<TagIcon />}
                        label={`${tag.key}: ${tag.value}`}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        );
      case 'network':
        if (resource.type === 'VPC') {
          return (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">VPC ID:</Typography>
                  <Typography variant="body2">{resource.vpcId}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">CIDR Block:</Typography>
                  <Typography variant="body2">{resource.cidrBlock}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">State:</Typography>
                  <Chip
                    size="small"
                    label={resource.state}
                    color={resource.state === 'available' ? 'success' : 'error'}
                  />
                </Box>
              </Grid>
            </Grid>
          );
        } else if (resource.type === 'Subnet') {
          return (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Subnet ID:</Typography>
                  <Typography variant="body2">{resource.subnetId}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">VPC ID:</Typography>
                  <Typography variant="body2">{resource.vpcId}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">CIDR Block:</Typography>
                  <Typography variant="body2">{resource.cidrBlock}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Availability Zone:</Typography>
                  <Typography variant="body2">{resource.availabilityZone}</Typography>
                </Box>
              </Grid>
            </Grid>
          );
        } else {
          return (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Group ID:</Typography>
                  <Typography variant="body2">{resource.groupId}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Name:</Typography>
                  <Typography variant="body2">{resource.groupName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">VPC ID:</Typography>
                  <Typography variant="body2">{resource.vpcId}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Description:</Typography>
                  <Typography variant="body2">{resource.description}</Typography>
                </Box>
              </Grid>
            </Grid>
          );
        }
      case 'database':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Instance ID:</Typography>
                <Typography variant="body2">{resource.dbInstanceId}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Engine:</Typography>
                <Typography variant="body2">{resource.engine} {resource.engineVersion}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Status:</Typography>
                <Chip
                  size="small"
                  label={resource.status}
                  color={resource.status === 'available' ? 'success' : 'error'}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">VPC:</Typography>
                <Typography variant="body2">{resource.vpcId}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Subnet:</Typography>
                <Typography variant="body2">{resource.subnetId}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Endpoint:</Typography>
                <Typography variant="body2">{resource.endpoint}</Typography>
              </Box>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  if (!resourceType) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 500,
          bgcolor: 'background.paper',
          boxShadow: 3
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getResourceIcon(resourceType)}
          <Typography variant="h6" component="div">
            {getResourceTitle(resourceType)}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : resources.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No resources found
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 2 }}>
          {resources.map((group) => (
            <React.Fragment key={group.groupKey}>
              {group.resources.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  <ListItem
                    button
                    onClick={() => toggleGroupExpand(group.groupKey)}
                    sx={{
                      bgcolor: 'background.default',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon>
                      {resourceType === 'storage' ? (
                        <StorageIcon />
                      ) : (
                        <VpnLockIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={group.groupKey}
                      secondary={`${group.resources.length} resources`}
                    />
                    {expandedGroups.includes(group.groupKey) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItem>
                  <Collapse in={expandedGroups.includes(group.groupKey)}>
                    <List sx={{ p: 0 }}>
                      {group.resources.map((resource, index) => (
                        <React.Fragment key={index}>
                          <ListItem
                            button
                            onClick={() => toggleItemExpand(index)}
                            sx={{
                              pl: 4,
                              bgcolor: 'background.paper',
                              '&:hover': {
                                bgcolor: 'action.hover'
                              }
                            }}
                          >
                            <ListItemIcon>
                              {getResourceIcon(resourceType)}
                            </ListItemIcon>
                            <ListItemText
                              primary={resource.name || resource.instanceId || resource.bucketName || resource.groupId || resource.vpcId || resource.subnetId || resource.dbInstanceId}
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {resource.type}
                                  </Typography>
                                  {resource.state && (
                                    <Chip
                                      size="small"
                                      label={resource.state}
                                      color={
                                        resource.state === 'running' || resource.state === 'active' || resource.state === 'available'
                                          ? 'success'
                                          : resource.state === 'stopped'
                                          ? 'error'
                                          : 'default'
                                      }
                                      sx={{ mt: 0.5 }}
                                    />
                                  )}
                                </Box>
                              }
                            />
                            {expandedItems.includes(index) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </ListItem>
                          <Collapse in={expandedItems.includes(index)}>
                            <Box sx={{ pl: 8, pr: 2, pb: 2, bgcolor: 'background.paper' }}>
                              {renderResourceDetails(resource, resourceType)}
                            </Box>
                          </Collapse>
                        </React.Fragment>
                      ))}
                    </List>
                  </Collapse>
                </Paper>
              )}
            </React.Fragment>
          ))}
        </List>
      )}
    </Drawer>
  );
};

export default ResourceDetailsPanel; 
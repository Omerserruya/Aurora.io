import * as React from 'react';
import MuiAvatar from '@mui/material/Avatar';
import MuiListItemAvatar from '@mui/material/ListItemAvatar';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Select, { selectClasses, SelectChangeEvent } from '@mui/material/Select';
import ListSubheader from '@mui/material/ListSubheader';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LanIcon from '@mui/icons-material/Lan';
import SecurityIcon from '@mui/icons-material/Security';
import BucketIcon from '@mui/icons-material/Inventory';
import RouterIcon from '@mui/icons-material/Router';
import PublicIcon from '@mui/icons-material/Public';
import ShieldIcon from '@mui/icons-material/Shield';
import LoadBalancerIcon from '@mui/icons-material/Balance';

const Avatar = styled(MuiAvatar)(({ theme }) => ({
  width: 28,
  height: 28,
  backgroundColor: (theme).palette.background.paper,
  color: (theme).palette.text.secondary,
  border: `1px solid ${(theme).palette.divider}`,
}));

const ListItemAvatar = styled(MuiListItemAvatar)({
  minWidth: 0,
  marginRight: 12,
});

const resources = {
  "amis":{
    name: "AMIs",
    icon: <StorageIcon />,
  },
  "instances":{
    name: "Instances",
    icon: <CloudIcon />,
  },
  "vpcs":{
    name: "VPCs",
    icon: <AccountTreeIcon />,
  },
  "subnets":{
    name: "Subnets",
    icon: <LanIcon />,
  },
  "securityGroupRules":{
    name: "Security Groups",
    icon: <SecurityIcon />,
  },
  "s3Buckets":{
    name: "S3 Buckets",
    icon: <BucketIcon />,
  },
  "routeTables":{
    name: "Route Tables",
    icon: <RouterIcon />,
  },
  "internetGateways":{
    name: "Internet Gateways",
    icon: <PublicIcon />,
  },
  "networkAcls":{
    name: "Network ACLs",
    icon: <ShieldIcon />,
  },
  "loadBalancers":{
    name: "Load Balancers",
    icon: <LoadBalancerIcon />,
  }
};
export type resourcesType = "amis" | "instances" | "vpcs" | "subnets" | "securityGroupRules" | "s3Buckets" | "routeTables" | "internetGateways" | "networkAcls" | "loadBalancers";
interface ResourceSelectorProps {
  onResourceChange: (resource: string) => void;
  resourcesView: resourcesType[]
}

export default function ResourceSelector({ onResourceChange, resourcesView }: ResourceSelectorProps) {
  const [selectedResource, setSelectedResource] = React.useState(resourcesView[0]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    setSelectedResource(event.target.value as resourcesType);
    onResourceChange(event.target.value);
  };
  return (
    <Select
      labelId="resource-select"
      id="resource-simple-select"
      value={selectedResource}
      onChange={handleChange}
      displayEmpty
      inputProps={{ 'aria-label': 'Select AWS resource' }}
      sx={{
        maxHeight: 56,
        width: 215,
        '&.MuiList-root': {
          p: '8px',
        },
        [`& .${selectClasses.select}`]: {
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          pl: 1,
        },
      }}
    >
      <ListSubheader sx={{ pt: 0 }}>AWS Resources</ListSubheader>
      {resourcesView.map((val: resourcesType) => (
        <MenuItem key={val} value={val}>
          <ListItemAvatar>
            <Avatar>
              {resources[val].icon}
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={resources[val].name} />
        </MenuItem>
      ))}
    </Select>
  );
} 
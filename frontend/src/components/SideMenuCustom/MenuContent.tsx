import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import CodeIcon from '@mui/icons-material/Code';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import Stack from '@mui/material/Stack';

export default function MenuContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/home' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Visualization', icon: <BarChartIcon />, path: '/visualization' },
    { text: 'IAC', icon: <CodeIcon />, path: '/iac' },
  ];

  const secondaryListItems = [
    { text: 'Settings', icon: <SettingsRoundedIcon /> ,path: '/setting'},
    { text: 'About', icon: <InfoRoundedIcon /> ,path: '/about'},
  ];
  
  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>

    <List>
      
      {menuItems.map((item) => (
        <ListItem key={item.text} disablePadding>
          <ListItemButton
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>

    <List dense>
    {secondaryListItems.map((item, index) => (
      <ListItem key={index} disablePadding sx={{ display: 'block' }}>
         <ListItemButton
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    ))}
    </List>
    </Stack>
  );
}

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import CodeIcon from '@mui/icons-material/Code';
import { useNavigate, useLocation } from 'react-router-dom';
import GroupIcon from '@mui/icons-material/Group';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { useUser } from '../../hooks/compatibilityHooks';

export default function MenuContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [adminOpen, setAdminOpen] = useState(false);

  const handleAdminClick = () => {
    setAdminOpen(!adminOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/home' },
    { text: 'Visualization', icon: <BarChartIcon />, path: '/visualization' },
    { text: 'IAC', icon: <CodeIcon />, path: '/iac' },
  ];

  const adminItems = [
    { text: 'Users', icon: <GroupIcon />, path: '/admin/users' },
  ];
  
  return (
    <>
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

      {user?.role === 'admin' && (
        <>
          <Divider sx={{ my: 1 }} />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleAdminClick}>
                <ListItemIcon>
                  <AdminPanelSettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Admin Settings" />
                {adminOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={adminOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {adminItems.map((item) => (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton 
                      sx={{ pl: 4 }}
                      selected={location.pathname === item.path}
                      onClick={() => navigate(item.path)}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </List>
        </>
      )}
    </>
  );
}

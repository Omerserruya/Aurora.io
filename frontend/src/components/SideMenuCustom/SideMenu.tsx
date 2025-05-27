import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MenuContent from './MenuContent';
import Divider from '@mui/material/Divider';
import SelectContent from './SelectContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  [`& .${drawerClasses.paper}`]: {
    boxSizing: 'border-box',
  },
});

const LogoContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
});

export default function SideMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const bottomMenuItems = [
    { text: 'About', icon: <InfoRoundedIcon />, path: '/about' },
  ];

  const logoPath = theme.palette.mode === 'dark' 
    ? '/aurora-dark.png'
    : '/aurora-light.png';

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: 'block',
        '& .MuiDrawer-paper': {
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          width: drawerWidth
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        position: 'relative'
      }}>
        <LogoContainer>
          <img 
            src={logoPath}
            alt="Aurora Logo" 
            style={{ 
              margin: '20px 0',
              width: '200px', 
              height: 'auto',
              display: 'block',
              padding: '12px'
            }} 
          />
        </LogoContainer>
        
        <Box sx={{ 
          flexGrow: 1,
          overflowY: 'auto',
        }}>
          <SelectContent />
          <MenuContent />
        </Box>

        <Box sx={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'background.paper'
        }}>
          <List dense>
            {bottomMenuItems.map((item) => (
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
        </Box>
      </Box>
    </Drawer>
  );
}

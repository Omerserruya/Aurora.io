import * as React from 'react';
import { styled } from '@mui/material/styles';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MenuContent from './MenuContent';
import UserCard from './UserCard';
import Divider from '@mui/material/Divider';
import SelectContent from './SelectContent';
const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

export default function SideMenu() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          width: drawerWidth
        }
      }}
    >
      <Box sx={{ mt: '20px' }}>
        <SelectContent />
        </Box>

        <MenuContent />
        <Divider />
        <UserCard />
    </Drawer>
  );
}

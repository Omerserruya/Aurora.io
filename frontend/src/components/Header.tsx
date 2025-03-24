import * as React from 'react';
import Stack from '@mui/material/Stack';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import ColorModeIconDropdown from '../shared-theme/ColorModeIconDropdown';
import Search from './Search';
import { Box } from '@mui/material';

export default function Header() {
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: 3,
        py: 0.75
      }}
    >
      <Stack
        direction="row"
        sx={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        spacing={2}
      >
        <NavbarBreadcrumbs />
        <Stack direction="row" spacing={1.5}>
          <Search />
          <ColorModeIconDropdown />
        </Stack>
      </Stack>
    </Box>
  );
}

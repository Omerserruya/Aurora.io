import React from 'react';
import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function ColorModeIconDropdown() {
  const { mode, setMode } = useColorScheme();

  const toggleColorMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <IconButton onClick={toggleColorMode} color="inherit" size="small">
      {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );
} 
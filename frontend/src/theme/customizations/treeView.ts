import { Theme, alpha } from '@mui/material/styles';
import type { Components } from '@mui/material/styles';
import { gray, brand } from '../../shared-theme/themePrimitives';

// Extend the base Components type to include TreeView components
declare module '@mui/material/styles' {
  interface Components {
    MuiTreeItem2: any;
  }
}

type TreeViewComponents = Pick<Components<Theme>,
  | 'MuiTreeItem2'
>;

interface CustomTheme extends Theme {
  applyStyles: (mode: 'light' | 'dark', styles: Record<string, unknown>) => Record<string, unknown>;
}

type StyleProps<T> = T & { 
  theme: CustomTheme;
};

/* eslint-disable import/prefer-default-export */
export const treeViewCustomizations: TreeViewComponents = {
  MuiTreeItem2: {
    styleOverrides: {
      root: ({ theme }: StyleProps<any>) => ({
        position: 'relative',
        boxSizing: 'border-box',
        padding: theme.spacing(0, 1),
        '& .groupTransition': {
          marginLeft: theme.spacing(2),
          padding: theme.spacing(0),
          borderLeft: '1px solid',
          borderColor: theme.palette.divider,
        },
        '&:focus-visible .focused': {
          outline: `3px solid ${alpha(brand[500], 0.5)}`,
          outlineOffset: '2px',
          '&:hover': {
            backgroundColor: alpha(gray[300], 0.2),
            outline: `3px solid ${alpha(brand[500], 0.5)}`,
            outlineOffset: '2px',
          },
        },
      }),
      content: ({ theme }: StyleProps<any>) => ({
        marginTop: theme.spacing(1),
        padding: theme.spacing(0.5, 1),
        overflow: 'clip',
        '&:hover': {
          backgroundColor: alpha(gray[300], 0.2),
        },
        '&.selected': {
          backgroundColor: alpha(gray[300], 0.4),
          '&:hover': {
            backgroundColor: alpha(gray[300], 0.6),
          },
        },
        ...theme.applyStyles('dark', {
          '&:hover': {
            backgroundColor: alpha(gray[500], 0.2),
          },
          '&:focus-visible': {
            '&:hover': {
              backgroundColor: alpha(gray[500], 0.2),
            },
          },
          '&.selected': {
            backgroundColor: alpha(gray[500], 0.4),
            '&:hover': {
              backgroundColor: alpha(gray[500], 0.6),
            },
          },
        }),
      }),
    },
  },
}; 
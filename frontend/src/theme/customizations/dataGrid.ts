import { Theme, alpha } from '@mui/material/styles';
import type { Components } from '@mui/material/styles';
import { paperClasses } from '@mui/material/Paper';
import { menuItemClasses } from '@mui/material/MenuItem';
import { listItemIconClasses } from '@mui/material/ListItemIcon';
import { iconButtonClasses } from '@mui/material/IconButton';
import { checkboxClasses } from '@mui/material/Checkbox';
import { listClasses } from '@mui/material/List';
import { gridClasses } from '@mui/x-data-grid';
import { tablePaginationClasses } from '@mui/material/TablePagination';
import { gray } from '../../shared-theme/themePrimitives';

// Extend the base Components type to include DataGrid components
declare module '@mui/material/styles' {
  interface Components {
    MuiDataGrid: any;
  }
}

type DataGridComponents = Pick<Components<Theme>,
  | 'MuiDataGrid'
>;

interface CustomTheme extends Theme {
  applyStyles: (mode: 'light' | 'dark', styles: Record<string, unknown>) => Record<string, unknown>;
}

type StyleProps<T> = T & { 
  theme: CustomTheme;
};

/* eslint-disable import/prefer-default-export */
export const dataGridCustomizations: DataGridComponents = {
  MuiDataGrid: {
    styleOverrides: {
      root: ({ theme }: StyleProps<any>) => ({
        '--DataGrid-overlayHeight': '300px',
        overflow: 'clip',
        borderColor: theme.palette.divider,
        backgroundColor: theme.palette.background.default,
        [`& .${gridClasses.columnHeader}`]: {
          backgroundColor: theme.palette.background.paper,
        },
        [`& .${gridClasses.footerContainer}`]: {
          backgroundColor: theme.palette.background.paper,
        },
        [`& .${checkboxClasses.root}`]: {
          padding: theme.spacing(0.5),
          '& > svg': {
            fontSize: '1rem',
          },
        },
        [`& .${tablePaginationClasses.root}`]: {
          marginRight: theme.spacing(1),
          '& .MuiIconButton-root': {
            maxHeight: 32,
            maxWidth: 32,
            '& > svg': {
              fontSize: '1rem',
            },
          },
        },
      }),
      cell: ({ theme }: StyleProps<any>) => ({
        borderTopColor: theme.palette.divider,
      }),
      menu: ({ theme }: StyleProps<any>) => ({
        borderRadius: theme.shape.borderRadius,
        backgroundImage: 'none',
        [`& .${paperClasses.root}`]: {
          border: `1px solid ${theme.palette.divider}`,
        },
        [`& .${menuItemClasses.root}`]: {
          margin: '0 4px',
        },
        [`& .${listItemIconClasses.root}`]: {
          marginRight: 0,
        },
        [`& .${listClasses.root}`]: {
          paddingLeft: 0,
          paddingRight: 0,
        },
      }),
      row: ({ theme }: StyleProps<any>) => ({
        '&:last-of-type': {
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        '&.Mui-selected': {
          background: theme.palette.action.selected,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        },
      }),
      iconButtonContainer: ({ theme }: StyleProps<any>) => ({
        [`& .${iconButtonClasses.root}`]: {
          border: 'none',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.action.selected, 0.3),
          },
          '&:active': {
            backgroundColor: gray[200],
          },
          ...theme.applyStyles('dark', {
            color: gray[50],
            '&:hover': {
              backgroundColor: gray[800],
            },
            '&:active': {
              backgroundColor: gray[900],
            },
          }),
        },
      }),
      menuIconButton: ({ theme }: StyleProps<any>) => ({
        border: 'none',
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: gray[100],
        },
        '&:active': {
          backgroundColor: gray[200],
        },
        ...theme.applyStyles('dark', {
          color: gray[50],
          '&:hover': {
            backgroundColor: gray[800],
          },
          '&:active': {
            backgroundColor: gray[900],
          },
        }),
      }),
      filterForm: ({ theme }: StyleProps<any>) => ({
        gap: theme.spacing(1),
        alignItems: 'flex-end',
      }),
      columnsManagementHeader: ({ theme }: StyleProps<any>) => ({
        paddingRight: theme.spacing(3),
        paddingLeft: theme.spacing(3),
      }),
      columnHeaderTitleContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
      },
      columnHeaderDraggableContainer: { paddingRight: 2 },
    },
  },
}; 
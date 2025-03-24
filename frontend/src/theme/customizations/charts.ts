import { Theme } from '@mui/material/styles';
import type { Components } from '@mui/material/styles';
import { axisClasses, legendClasses } from '@mui/x-charts';
import { gray } from '../../shared-theme/themePrimitives';

// Extend the base Components type to include Charts components
declare module '@mui/material/styles' {
  interface Components {
    MuiChartsAxis: any;
    MuiChartsTooltip: any;
    MuiChartsLegend: any;
    MuiChartsGrid: any;
  }
}

type ChartsComponents = Pick<Components<Theme>,
  | 'MuiChartsAxis'
  | 'MuiChartsTooltip'
  | 'MuiChartsLegend'
  | 'MuiChartsGrid'
>;

interface CustomTheme extends Theme {
  applyStyles: (mode: 'light' | 'dark', styles: Record<string, unknown>) => Record<string, unknown>;
}

type StyleProps<T> = T & { 
  theme: CustomTheme;
};

/* eslint-disable import/prefer-default-export */
export const chartsCustomizations: ChartsComponents = {
  MuiChartsAxis: {
    styleOverrides: {
      root: ({ theme }: StyleProps<any>) => ({
        [`& .${axisClasses.line}`]: {
          stroke: gray[300],
        },
        [`& .${axisClasses.tick}`]: { stroke: gray[300] },
        [`& .${axisClasses.tickLabel}`]: {
          fill: gray[500],
          fontWeight: 500,
        },
        ...theme.applyStyles('dark', {
          [`& .${axisClasses.line}`]: {
            stroke: gray[700],
          },
          [`& .${axisClasses.tick}`]: { stroke: gray[700] },
          [`& .${axisClasses.tickLabel}`]: {
            fill: gray[300],
            fontWeight: 500,
          },
        }),
      }),
    },
  },
  MuiChartsTooltip: {
    styleOverrides: {
      mark: ({ theme }: StyleProps<any>) => ({
        ry: 6,
        boxShadow: 'none',
        border: `1px solid ${theme.palette.divider}`,
      }),
      table: ({ theme }: StyleProps<any>) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        background: 'hsl(0, 0%, 100%)',
        ...theme.applyStyles('dark', {
          background: gray[900],
        }),
      }),
    },
  },
  MuiChartsLegend: {
    styleOverrides: {
      root: {
        [`& .${legendClasses.mark}`]: {
          ry: 6,
        },
      },
    },
  },
  MuiChartsGrid: {
    styleOverrides: {
      root: ({ theme }: StyleProps<any>) => ({
        '& .MuiChartsGrid-line': {
          stroke: gray[200],
          strokeDasharray: '4 2',
          strokeWidth: 0.8,
        },
        ...theme.applyStyles('dark', {
          '& .MuiChartsGrid-line': {
            stroke: gray[700],
            strokeDasharray: '4 2',
            strokeWidth: 0.8,
          },
        }),
      }),
    },
  },
}; 
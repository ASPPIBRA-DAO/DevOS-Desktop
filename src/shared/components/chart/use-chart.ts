import type { Theme } from '@mui/material/styles';
import type { ChartOptions } from './types';

import { merge } from 'es-toolkit';
import { varAlpha } from 'minimal-shared/utils';

import { useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export function useChart(updatedOptions?: ChartOptions): ChartOptions {
  const theme = useTheme();

  const baseOptions = baseChartOptions(theme) ?? {};

  return merge(baseOptions, updatedOptions ?? {});
}

// ----------------------------------------------------------------------

const baseChartOptions = (theme: Theme): any => {
  const palette = theme.palette;

  const LABEL_TOTAL = {
    show: true,
    label: 'Total',
    color: palette.text.secondary,
    fontSize: theme.typography.subtitle2.fontSize as string,
    fontWeight: theme.typography.subtitle2.fontWeight,
  };

  const LABEL_VALUE = {
    offsetY: 8,
    color: palette.text.primary,
    fontSize: theme.typography.h4.fontSize as string,
    fontWeight: theme.typography.h4.fontWeight,
  };

  return {
    /** **************************************
     * Chart
     * https://apexcharts.com/docs/options/chart/animations/
     *************************************** */
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      parentHeightOffset: 0,
      fontFamily: theme.typography.fontFamily,
      foreColor: palette.text.disabled,
      animations: {
        enabled: true,
        speed: 360,
        animateGradually: { enabled: true, delay: 120 },
        dynamicAnimation: { enabled: true, speed: 360 },
      },
    },

    /** **************************************
     * Colors
     * https://apexcharts.com/docs/options/colors/
     *************************************** */
    colors: [
      palette.primary.main,
      palette.warning.main,
      palette.info.main,
      palette.error.main,
      palette.success.main,
      palette.warning.dark,
      palette.success.dark,
      palette.info.dark,
      palette.secondary.main,
    ],

    /** **************************************
     * States
     * https://apexcharts.com/docs/options/states/
     *************************************** */
    states: {
      hover: { filter: { type: 'darken' } },
      active: { filter: { type: 'darken' } },
    },

    /** **************************************
     * Fill
     * https://apexcharts.com/docs/options/fill/
     *************************************** */
    fill: {
      opacity: 1,
      gradient: {
        type: 'vertical',
        shadeIntensity: 0,
        opacityFrom: 0.4,
        opacityTo: 0,
        stops: [0, 100],
      },
    },

    /** **************************************
     * Data labels
     * https://apexcharts.com/docs/options/datalabels/
     *************************************** */
    dataLabels: { enabled: false },

    /** **************************************
     * Stroke
     * https://apexcharts.com/docs/options/stroke/
     *************************************** */
    stroke: { width: 2.5, curve: 'smooth', lineCap: 'round' },

    /** **************************************
     * Grid
     * https://apexcharts.com/docs/options/grid/
     *************************************** */
    grid: {
      strokeDashArray: 3,
      borderColor: palette.divider,
      padding: { top: 0, right: 0, bottom: 0 },
      xaxis: { lines: { show: false } },
    },

    /** **************************************
     * Axis
     * https://apexcharts.com/docs/options/xaxis/
     * https://apexcharts.com/docs/options/yaxis/
     *************************************** */
    xaxis: { axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { tickAmount: 5 },

    /** **************************************
     * Markers
     * https://apexcharts.com/docs/options/markers/
     *************************************** */
    markers: {
      size: 0,
      strokeColors: palette.background.paper,
    },

    /** **************************************
     * Tooltip
     *************************************** */
    tooltip: { theme: 'dark', fillSeriesColor: false, x: { show: true } },

    /** **************************************
     * Legend
     * https://apexcharts.com/docs/options/legend/
     *************************************** */
    legend: {
      show: false,
      position: 'top',
      fontWeight: 500,
      fontSize: '13px',
      horizontalAlign: 'right',
      markers: { shape: 'circle' },
      labels: { colors: palette.text.primary },
      itemMargin: { horizontal: 8, vertical: 8 },
    },

    /** **************************************
     * plotOptions
     *************************************** */
    plotOptions: {
      /**
       * bar
       * https://apexcharts.com/docs/options/plotoptions/bar/
       */
      bar: { borderRadius: 4, columnWidth: '48%', borderRadiusApplication: 'end' },
      /**
       * pie + donut
       * https://apexcharts.com/docs/options/plotoptions/pie/
       */
      pie: {
        donut: { labels: { show: true, value: { ...LABEL_VALUE }, total: { ...LABEL_TOTAL } } },
      },
      /**
       * radialBar
       * https://apexcharts.com/docs/options/plotoptions/radialbar/
       */
      radialBar: {
        hollow: { margin: -8, size: '100%' },
        track: {
          margin: -8,
          strokeWidth: '50%',
          background: varAlpha(palette.grey?.[500] ?? '#9CA3AF', 0.16),
        },
        dataLabels: { value: { ...LABEL_VALUE }, total: { ...LABEL_TOTAL } },
      },
      /**
       * radar
       * https://apexcharts.com/docs/options/plotoptions/radar/
       */
      radar: {
        polygons: {
          fill: { colors: ['transparent'] },
          strokeColors: palette.divider,
          connectorColors: palette.divider,
        },
      },
      /**
       * polarArea
       * https://apexcharts.com/docs/options/plotoptions/polararea/
       */
      polarArea: {
        rings: { strokeColor: palette.divider },
        spokes: { connectorColors: palette.divider },
      },
      /**
       * heatmap
       * https://apexcharts.com/docs/options/plotoptions/heatmap/
       */
      heatmap: { distributed: true },
    },

    /** **************************************
     * Responsive
     * https://apexcharts.com/docs/options/responsive/
     *************************************** */
    responsive: [
      {
        breakpoint: theme.breakpoints.values.sm, // sm ~ 600
        options: { plotOptions: { bar: { borderRadius: 3, columnWidth: '80%' } } },
      },
      {
        breakpoint: theme.breakpoints.values.md, // md ~ 900
        options: { plotOptions: { bar: { columnWidth: '60%' } } },
      },
    ],
  };
};

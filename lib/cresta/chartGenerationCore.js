// chartGenerationCore.js
// Ensure 'lodash', 'js-base64', and 'highcharts' are available in your Node.js environment.
// const _ = require('lodash');
// const { encode } = require('js-base64');
// const Highcharts = require('highcharts');
// You might need to initialize Highcharts with modules like export-data, accessibility, etc., if needed,
// e.g., require('highcharts/modules/exporting')(Highcharts);

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js'; // For timezone formatting like 'zzz'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'; // For L, LT, LTS formats
import { numericValueRangeToString, displayUser } from './utils.js';
import {
  NO_VALUE_METADATA,
  NO_VALUE_METADATA_LABEL,
  ADHERENCE_TYPE_MAP_TO_FORM,
  ADHERENCE_TYPE_MAP_TO_CHART_LABEL
} from './constants.js';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);

// --- Constants (equivalent to enums and other constants from the original codebase) ---
const ChartDisplayType = {
  BAR_CHART: 'BAR_CHART',
  LINE_CHART: 'LINE_CHART',
  PIE_CHART: 'PIE_CHART',
  TABLE_CHART: 'TABLE_CHART' // Assuming this was a valid type
  // Add other types if they exist and are used
};

const AggregationOperator = {
  AGGREGATION_OPERATOR_UNSPECIFIED: 'AGGREGATION_OPERATOR_UNSPECIFIED',
  AGGREGATION_OPERATOR_AVG: 'AGGREGATION_OPERATOR_AVG',
  AGGREGATION_OPERATOR_MAX: 'AGGREGATION_OPERATOR_MAX',
  AGGREGATION_OPERATOR_MIN: 'AGGREGATION_OPERATOR_MIN',
  AGGREGATION_OPERATOR_SUM: 'AGGREGATION_OPERATOR_SUM'
  // Add other operators if used
};

const StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute =
  {
    CONVERSATION_DURATION: 'CONVERSATION_DURATION',
    CONVERSATION_HANDLE_TIME: 'CONVERSATION_HANDLE_TIME',
    CONVERSATION_MESSAGE_COUNT: 'CONVERSATION_MESSAGE_COUNT'
    // Add others if used
  };

const DEFAULT_TOOLTIP_OPTIONS = {
  // Simplified, adapt as needed from original highchartsUtils.ts
  shared: true,
  useHTML: true, // Important for custom HTML formatting
  backgroundColor: 'var(--cresta-colors-gray-9)',
  borderColor: 'var(--cresta-colors-gray-9)',
  style: {
    color: 'var(--cresta-colors-reversed-primary)',
    fontSize: '12px'
  },
  padding: 8
  // headerFormat and pointFormat might be needed if they were part of the original
};

const DEFAULT_CHART_OPTIONS = {
  title: {
    text: '', // Will be overridden
    align: 'left',
    y: 20,
    style: { fontSize: '22px', fontWeight: 'bold', color: '#333333' }
  },
  subtitle: {
    text: '', // Will be overridden
    align: 'left',
    y: 45,
    style: { fontSize: '14px', color: '#555555' }
  },
  legend: {
    enabled: true, // Enabled by default as per working example
    align: 'left',
    verticalAlign: 'top',
    layout: 'horizontal',
    y: 70,
    padding: 5,
    itemStyle: { fontSize: '12px', fontWeight: 'normal', color: '#333333' },
    symbolRadius: 3,
    symbolHeight: 10,
    symbolWidth: 10
  },
  time: {
    timezone: undefined
  },
  chart: {
    style: {
      fontFamily: 'Arial, sans-serif' // Changed font
    },
    spacingBottom: 5,
    marginTop: 120 // Added margin
  },
  tooltip: DEFAULT_TOOLTIP_OPTIONS,
  exporting: {
    enabled: false
  },
  credits: {
    enabled: false
  },
  xAxis: {
    // Default xAxis styling (can be extended in specific chart types)
    labels: { style: { fontSize: '12px', color: '#333333' } },
    lineColor: '#cccccc',
    tickColor: '#cccccc'
  },
  yAxis: {
    // Default yAxis styling
    title: { text: '' },
    min: 0,
    gridLineColor: '#e6e6e6',
    labels: { style: { fontSize: '12px', color: '#333333' }, format: '{value}' }
  },
  plotOptions: {
    // Default plotOptions
    line: {
      marker: { enabled: false }, // Changed marker
      lineWidth: 2.5 // Added lineWidth
    }
    // column: {}, // Will be added specifically if needed
    // series: {} // Will be added specifically if needed
  }
};

const DONUT_CHART_MAX_CATEGORIES_WITH_PADDING_LIMIT = 10;

const STATIC_DEFAULT_COLORS = [
  // Common Highcharts default colors
  '#7cb5ec',
  '#434348',
  '#90ed7d',
  '#f7a35c',
  '#8085e9',
  '#f15c80',
  '#e4d354',
  '#2b908f',
  '#f45b5b',
  '#91e8e1'
];

const DateFormat = {
  YearMonthDay: 'YYYY-MM-DD',
  MonthDay: 'MM/DD',
  MonthDaySingularDigit: 'M/D',
  DayAndMonthChars: 'MMM DD',
  DayAndMonthCharsLong: 'MMMM DD',
  ShortTimeString: 'h:mm A',
  ShortTimeStringTz: 'h:mm A (zzz)',
  MonthDayYear: 'MM/DD/YYYY',
  MonthDayYearTime: 'MM/DD/YYYY hh:mm A',
  MonthDayYearTimeTz: 'MM/DD/YYYY hh:mm A (zzz)',
  MonthDayYearTimeLong: 'MM/DD/YYYY hh:mm:ss A',
  ISOStringFormat: 'YYYY-MM-DDTHH:mm:ss.SSS',
  Localized: 'L LT',
  LocalizedWithSeconds: 'L LTS'
};

/**
 * Formats a dayjs object into a string.
 * @param {object} [dayjsObject] - The dayjs object to format.
 * @param {string} [formatPattern=DateFormat.YearMonthDay] - The desired format pattern from the DateFormat object.
 * @returns {string} The formatted date string, or an empty string if no dayjsObject is provided.
 */
function formatDayjsDate(dayjsObject, formatPattern = DateFormat.YearMonthDay) {
  return dayjsObject?.format(formatPattern) || '';
}

// --- Vanilla JS Helper Functions (replacing Lodash) ---
function vanillaGroupBy(array, keyOrIteratee) {
  if (!array || !array.length) return {};
  const iteratee =
    typeof keyOrIteratee === 'function'
      ? keyOrIteratee
      : (item) => item[keyOrIteratee];
  return array.reduce((acc, item) => {
    const groupKey = iteratee(item);
    (acc[groupKey] = acc[groupKey] || []).push(item);
    return acc;
  }, {});
}

function vanillaSum(array) {
  if (!array) return 0;
  return array.reduce(
    (acc, val) => acc + (typeof val === 'number' && isFinite(val) ? val : 0),
    0
  );
}

function vanillaMax(array) {
  if (!array || array.length === 0) return undefined;
  const numbers = array.filter((v) => typeof v === 'number' && isFinite(v));
  return numbers.length ? Math.max(...numbers) : undefined;
}

function vanillaMin(array) {
  if (!array || array.length === 0) return undefined;
  const numbers = array.filter((v) => typeof v === 'number' && isFinite(v));
  return numbers.length ? Math.min(...numbers) : undefined;
}

// --- Utility Functions (ported from TypeScript utils) ---

function notUndefined(value) {
  return value !== undefined && value !== null;
}

function pluralize(count, noun, suffix = 's') {
  return `${count} ${noun}${count !== 1 ? suffix : ''}`;
}

function suffixNumberMagnitude(number, precision = 1) {
  if (number === undefined || number === null || Math.abs(number) < 1000) {
    return String(number);
  }
  const suffixes = ['', 'k', 'm', 'b', 't'];
  const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
  if (tier >= suffixes.length) {
    return number.toExponential(precision);
  }
  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = number / scale;
  return scaled.toFixed(precision) + suffix;
}

function formatPercentage(value, decimalPlaces = 0) {
  if (value === undefined || value === null || Number.isNaN(value))
    return '--%';
  const roundedValue = roundNumber(value, decimalPlaces);
  return `${roundedValue}%`;
}

function compareNumbersByAccessor(accessor) {
  return (a, b) => {
    const valA = accessor(a);
    const valB = accessor(b);
    if (valA < valB) return -1;
    if (valA > valB) return 1;
    return 0;
  };
}

function roundNumber(num, decimalPlaces = 0) {
  if (num === null || num === undefined) return num;
  const p = Math.pow(10, decimalPlaces);
  return Math.round(num * p) / p;
}

// Assuming dayjs is available, e.g., import dayjs from 'dayjs';
// And the UTC plugin is extended for utcOffset:
// import utc from 'dayjs/plugin/utc';
// dayjs.extend(utc);

export function transformTimeStamp(iso8601String) {
  let date = dayjs(iso8601String);
  const year = date.year();

  // This 'datePlusOneHour' is calculated once based on the initial 'date' object
  // and is used in subsequent conditional assignments, mirroring the original TypeScript logic.
  const datePlusOneHour = date.add(1, 'hour');

  // Start of Daylight Saving Time is always the second Sunday in March of the year.
  // Changed from .isoWeekday(0) to .day(0) for standard dayjs API (assuming Sunday is 0).
  const secondSundayInMarch = dayjs(`${year}-03-01`)
    .startOf('month')
    .add(2, 'week')
    .day(0);

  if (datePlusOneHour.isSame(secondSundayInMarch, 'day')) {
    date = datePlusOneHour;
  }

  // For the most important timezones (North America, Europe) January should be in standard time and not DST
  // The 'date' variable used for '.utcOffset()' here might have been updated by the previous block.
  const january = dayjs('2023-01-01T00:00:00Z'); // UTC timestamp
  const isDST = date.utcOffset() !== january.utcOffset();

  if (!isDST) {
    // BE is not capable of returning correct timestamp if DST is not active
    // Related slack: https://crestalabs.slack.com/archives/C02KSA8BJA2/p1686558234068259
    // As per original TypeScript, assigns 'datePlusOneHour' (derived from the *initial* 'date').
    date = datePlusOneHour;
  }

  return date;
}

// --- Chart Specific Utilities (ported from chart utils) ---

/**
 * Maps a chart attribute metadata value to a string representation.
 * @param {object} [metadataForChart] - The metadata for the chart.
 * @param {object} [metadataValuesByName] - A dictionary of metadata values by name.
 * @returns {string|undefined} The string representation or undefined.
 */
function mapChartAttributeMetadataValueToString(
  metadataForChart,
  metadataValuesByName
) {
  const numericValueRange = metadataForChart?.numericValueRanges?.[0];
  if (numericValueRange) {
    // This function assumes 'numericValueRangeToString' is defined elsewhere in your code.
    return numericValueRangeToString(numericValueRange);
  }

  const metadataValue =
    metadataValuesByName?.[metadataForChart?.momentName || ''];

  if (metadataValue) {
    const stringValue = metadataForChart?.values?.[0]?.stringValue;
    if (stringValue !== undefined) {
      // Check for undefined explicitly
      const momentMetadataValue = metadataValue.find(
        (metadataAttribute) =>
          metadataAttribute.value?.stringValue ===
          metadataForChart?.values?.[0]?.stringValue
      );
      if (momentMetadataValue?.description) {
        return momentMetadataValue.description;
      }
      // This function assumes 'NO_VALUE_METADATA' and 'NO_VALUE_METADATA_LABEL' are defined elsewhere.
      return stringValue === NO_VALUE_METADATA
        ? NO_VALUE_METADATA_LABEL
        : stringValue;
    }

    const boolValue = metadataForChart?.values?.[0]?.booleanValue;
    if (boolValue !== undefined) {
      const momentMetadataValue = metadataValue.find(
        (metadataAttribute) =>
          metadataAttribute.value?.booleanValue ===
          metadataForChart?.values?.[0]?.booleanValue
      );
      return momentMetadataValue?.description || String(boolValue);
    }
  }

  return undefined;
}

// This is a simplified version. The actual implementation might be more complex,
// especially handling different types of ChartAttributeValue.
// You MUST adapt this function based on your actual `chartDataMaps` structure
// and the logic in your original `mapChartAttributeValueToString`.
function mapChartAttributeValueToString(value, chartDataMaps) {
  if (!value) {
    return '';
  }

  if (value.subcategoryValue) {
    const moment =
      chartDataMaps &&
      chartDataMaps.categoriesByName &&
      chartDataMaps.categoriesByName[value.subcategoryValue.momentName || ''];
    return `${moment && moment.displayName}${moment && moment.taxonomyState !== 'STATE_ACTIVE' ? ' (inactive)' : ''}`;
  }

  if (value.behaviorValue) {
    const behavior =
      chartDataMaps &&
      chartDataMaps.behaviorsByName &&
      chartDataMaps.behaviorsByName[value.behaviorValue.behaviorName || ''];
    const adherenceType =
      value.behaviorValue.adherenceTypes &&
      value.behaviorValue.adherenceTypes[0];
    if (adherenceType) {
      const formAdherenceType = ADHERENCE_TYPE_MAP_TO_FORM[adherenceType];
      if (formAdherenceType) {
        const adherenceTypeDisplayName =
          ADHERENCE_TYPE_MAP_TO_CHART_LABEL[formAdherenceType];
        return `${behavior && behavior.displayName} (${adherenceTypeDisplayName})`;
      }
    }
    return behavior && behavior.displayName;
  }

  if (value.sentimentValue) {
    return (
      chartDataMaps &&
      chartDataMaps.sentimentsByName &&
      chartDataMaps.sentimentsByName[value.sentimentValue.momentName || ''] &&
      chartDataMaps.sentimentsByName[value.sentimentValue.momentName || '']
        .displayName
    );
  }

  if (value.emotionValue) {
    return (
      chartDataMaps &&
      chartDataMaps.emotionsByName &&
      chartDataMaps.emotionsByName[value.emotionValue.momentName || ''] &&
      chartDataMaps.emotionsByName[value.emotionValue.momentName || '']
        .displayName
    );
  }

  if (value.metadataValue) {
    return mapChartAttributeMetadataValueToString(
      value.metadataValue,
      chartDataMaps && chartDataMaps.metadataValuesByName
    );
  }

  if (value.userNameValue) {
    const user =
      chartDataMaps &&
      chartDataMaps.usersByName &&
      chartDataMaps.usersByName[value.userNameValue || ''];
    return user ? displayUser(user) : undefined;
  }

  if (value.groupNameValue) {
    return (
      chartDataMaps &&
      chartDataMaps.groupsByName &&
      chartDataMaps.groupsByName[value.groupNameValue || ''] &&
      chartDataMaps.groupsByName[value.groupNameValue || ''].displayName
    );
  }

  if (value.timestamp) {
    return value.timestamp
      ? transformTimeStamp(value.timestamp).format(DateFormat.MonthDay)
      : '';
  }

  if (value.usecaseNameValue) {
    return (
      chartDataMaps &&
      chartDataMaps.usecasesByName &&
      chartDataMaps.usecasesByName[value.usecaseNameValue || ''] &&
      chartDataMaps.usecasesByName[value.usecaseNameValue || ''].displayName
    );
  }

  if (value.stringValue !== undefined) {
    return value.stringValue;
  }

  if (value.intValue !== undefined) {
    return String(value.intValue);
  }

  if (value.boolValue !== undefined) {
    return String(value.boolValue);
  }

  return JSON.stringify(value); // Fallback for unhandled types
}

// This is a simplified version. Adapt based on your original implementation.
function mapChartDataPointValueToString(value, metricConfig, isCSV = false) {
  if (value === undefined || value === null) return isCSV ? '' : '--';

  const aggregationOnAttribute =
    metricConfig?.forConversation?.statsType
      ?.aggregationOnConversationAttribute;
  if (aggregationOnAttribute) {
    switch (aggregationOnAttribute.aggregationAttribute) {
      case StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute.CONVERSATION_DURATION:
      case StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute.CONVERSATION_HANDLE_TIME:
        // Assuming value is in seconds, convert to HH:MM:SS or similar
        // This is a placeholder, implement proper duration formatting
        // return new Date(value * 1000).toISOString().substr(11, 8);
        return `${roundNumber(value / 60, 1)} min`; // Simplified
    }
  }

  if (
    metricConfig?.forConversation?.statsType?.commonStatsType ===
    'COMMON_STATS_TYPE_PERCENTAGE'
  ) {
    return formatPercentage(value * 100, isCSV ? 2 : 0);
  }
  if (
    metricConfig?.forSubcategory?.statsType?.commonStatsType ===
    'COMMON_STATS_TYPE_PERCENTAGE'
  ) {
    return formatPercentage(value * 100, isCSV ? 2 : 0);
  }
  // Add more specific formatting based on metricConfig if needed

  return String(roundNumber(value, 2)); // Default rounding
}

function getMetricFallbackName(chartDataMaps, chart) {
  const metric = chart?.dataConfig?.metrics?.[0];
  if (metric?.forConversation?.statsType?.commonStatsType) {
    return 'Conversations'; // Or a more specific name based on commonStatsType
  }
  if (
    metric?.forSubcategory?.subcategories?.length > 0 &&
    chartDataMaps?.moments
  ) {
    const firstSubcatName = metric.forSubcategory.subcategories[0].momentName;
    const moment = chartDataMaps.moments[firstSubcatName];
    return moment?.displayName || 'Occurrences';
  }
  return 'Value';
}

function chartHasConversationCountStatsType(chart) {
  const statsType = chart?.dataConfig?.metrics?.[0]?.forConversation?.statsType;
  return (
    statsType?.commonStatsType === 'COMMON_STATS_TYPE_CONVERSATION_COUNT' ||
    statsType?.commonStatsType === 'COMMON_STATS_TYPE_PERCENTAGE'
  ); // Consider percentage of convos
}

function metricIsOccurrenceCount(metric) {
  return metric?.forSubcategory || metric?.forEmotion; // Simplified check
}

function metricIsAveragePerConversation(metric) {
  const agg =
    metric?.forConversation?.statsType?.aggregationOnConversationAttribute
      ?.aggregationOperator;
  return agg === AggregationOperator.AGGREGATION_OPERATOR_AVG;
}

function getAggregationOnMetadataValue(metric) {
  return metric?.forConversation?.statsType?.aggregationOnMetadataValue
    ?.aggregationOperator;
}

function chartStatsTypeToChartLabel(chart, stats) {
  const metric = chart?.dataConfig?.metrics?.[0];
  if (metricIsOccurrenceCount(metric)) {
    return pluralize(stats, 'occurrence');
  }
  if (metricIsAveragePerConversation(metric)) {
    return 'average';
  }

  const aggregationOnMetadataValue = getAggregationOnMetadataValue(metric);
  if (
    aggregationOnMetadataValue &&
    aggregationOnMetadataValue !==
      AggregationOperator.AGGREGATION_OPERATOR_UNSPECIFIED
  ) {
    switch (aggregationOnMetadataValue) {
      case AggregationOperator.AGGREGATION_OPERATOR_AVG:
        return 'average';
      case AggregationOperator.AGGREGATION_OPERATOR_MAX:
        return 'maximum';
      case AggregationOperator.AGGREGATION_OPERATOR_MIN:
        return 'minimum';
      case AggregationOperator.AGGREGATION_OPERATOR_SUM:
        return 'total';
    }
  }

  switch (
    chart?.dataConfig?.metrics?.[0]?.forConversation?.statsType
      ?.aggregationOnConversationAttribute?.aggregationAttribute
  ) {
    case StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute.CONVERSATION_DURATION:
    case StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute.CONVERSATION_HANDLE_TIME:
      return ''; // Value itself is descriptive
    case StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute.CONVERSATION_MESSAGE_COUNT:
      return pluralize(stats, 'message');
    default:
      return pluralize(stats, 'conversation');
  }
}

// Simplified version of chartStatsToChartAggregation
function chartStatsToChartAggregation(chart, values, groupsAsFiltersTotal) {
  if (
    groupsAsFiltersTotal !== undefined &&
    chartHasConversationCountStatsType(chart)
  ) {
    return groupsAsFiltersTotal;
  }
  if (!values || values.length === 0) return 0;

  const metric = chart?.dataConfig?.metrics?.[0];
  const aggOp =
    metric?.forConversation?.statsType?.aggregationOnConversationAttribute
      ?.aggregationOperator || getAggregationOnMetadataValue(metric);

  switch (aggOp) {
    case AggregationOperator.AGGREGATION_OPERATOR_AVG:
      return values.length ? vanillaSum(values) / values.length : 0;
    case AggregationOperator.AGGREGATION_OPERATOR_MAX:
      return vanillaMax(values);
    case AggregationOperator.AGGREGATION_OPERATOR_MIN:
      return vanillaMin(values);
    case AggregationOperator.AGGREGATION_OPERATOR_SUM:
    default: // Includes COMMON_STATS_TYPE_CONVERSATION_COUNT, etc.
      return vanillaSum(values);
  }
}

// --- Core Data Transformation (ported from transformers.ts and hooks) ---
function mapEvaluationToCategoryAndSeriesData(evaluation) {
  const groupByValuesForAllKeys = evaluation.groupByValuesForAllKeys || []; // Ensure array for findIndex
  const timeSeriesAxis = groupByValuesForAllKeys.findIndex((groupByIndex) => {
    const groupByValue = groupByIndex.groupByValues?.[0]?.value;
    return (
      groupByValue !== undefined &&
      typeof groupByValue.timestamp !== 'undefined'
    );
  });

  const dataDimension =
    evaluation?.analyticsNumbers?.[0]?.groupByValueIndexes?.length || 0;

  return evaluation?.analyticsNumbers?.map((evaluationPoint) => {
    /* Determine which axis (grouping index) to use as the category.
       Priority:
         1. If a time series axis is detected, use that.
         2. Otherwise, if there is more than one dimension, choose the second axis (index 1).
         3. Otherwise, use the only dimension available (index 0). */
    const categoryAxis =
      timeSeriesAxis >= 0 ? timeSeriesAxis : dataDimension > 1 ? 1 : 0;

    // Determine which axis to use for the series. Only applicable if more than one dimension is available. Simply use the axis that is not used as the category axis.
    const seriesAxis =
      dataDimension > 1 ? (categoryAxis > 0 ? 0 : 1) : undefined;

    const categoryIndex = evaluationPoint.groupByValueIndexes?.[categoryAxis];
    const categoryGroupValues =
      evaluation.groupByValuesForAllKeys?.[categoryAxis]?.groupByValues;
    const category =
      categoryIndex !== undefined
        ? categoryGroupValues?.[categoryIndex]?.value
        : undefined;

    let seriesIndex;
    let seriesGroupValues;
    if (seriesAxis !== undefined) {
      seriesIndex = evaluationPoint.groupByValueIndexes?.[seriesAxis];
      seriesGroupValues =
        evaluation.groupByValuesForAllKeys?.[seriesAxis]?.groupByValues;
    }

    const name =
      seriesIndex !== undefined
        ? seriesGroupValues?.[seriesIndex]?.value
        : undefined;

    return {
      value: evaluationPoint.value,
      name,
      category
    };
  });
}

function getChartTooltipFormatter(point, chart, chartDataMaps) {
  // Added chartDataMaps
  const colorSquare = `<span style="display: inline-block; width: 10px; height: 10px; border-radius: 30%; background-color: ${typeof point.color === 'string' ? point.color : JSON.stringify(point.color)}; margin-right: 5px; vertical-align: middle;"></span>`;
  const formattedPointValue = `<strong>${mapChartDataPointValueToString(point.y, chart.dataConfig?.metrics?.[0])}</strong>`;
  const categoryDisplay = mapChartAttributeValueToString(
    point.category,
    chartDataMaps
  ); // Use mapped category

  switch (chart.renderingConfig?.chartDisplayType) {
    case ChartDisplayType.PIE_CHART: {
      // For pie charts, point.name is usually the category
      const pointNameDisplay = mapChartAttributeValueToString(
        { stringValue: point.name },
        chartDataMaps
      ); // Assuming point.name is a string label that might need mapping
      return `<div>${colorSquare}${pointNameDisplay}: ${formattedPointValue}</div>`;
    }
    case ChartDisplayType.LINE_CHART:
    case ChartDisplayType.BAR_CHART:
    default: {
      const seriesNameDisplay = mapChartAttributeValueToString(
        { stringValue: point.series.name },
        chartDataMaps
      ); // Assuming series.name might need mapping
      if (point.series.name && categoryDisplay !== seriesNameDisplay) {
        return `<div>${categoryDisplay}<br/>${colorSquare}${seriesNameDisplay}: ${formattedPointValue}</div>`;
      }
      return `<div>${categoryDisplay}: ${formattedPointValue}</div>`;
    }
  }
}

function getLineOrBarChartData(evaluation, chartDataMaps, chart) {
  const mappedData = mapEvaluationToCategoryAndSeriesData(evaluation)
    ?.map(({ category, name, value }) => ({
      value,
      name:
        name === undefined
          ? getMetricFallbackName(chartDataMaps, chart)
          : mapChartAttributeValueToString(name, chartDataMaps),
      category: mapChartAttributeValueToString(category, chartDataMaps)
    }))
    .filter(({ category, name, value }) =>
      [category, value, name].every(notUndefined)
    );

  if (!mappedData || mappedData.length === 0)
    return { categories: [], series: [], isSingleSeriesNumeric: false };

  const categories = [...new Set(mappedData.map((point) => point.category))];
  const groupedByName = vanillaGroupBy(mappedData, 'name');
  const seriesArray = Object.entries(groupedByName).map(([key, value]) => ({
    name: key,
    // Data will be processed based on whether it's a single series
    data: value.map((point) => ({ name: point.category, y: point.value }))
  }));

  // Check if it's effectively a single series (often when no specific 'groupBy' is used for series differentiation)
  if (seriesArray.length === 1) {
    // For single series, use concatenated category names for series name (as per working example)
    seriesArray[0].name = categories.join(', ');
    // And data should be an array of numbers
    seriesArray[0].data = categories.map((catName) => {
      const point = seriesArray[0].data.find((p) => p.name === catName);
      return point ? point.y : null; // or 0, depending on how you handle missing points for a category
    });
    return { categories, series: seriesArray, isSingleSeriesNumeric: true };
  }

  return { categories, series: seriesArray, isSingleSeriesNumeric: false };
}

function getPieChartData(evaluation, chartDataMaps, chart) {
  const data = mapEvaluationToCategoryAndSeriesData(evaluation)
    ?.map(({ name, category, value }) => ({
      value,
      // For pie charts, the 'name' is primary. It could come from 'name' or 'category' of the mapped data.
      name:
        mapChartAttributeValueToString(name, chartDataMaps) ||
        mapChartAttributeValueToString(category, chartDataMaps) ||
        getMetricFallbackName(chartDataMaps, chart)
    }))
    .filter(({ name, value }) => [value, name].every(notUndefined));

  if (!data) return [];

  return Object.entries(vanillaGroupBy(data, 'name'))
    .map(([key, value]) => ({
      name: key,
      y: vanillaSum(value.map((point) => point.value))
    }))
    .sort(compareNumbersByAccessor((v) => -v.y));
}

// --- Main Chart Option Generation Function ---
// (Ported and refactored from useChartEvaluationToRenderOptions)

/**
 * Generates Highcharts options object for a given chart configuration and data.
 *
 * @param {object} chart - The AnalyticsChart configuration object.
 * @param {object} evaluation - The EvaluationData object (specifically, one item from AnalyticsResult[]).
 * @param {object} chartDataMaps - An object mapping IDs/enums to display names, e.g.,
 *   {
 *     moments: { "moment_id_1": { displayName: "Moment 1" }, ... },
 *     users: { "user_id_1": { displayName: "User 1" }, ... },
 *     // ... other maps like metadataAttributes, usecases, etc.
 *   }
 *   This structure needs to be compatible with `mapChartAttributeValueToString`.
 * @returns {object} Highcharts.Options object.
 */
export function generateHighchartsOptions(chart, evaluation, chartDataMaps) {
  let options = JSON.parse(JSON.stringify(DEFAULT_CHART_OPTIONS)); // Deep clone default options

  options.title.text = chart.displayName || 'Chart';
  options.subtitle.text = generateSubtitleText(
    chart,
    evaluation,
    chartDataMaps
  );

  // Color logic: if single series (line/bar), use first color from config.
  const metricColors = chart.dataConfig?.metrics?.[0]?.renderingConfig?.colors;
  const chartType = chart?.renderingConfig?.chartDisplayType;

  let finalColors = STATIC_DEFAULT_COLORS;
  if (metricColors && metricColors.length > 0) {
    finalColors = metricColors;
  }

  let isSingleSeries = false;
  if (
    chartType === ChartDisplayType.LINE_CHART ||
    chartType === ChartDisplayType.BAR_CHART
  ) {
    // Tentatively check if it will be a single series. This is an approximation before calling getLineOrBarChartData.
    // A more robust way would be to get the series count from getLineOrBarChartData's result.
    isSingleSeries =
      (evaluation?.groupByValuesForAllKeys?.length || 0) <= 1 &&
      (!chart.dataConfig?.groupBy || chart.dataConfig.groupBy.length === 0);
    // This logic for isSingleSeries might need refinement based on how series are truly formed.
  }
  // If it's determined to be a single series and we have metricColors, take only the first one.
  if (isSingleSeries && metricColors && metricColors.length > 0) {
    options.colors = [metricColors[0]];
  } else {
    options.colors = finalColors;
  }

  switch (chartType) {
    case ChartDisplayType.BAR_CHART:
    case ChartDisplayType.LINE_CHART: {
      const chartDataResult = getLineOrBarChartData(
        evaluation,
        chartDataMaps,
        chart
      );
      options.chart.type =
        chartType === ChartDisplayType.LINE_CHART ? 'line' : 'column';

      options.xAxis.categories = chartDataResult.categories;
      // Specific plotOptions for column if BAR_CHART
      if (options.chart.type === 'column') {
        options.plotOptions.column = {
          ...options.plotOptions
            .column /* any BAR specific defaults from working example */
        };
      }

      options.xAxis.visible = true;

      options.yAxis.title = {
        text: ''
      };

      options.plotOptions.line = {
        marker: {
          enabled: false
        }
      };

      options.legend = {
        verticalAlign: 'top',
        align: 'center',
        layout: 'horizontal',
        symbolRadius: 3,
        enabled: true
      };

      // Filter and map series
      options.series = chartDataResult.series
        .filter(({ name }) =>
          chartDataResult.series.length > 1 ? !!name : true
        )
        .map((series) => ({
          type: options.chart.type,
          data: series.data,
          name: series.name,
          legendSymbol: 'rectangle',
          showInLegend: !!series.name,
          marker: {
            radius: 3,
            symbol: 'circle',
            enabled: series.data.length === 1
          }
        }));

      break;
    }
    case ChartDisplayType.PIE_CHART: {
      const chartData = getPieChartData(evaluation, chartDataMaps, chart);
      options.chart.type = 'pie';

      // --- Aggregation and helper values ---
      const aggregationStats = chartStatsToChartAggregation(
        chart,
        (evaluation?.analyticsNumbers || [])
          .map(({ value }) => value)
          .filter(notUndefined),
        evaluation?.groupsAsFiltersTotal
      );
      // For percentage calculation in legend, ungroupedTotal is preferred if available
      const totalForLegendPercentage =
        evaluation?.ungroupedTotal ||
        vanillaSum((chartData || []).map((p) => p.y));
      const hasConversationCountStatsType =
        chartHasConversationCountStatsType(chart);

      // Pie specific plotOptions (donut)
      const numCategories = (chartData || []).filter(
        (d) => (d.y ?? 0) > 0
      ).length;
      options.plotOptions.pie = {
        allowPointSelect: false,
        innerSize: '75%',
        borderWidth:
          numCategories === 1 ||
          numCategories >= DONUT_CHART_MAX_CATEGORIES_WITH_PADDING_LIMIT
            ? 0
            : 1,
        borderRadius:
          numCategories >= DONUT_CHART_MAX_CATEGORIES_WITH_PADDING_LIMIT
            ? 0
            : 5,
        dataLabels: {
          enabled: false // Labels on slices disabled, will use legend and center text
        },
        showInLegend: true
      };

      options.series = [
        {
          type: 'pie',
          name:
            chart.displayName ||
            getMetricFallbackName(chartDataMaps, chart) ||
            'Series',
          innerSize: '75%',
          data: chartData
        }
      ];

      // --- Legend configuration ---
      options.legend = {
        enabled: true,
        verticalAlign: 'middle',
        align: 'right',
        layout: 'vertical',
        itemStyle: {
          lineHeight: '22px',
          fontSize: '13px',
          fontWeight: 'normal'
        }
      };
      break;
    }
    default: {
      const chartDataResult = getLineOrBarChartData(
        evaluation,
        chartDataMaps,
        chart
      ); // Fallback to line
      options.chart.type = 'line';
      options.xAxis.categories = chartDataResult.categories;
      options.series = chartDataResult.series;
      break;
    }
  }

  // Tooltip formatter (ensure it's assigned correctly)
  options.tooltip.formatter = function () {
    // `this` is the Point object in Highcharts
    return getChartTooltipFormatter(this, chart, chartDataMaps);
  };

  // Disable interactive/animation features for static PNG generation
  if (!options.plotOptions) options.plotOptions = {};
  if (!options.plotOptions.series) options.plotOptions.series = {};
  Object.assign(options.plotOptions.series, {
    animation: false,
    enableMouseTracking: false,
    states: { hover: { enabled: false } }
  });

  // Clean up empty plotOptions keys if they weren't populated for the specific chart type
  if (options.chart.type !== 'line' && options.chart.type !== 'spline')
    delete options.plotOptions.line;
  if (options.chart.type !== 'column' && options.chart.type !== 'bar')
    delete options.plotOptions.column;
  if (Object.keys(options.plotOptions).length === 0) delete options.plotOptions;

  return options;
}

// Placeholder for subtitle generation - IMPLEMENT THIS LOGIC
function generateSubtitleText(chart, evaluation, chartDataMaps) {
  // Category summary
  const categoriesRaw =
    evaluation?.groupByValuesForAllKeys?.[0]?.groupByValues ?? [];
  const categories = categoriesRaw
    .map((gv) => mapChartAttributeValueToString(gv.value, chartDataMaps))
    .filter(Boolean);
  let categorySummary = categories.length ? categories[0] : 'All Data';
  if (categories.length > 1) {
    categorySummary += ` +${categories.length - 1}`;
  }

  // Use-case name (first matching filter)
  let usecaseName = 'All Usecases';
  try {
    const usecaseFilter = chart?.dataConfig?.filters?.find((f) =>
      f.valueSet?.singleValues?.attributeValues?.some(
        (av) => av.usecaseNameValue
      )
    );
    if (usecaseFilter) {
      const av = usecaseFilter.valueSet.singleValues.attributeValues.find(
        (v) => v.usecaseNameValue
      );
      const ucKey = av.usecaseNameValue;
      usecaseName =
        chartDataMaps?.usecases?.[ucKey]?.displayName || ucKey || usecaseName;
    }
  } catch (_) {
    /* silent */
  }

  // Date range extraction (very simplified)
  let dateRange = 'All Time';
  const dateFilter = chart?.dataConfig?.filters?.find(
    (f) => f.valueSet?.rangeValues?.rangeValues?.length
  );
  if (dateFilter) {
    const relDays =
      dateFilter.valueSet.rangeValues.rangeValues[0]?.fromValue
        ?.relativeTimestamp?.durationBeforeNow?.days;
    if (relDays === 7) dateRange = 'Last 7 days';
    else if (relDays === 30) dateRange = 'Last 30 days';
    else if (relDays) dateRange = `Last ${relDays} days`;
    else dateRange = 'Custom Range';
  }

  return `${categorySummary}, ${usecaseName}, ${dateRange}`;
}

// --- Example Usage (for testing in Node.js) ---

// const { encode } = require('js-base64'); // Not directly used by generateHighchartsOptions itself but by original full tooltip logic

// 1. Your Chart Config (AnalyticsChart)
// const chartConfig = {
//   "name": "customers/cresta/profiles/walter-dev/analyticsCharts/5a2366f5-7088-4354-91d7-2516f183fbda",
//   "state": "ACTIVE",
//   "displayName": "Subcategory Count (Line)",
//   // ... (rest of your chart config from the example)
//   "dataConfig": {
//     "metrics": [
//       {
//         "renderingConfig": { "colors": ["#228BE6", "#FD7E14", "#2F9E44", "#5246E0", "#E03131"] },
//         "forSubcategory": {
//           "subcategories": [
//             { "momentName": "moment1" }, { "momentName": "moment2" },
//             { "momentName": "moment3" }, { "momentName": "moment4" }, { "momentName": "moment5" }
//           ],
//           "statsType": { "commonStatsType": "COMMON_STATS_TYPE_CONVERSATION_COUNT" }
//         }
//       }
//     ],
//     "filters": [], // Simplified for this example
//     "groupBy": []  // Simplified
//   },
//   "renderingConfig": { "chartDisplayType": "LINE_CHART" } // Or BAR_CHART, PIE_CHART
// };

// // 2. Your Evaluation Data (AnalyticsResult, i.e., one element from resultForChart.analyticsResults)
// const evaluationData = {
//   "groupByValuesForAllKeys": [
//     {
//       "groupByValues": [
//         { "value": { "subcategoryValue": { "momentName": "moment1" } } },
//         { "value": { "subcategoryValue": { "momentName": "moment2" } } },
//         { "value": { "subcategoryValue": { "momentName": "moment3" } } },
//         { "value": { "subcategoryValue": { "momentName": "moment4" } } },
//         { "value": { "subcategoryValue": { "momentName": "moment5" } } }
//       ]
//     }
//   ],
//   "analyticsNumbers": [
//     { "value": 10, "groupByValueIndexes": [0] },
//     { "value": 44, "groupByValueIndexes": [1] },
//     { "value": 42, "groupByValueIndexes": [2] },
//     { "value": 81, "groupByValueIndexes": [3] }, // Changed from 481 for smaller scale
//     { "value": 5, "groupByValueIndexes": [4] }
//   ]
//   // groupsAsFiltersTotal: 182, // If you have this pre-calculated and needed for pie charts
// };

// // 3. Your Chart Data Maps (crucial for display names)
// const chartDataMaps = {
//   moments: {
//     "moment1": { displayName: "Cancellation Intent" },
//     "moment2": { displayName: "Escalation Request" },
//     "moment3": { displayName: "Positive Feedback" },
//     "moment4": { displayName: "Technical Issue" },
//     "moment5": { displayName: "Greeting" }
//   },
//   // users: { ... }, metadataAttributes: { ... }, etc.
// };

// // Generate the options
// const highchartsOptions = generateHighchartsOptions(chartConfig, evaluationData, chartDataMaps);

// console.log(JSON.stringify(highchartsOptions, null, 2));

// You would then send this `highchartsOptions` JSON to your Highcharts export server.

// Export the main function if you are using module system in Node.js (e.g. CommonJS)
// module.exports = {
//   generateHighchartsOptions,
//   ChartDisplayType, // Export if needed by the calling script for logic
//   AggregationOperator, // Export if needed
//   // ... other constants or helper functions you might want to expose ...
//   // For now, primarily exporting the main generator and key enums
//   mapChartAttributeValueToString, // Might be useful for debugging or direct use
//   mapChartDataPointValueToString,
//   getMetricFallbackName,
//   mapEvaluationToCategoryAndSeriesData, // Exposing core transformers can be useful
//   getLineOrBarChartData,
//   getPieChartData
// };

// If not using modules, ensure generateHighchartsOptions and its dependencies are in scope.

// chartGenerationCore.js
// Ensure 'lodash', 'js-base64', and 'highcharts' are available in your Node.js environment.
// const { encode } = require('js-base64');
// const Highcharts = require('highcharts');
// You might need to initialize Highcharts with modules like export-data, accessibility, etc., if needed,
// e.g., require('highcharts/modules/exporting')(Highcharts);

import lodash from 'lodash';
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
    spacingBottom: 5
    // marginTop: 120 // Added margin
    //marginTop: 10
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

function pluralize(count, singular, plural) {
  return count === 1
    ? singular
    : plural === undefined
      ? `${singular}s`
      : plural;
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
export function mapChartDataPointValueToString(value, metric, showRawValue) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (value === 0) {
    return value.toString();
  }

  if (
    metric &&
    'forConversation' in metric &&
    (metric.forConversation?.statsType?.aggregationOnConversationAttribute
      ?.aggregationAttribute ===
      StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute.CONVERSATION_HANDLE_TIME ||
      metric.forConversation?.statsType?.aggregationOnConversationAttribute
        ?.aggregationAttribute ===
        StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute.CONVERSATION_DURATION)
  ) {
    // Ensure value is treated as a number before floor, although the initial check handles null/undefined
    const numericValue = Number(value);
    // Add a check for NaN in case the conversion fails, though unlikely given the initial checks
    if (!isNaN(numericValue)) {
      return convertSecondsIntoMinuteAndSecondsString(Math.floor(numericValue));
    } else {
      // Handle the case where value is surprisingly not convertible to a number
      return undefined; // Or some other fallback representation
    }
  }

  // Ensure value is treated as a number before potential operations in suffixNumberMagnitude/roundNumber
  const numericValue = Number(value);
  if (isNaN(numericValue)) {
    // Handle the case where value is surprisingly not convertible to a number
    return undefined; // Or some other fallback representation
  }

  console.log('value', numericValue);
  return showRawValue
    ? numericValue.toString()
    : suffixNumberMagnitude(roundNumber(numericValue));
}

function getMetricFallbackName(chartDataMaps, chart) {
  // Use optional chaining to safely access nested properties
  const subtitleArray = mapChartMetricsValueToSubtitleString(
    chart?.dataConfig?.metrics?.[0],
    chartDataMaps
  );

  // Use optional chaining again before calling join, and fallback to '' if the result is null/undefined
  return subtitleArray?.join(', ') || '';
}
function mapChartMetricsValueToSubtitleString(
  metric,
  chartDataMaps,
  previewMode
) {
  if (!metric) {
    return undefined;
  }

  // Helper for filtering undefined/null values
  const isDefined = (v) => v !== undefined && v !== null;

  if ('forSubcategory' in metric) {
    const metricLabels = metric.forSubcategory?.subcategories
      ?.map(
        (subcategory) =>
          chartDataMaps?.categoriesByName?.[subcategory.momentName || '']
            ?.displayName
      )
      .filter(isDefined); // Use helper or inline check

    if (!metricLabels) return undefined; // Handle case where map/filter results in undefined

    // Assumes countBy is available (e.g., from Lodash)
    return previewMode
      ? Object.entries(countBy(metricLabels)).map(
          ([metricName, count]) =>
            `${metricName}${count > 1 ? ` (${count})` : ''}`
        )
      : metricLabels;
  }

  if ('forBehavior' in metric) {
    return metric.forBehavior?.behaviors
      ?.map(
        (behavior) =>
          chartDataMaps?.behaviorsByName?.[behavior.behaviorName || '']
            ?.displayName
      )
      .filter(isDefined); // Use helper or inline check
  }

  if ('forSentiment' in metric) {
    return metric.forSentiment?.sentiments
      ?.map(
        (sentiment) =>
          chartDataMaps?.sentimentsByName?.[sentiment.momentName || '']
            ?.displayName
      )
      .filter(isDefined); // Use helper or inline check
  }

  if ('forEmotion' in metric) {
    return metric.forEmotion?.emotions
      ?.map(
        (emotion) =>
          chartDataMaps?.emotionsByName?.[emotion.momentName || '']?.displayName
      )
      .filter(isDefined); // Use helper or inline check
  }

  if ('forMetadata' in metric) {
    const statsType = metric.forMetadata?.statsType;
    const metadata = metric.forMetadata?.metadatas;
    if (!statsType || !metadata) {
      return ['-'];
    }

    if ('aggregationOnMetadataValue' in statsType) {
      let prefix = '-';
      if (metadata[0]?.momentName) {
        const metadataMoment =
          chartDataMaps?.metadataByName?.[metadata[0].momentName];
        if (metadataMoment) {
          prefix = metadataMoment.displayName;
        }
      }

      // Ensure CHART_AGGREGATOR_OPERATOR_DETAILS and AggregationOperator are defined
      const aggregationOperator =
        statsType.aggregationOnMetadataValue?.aggregationOperator ||
        AggregationOperator.AGGREGATION_OPERATOR_UNSPECIFIED;
      const suffix =
        CHART_AGGREGATOR_OPERATOR_DETAILS[aggregationOperator]?.subTitleLabel;

      return [`${prefix}${suffix ? ` (${suffix})` : ''}`];
    }

    // Assumes mapChartAttributeMetadataValueToString is available
    return metadata.map(
      (m) =>
        mapChartAttributeMetadataValueToString(
          m,
          chartDataMaps?.metadataValuesByName
        ) || '-'
    );
  }

  if ('forConversation' in metric) {
    let prefix; // Removed : string type annotation
    // Ensure CHART_AGGREGATOR_OPERATOR_DETAILS and AggregationOperator are defined
    const aggregationOperator =
      metric.forConversation?.statsType?.aggregationOnConversationAttribute
        ?.aggregationOperator ||
      AggregationOperator.AGGREGATION_OPERATOR_UNSPECIFIED;
    const suffix =
      CHART_AGGREGATOR_OPERATOR_DETAILS[aggregationOperator]?.subTitleLabel;

    // Ensure StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute and CommonStatsType are defined
    const aggregationAttribute =
      metric.forConversation?.statsType?.aggregationOnConversationAttribute
        ?.aggregationAttribute;
    switch (aggregationAttribute) {
      case StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute.CONVERSATION_HANDLE_TIME:
        prefix = 'Handle Time (Cresta AHT)';
        break;
      case StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute.CONVERSATION_DURATION:
        prefix = 'Duration';
        break;
      case StatsTypeForConversationAggregationOnConversationAttributeAggregationAttribute.CONVERSATION_MESSAGE_COUNT:
        prefix = 'Conversation messages';
        break;
      default:
        switch (metric.forConversation?.statsType?.commonStatsType) {
          case CommonStatsType.COMMON_STATS_TYPE_OCCURRENCE_COUNT:
            prefix = 'Occurrence per conversation';
            break;
          default:
            prefix = 'Conversations';
        }
    }

    return [`${prefix}${suffix ? ` (${suffix})` : ''}`];
  }

  return undefined;
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

export function chartStatsTypeToChartLabel(chart, stats) {
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
export function chartStatsToChartAggregation(
  chart,
  values,
  groupsAsFiltersTotal
) {
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
  // Use optional chaining ?. to safely call map if mapEvaluationToCategoryAndSeriesData returns undefined
  const dataPoints = mapEvaluationToCategoryAndSeriesData(evaluation);

  const processedData = dataPoints
    ?.map(({ category, name, value }) => ({
      value,
      name:
        name === undefined
          ? getMetricFallbackName(chartDataMaps, chart)
          : mapChartAttributeValueToString(name, chartDataMaps),
      category: mapChartAttributeValueToString(category, chartDataMaps)
    }))
    // Ensure filter is only called if the map result is an array
    .filter(({ category, name, value }) =>
      [category, value, name].every((v) => v !== undefined && v !== null)
    ); // Use explicit check instead of notUndefined if preferred

  // Handle the case where processedData might be undefined after the map/filter chain
  if (!processedData) {
    return { categories: [], series: [] };
  }

  const categories = lodash.uniq(processedData.map((point) => point.category)); // Removed !

  const series = Object.entries(lodash.groupBy(processedData, 'name')).map(
    ([key, value]) => ({
      name: key,
      // Ensure value is an array before mapping
      data: Array.isArray(value)
        ? value.map(({ category, value: pointValue }) => ({
            // Renamed 'value' to 'pointValue' to avoid shadowing
            name: category, // Removed !
            y: pointValue // Removed !
          }))
        : []
    })
  );

  return {
    categories: categories || [], // Ensure categories is an array
    series: series || [] // Ensure series is an array
  };
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

      options.xAxis = {
        categories: chartDataResult.categories
      };

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

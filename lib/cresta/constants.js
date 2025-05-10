import {
  BLUE_COLORS,
  CYAN_COLORS,
  DARK_COLORS,
  GENAI_COLORS,
  GRAY_COLORS,
  GREEN_COLORS,
  LIME_COLORS,
  ORANGE_COLORS,
  PINK_COLORS,
  PRIMARY_COLORS,
  RED_COLORS,
  YELLOW_COLORS,
  AdherenceType,
  AggregationOperator,
  BehaviorForChartAdherenceType,
  ChartGroupByTimeInterval,
  ConversationAttribute,
  MetricStatsType
} from './enums.js';

export const NO_VALUE_METADATA_LABEL = '(no value)';
export const NO_VALUE_METADATA = '#NO_VALUE_METADATA#';

const invert = (obj) => {
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[obj[key]] = key;
    }
  }
  return newObj;
};

export const LOCAL_STORAGE_KEY_CUSTOM_COLOR_SETTINGS =
  'director-custom-color-settings';

export const COLOR_SETTING_PRESETS = [
  {
    id: 'multi1',
    name: 'Multi',
    isPreset: true,
    colors: [
      BLUE_COLORS[6],
      ORANGE_COLORS[6],
      GREEN_COLORS[8],
      GENAI_COLORS[7],
      RED_COLORS[8],
      CYAN_COLORS[6],
      YELLOW_COLORS[5],
      PINK_COLORS[4],
      GRAY_COLORS[6],
      LIME_COLORS[4]
    ]
  },
  {
    id: 'red',
    name: 'Red',
    isPreset: true,
    colors: [...RED_COLORS].reverse()
  },
  {
    id: 'pink',
    name: 'Pink',
    isPreset: true,
    colors: [...PINK_COLORS].reverse()
  },
  {
    id: 'primary',
    name: 'Indigo',
    isPreset: true,
    colors: [...PRIMARY_COLORS].reverse()
  },
  {
    id: 'genai',
    name: 'Violet',
    isPreset: true,
    colors: [...GENAI_COLORS].reverse()
  },
  {
    id: 'blue',
    name: 'Blue',
    isPreset: true,
    colors: [...BLUE_COLORS].reverse()
  },
  {
    id: 'cyan',
    name: 'Cyan',
    isPreset: true,
    colors: [...CYAN_COLORS].reverse()
  },
  {
    id: 'green',
    name: 'Green',
    isPreset: true,
    colors: [...GREEN_COLORS].reverse()
  },
  {
    id: 'lime',
    name: 'Lime',
    isPreset: true,
    colors: [...LIME_COLORS].reverse()
  },
  {
    id: 'yellow',
    name: 'Yellow',
    isPreset: true,
    colors: [...YELLOW_COLORS].reverse()
  },
  {
    id: 'orange',
    name: 'Orange',
    isPreset: true,
    colors: [...ORANGE_COLORS].reverse()
  },
  {
    id: 'dark',
    name: 'Gray',
    isPreset: true,
    colors: [...DARK_COLORS].reverse()
  }
];

export const DASHBOARD_DEFAULT_FORM_VALUES = {
  displayName: '',
  description: '',
  roles: []
};

export const METRIC_STATS_TYPE_DETAILS = {
  [MetricStatsType.CONVERSATION_COUNT]: {
    displayName: 'Conversation count'
  },
  [MetricStatsType.OCCURRENCE_COUNT]: {
    displayName: 'Occurrence count'
  },
  [MetricStatsType.AGGREGATION_ON_OCCURRENCE_COUNT_PER_CONVERSATION]: {
    displayName: 'Average per conversation'
  },
  [MetricStatsType.HANDLE_TIME]: {
    displayName: 'Handle Time'
  },
  [MetricStatsType.DURATION]: {
    displayName: 'Duration'
  },
  [MetricStatsType.MESSAGE_COUNT]: {
    displayName: 'Message Count'
  },
  [MetricStatsType.AGGREGATION_ON_METADATA_VALUE]: {
    displayName: 'Aggregation on metadata value'
  }
};

export const CHART_GROUP_BY_TIME_INTERVAL_DETAILS = {
  [ChartGroupByTimeInterval.INTERVAL_UNSPECIFIED]: {
    displayName: 'No time breakdown'
  },
  [ChartGroupByTimeInterval.DAY]: {
    displayName: 'Day',
    subTitleLabel: 'Daily'
  },
  [ChartGroupByTimeInterval.WEEK]: {
    displayName: 'Week',
    subTitleLabel: 'Weekly'
  },
  [ChartGroupByTimeInterval.MONTH]: {
    displayName: 'Month',
    subTitleLabel: 'Monthly'
  }
};

export const CHART_AGGREGATOR_OPERATOR_DETAILS = {
  [AggregationOperator.AGGREGATION_OPERATOR_AVG]: {
    displayName: 'Average',
    subTitleLabel: 'Avg'
  },
  [AggregationOperator.AGGREGATION_OPERATOR_SUM]: {
    displayName: 'Sum',
    subTitleLabel: 'Sum'
  },
  [AggregationOperator.AGGREGATION_OPERATOR_MAX]: {
    displayName: 'Max',
    subTitleLabel: 'Max'
  },
  [AggregationOperator.AGGREGATION_OPERATOR_MIN]: {
    displayName: 'Min',
    subTitleLabel: 'Min'
  },
  [AggregationOperator.AGGREGATION_OPERATOR_P25]: {
    displayName: '25th Percentile',
    subTitleLabel: 'P25'
  },
  [AggregationOperator.AGGREGATION_OPERATOR_P50]: {
    displayName: 'Median',
    subTitleLabel: 'P50'
  },
  [AggregationOperator.AGGREGATION_OPERATOR_P75]: {
    displayName: '75th Percentile',
    subTitleLabel: 'P75'
  },
  [AggregationOperator.AGGREGATION_OPERATOR_UNSPECIFIED]: {
    displayName: ''
  }
};

export const CONVERSATION_ATTRIBUTE_OPTIONS = [
  ConversationAttribute.CONVERSATION_COUNT,
  ConversationAttribute.MESSAGE_COUNT,
  ConversationAttribute.HANDLE_TIME
];

export const ADHERENCE_TYPE_MAP_TO_API = {
  [AdherenceType.ADHERENCE_TYPE_UNSPECIFIED]:
    BehaviorForChartAdherenceType.ADHERENCE_TYPE_UNSPECIFIED,
  [AdherenceType.ADHERENCE_TYPE_DID_DO_X]:
    BehaviorForChartAdherenceType.ADHERENCE_TYPE_DID_DO_X,
  [AdherenceType.ADHERENCE_TYPE_DID_NOT_DO_X]:
    BehaviorForChartAdherenceType.ADHERENCE_TYPE_DID_NOT_DO_X,
  [AdherenceType.ADHERENCE_TYPE_SHOULD_DO_X]:
    BehaviorForChartAdherenceType.ADHERENCE_TYPE_SHOULD_DO_X,
  [AdherenceType.ADHERENCE_TYPE_NO_OPPORTUNITY_TO_DO_X]:
    BehaviorForChartAdherenceType.ADHERENCE_TYPE_NO_OPPORTUNITY_TO_DO_X
};

export const ADHERENCE_TYPE_MAP_TO_CHART_LABEL = {
  [AdherenceType.ADHERENCE_TYPE_DID_DO_X]: 'Done',
  [AdherenceType.ADHERENCE_TYPE_DID_NOT_DO_X]: 'Not done',
  [AdherenceType.ADHERENCE_TYPE_NO_OPPORTUNITY_TO_DO_X]: 'No opportunity'
};

export const ADHERENCE_TYPE_MAP_TO_FORM = invert(ADHERENCE_TYPE_MAP_TO_API);

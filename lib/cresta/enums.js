// Color definitions (simplified)
export const BLUE_COLORS = [
  '#E7F5FF',
  '#D0EBFF',
  '#A5D8FF',
  '#74C0FC',
  '#4DABF7',
  '#339AF0',
  '#228BE6',
  '#1C7ED6',
  '#1971C2',
  '#1864AB'
];
export const ORANGE_COLORS = [
  '#FFF4E6',
  '#FFE8CC',
  '#FFD8A8',
  '#FFC078',
  '#FFA94D',
  '#FF922B',
  '#FD7E14',
  '#F76707',
  '#E8590C',
  '#D9480F'
];
export const GREEN_COLORS = [
  '#EBFBEE',
  '#D3F9D8',
  '#B2F2BB',
  '#8CE99A',
  '#69DB7C',
  '#51CF66',
  '#40C057',
  '#37B24D',
  '#2F9E44',
  '#2B8A3E'
];
export const GENAI_COLORS = [
  // Assuming GENAI_COLORS are like 'grape' or 'violet'
  '#F3F0FF',
  '#E5DBFF',
  '#C9BFFF',
  '#AC9FFF',
  '#917FFF',
  '#7A63FF',
  '#6C4EFF',
  '#5F3DCF',
  '#5132B8',
  '#4527A0'
];
export const RED_COLORS = [
  '#FFF5F5',
  '#FFE3E3',
  '#FFC9C9',
  '#FFA8A8',
  '#FF8787',
  '#FF6B6B',
  '#FA5252',
  '#F03E3E',
  '#E03131',
  '#C92A2A'
];
export const CYAN_COLORS = [
  '#E3FAFC',
  '#C5F6FA',
  '#99E9F2',
  '#66D9E8',
  '#3BC9DB',
  '#22B8CF',
  '#15AABF',
  '#1098AD',
  '#0C8599',
  '#0B7285'
];
export const YELLOW_COLORS = [
  '#FFF9DB',
  '#FFF3BF',
  '#FFEC99',
  '#FFE066',
  '#FFD43B',
  '#FCC419',
  '#FAB005',
  '#F59F00',
  '#F08C00',
  '#E67700'
];
export const PINK_COLORS = [
  '#FFF0F6',
  '#FFDEEB',
  '#FCC2D7',
  '#FAA2C1',
  '#F783AC',
  '#F06595',
  '#E64980',
  '#D6336C',
  '#C2255C',
  '#A61E4D'
];
export const GRAY_COLORS = [
  // Typically a subset of DARK_COLORS or specific grays
  '#F8F9FA',
  '#F1F3F5',
  '#E9ECEF',
  '#DEE2E6',
  '#CED4DA',
  '#ADB5BD',
  '#868E96',
  '#495057',
  '#343A40',
  '#212529'
];
export const LIME_COLORS = [
  '#F4FCE3',
  '#EAF7C8',
  '#DFF2A8',
  '#D2EC8A',
  '#C5E56C',
  '#B8DE53',
  '#A9D73B',
  '#9CCC25',
  '#8FB117',
  '#79990B'
];
export const DARK_COLORS = [
  // Usually shades of gray to black
  '#C1C2C5',
  '#A6A7AB',
  '#909296',
  '#5C5F66',
  '#373A40',
  '#2C2E33',
  '#25262B',
  '#1A1B1E',
  '#141517',
  '#101113'
];
export const PRIMARY_COLORS = BLUE_COLORS; // Assuming primary is blue for this example

// Enum-like objects
export const AdherenceType = {
  ADHERENCE_TYPE_UNSPECIFIED: 'ADHERENCE_TYPE_UNSPECIFIED',
  ADHERENCE_TYPE_DID_DO_X: 'ADHERENCE_TYPE_DID_DO_X',
  ADHERENCE_TYPE_DID_NOT_DO_X: 'ADHERENCE_TYPE_DID_NOT_DO_X',
  ADHERENCE_TYPE_SHOULD_DO_X: 'ADHERENCE_TYPE_SHOULD_DO_X',
  ADHERENCE_TYPE_NO_OPPORTUNITY_TO_DO_X: 'ADHERENCE_TYPE_NO_OPPORTUNITY_TO_DO_X'
};

export const AggregationOperator = {
  AGGREGATION_OPERATOR_AVG: 'AGGREGATION_OPERATOR_AVG',
  AGGREGATION_OPERATOR_SUM: 'AGGREGATION_OPERATOR_SUM',
  AGGREGATION_OPERATOR_MAX: 'AGGREGATION_OPERATOR_MAX',
  AGGREGATION_OPERATOR_MIN: 'AGGREGATION_OPERATOR_MIN',
  AGGREGATION_OPERATOR_P25: 'AGGREGATION_OPERATOR_P25',
  AGGREGATION_OPERATOR_P50: 'AGGREGATION_OPERATOR_P50',
  AGGREGATION_OPERATOR_P75: 'AGGREGATION_OPERATOR_P75',
  AGGREGATION_OPERATOR_UNSPECIFIED: 'AGGREGATION_OPERATOR_UNSPECIFIED'
};

export const BehaviorForChartAdherenceType = {
  ADHERENCE_TYPE_UNSPECIFIED: 'ADHERENCE_TYPE_UNSPECIFIED',
  ADHERENCE_TYPE_DID_DO_X: 'ADHERENCE_TYPE_DID_DO_X',
  ADHERENCE_TYPE_DID_NOT_DO_X: 'ADHERENCE_TYPE_DID_NOT_DO_X',
  ADHERENCE_TYPE_SHOULD_DO_X: 'ADHERENCE_TYPE_SHOULD_DO_X',
  ADHERENCE_TYPE_NO_OPPORTUNITY_TO_DO_X: 'ADHERENCE_TYPE_NO_OPPORTUNITY_TO_DO_X'
};

export const ChartGroupByTimeInterval = {
  INTERVAL_UNSPECIFIED: 'INTERVAL_UNSPECIFIED',
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH'
};

// Local types that were in constants.ts, now represented as simple objects/values
// These were mostly used for typing and structure, so their JS representation might be simpler
// or embodied directly in the constants that use them.

export const ConversationAttribute = {
  CONVERSATION_COUNT: 'CONVERSATION_COUNT',
  MESSAGE_COUNT: 'MESSAGE_COUNT',
  HANDLE_TIME: 'HANDLE_TIME'
};

export const MetricStatsType = {
  CONVERSATION_COUNT: 'CONVERSATION_COUNT',
  OCCURRENCE_COUNT: 'OCCURRENCE_COUNT',
  AGGREGATION_ON_OCCURRENCE_COUNT_PER_CONVERSATION:
    'AGGREGATION_ON_OCCURRENCE_COUNT_PER_CONVERSATION',
  HANDLE_TIME: 'HANDLE_TIME',
  DURATION: 'DURATION',
  MESSAGE_COUNT: 'MESSAGE_COUNT',
  AGGREGATION_ON_METADATA_VALUE: 'AGGREGATION_ON_METADATA_VALUE'
};

export const CommonStatsType = {
  /**
   * Invalid value.
   **/
  COMMON_STATS_TYPE_UNSPECIFIED: 'COMMON_STATS_TYPE_UNSPECIFIED',
  /**
   * Count of involved conversations.
   * Other common stats type could be message_count or agent_count.
   **/
  COMMON_STATS_TYPE_CONVERSATION_COUNT: 'COMMON_STATS_TYPE_CONVERSATION_COUNT',
  /**
   * Count of occurrences of the specified cresta entity.
   **/
  COMMON_STATS_TYPE_OCCURRENCE_COUNT: 'COMMON_STATS_TYPE_OCCURRENCE_COUNT'
};

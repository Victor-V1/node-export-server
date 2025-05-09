import { generateHighchartsOptions } from './chartGenerationCore.js';

export const chartConfigMiddleware = async (req, res, next) => {
  try {
    const { chartConfig, evaluationData, chartDataMaps } = req.body;

    if (!chartConfig || !evaluationData || !chartDataMaps) {
      return res.status(400).json({
        error:
          'Missing required parameters: chartConfig, evaluationData, or chartDataMaps must be provided in the request body.'
      });
    }

    // Generate the Highcharts options (this is the content for `infile`)
    const highchartsOptionsObject = generateHighchartsOptions(
      chartConfig,
      evaluationData,
      chartDataMaps
    );

    // Determine if the chart is a pie chart and has conversation count stats type
    const isPieChart =
      chartConfig?.renderingConfig?.chartDisplayType === 'PIE_CHART';
    let hasConversationCountStatsType = false;
    if (
      chartConfig?.dataConfig?.metrics?.[0]?.forSentiment?.statsType
        ?.commonStatsType === 'COMMON_STATS_TYPE_CONVERSATION_COUNT'
    ) {
      hasConversationCountStatsType = true;
    }

    let customCode = '';
    if (isPieChart) {
      // Calculate ungroupedTotal for pie chart legend if evaluationData and analyticsNumbers are present
      const ungroupedTotal =
        evaluationData?.analyticsNumbers?.reduce(
          (sum, item) => sum + (item.value || 0),
          0
        ) || 1;

      customCode = `
Highcharts.setOptions({
  legend: {
    labelFormatter: function () {
      const legendDataPoint = this;
      const dataPoint = {
        name: legendDataPoint.name,
        percentage: ((legendDataPoint.y ?? 0) / (${ungroupedTotal})) * 100,
        color: typeof legendDataPoint.color === 'string' ? legendDataPoint.color : JSON.stringify(legendDataPoint.color),
        y: legendDataPoint.y
      };
      const percentage = (dataPoint.percentage ?? 0).toFixed(2) + '%';
      const formattedValue = Math.round(dataPoint.y ?? 0); // replace with your suffix logic if needed
      return \`
        <div class='legend-item' style='display: flex; align-items: center; white-space: nowrap; width: 100%;'>
          <div style='width: 12px; height: 12px; flex-shrink: 0; border-radius: 2px; margin-right: 8px; background-color: \${dataPoint.color};'></div>
          <span style='font-size: 13px; overflow: hidden; text-overflow: ellipsis;'>\${dataPoint.name}</span>
          <span style='font-size: 13px; margin-left: 4px; flex-shrink: 0;'>: <strong>\${formattedValue}</strong></span>
          ${hasConversationCountStatsType ? `<span style='background-color: #E9ECEF; border-radius: 4px; padding: 1px 4px; font-size: 12px; line-height: 16px; color: #343A40; font-weight: 500; margin-left: 8px; flex-shrink: 0; display: inline-flex; align-items: center;'>\${percentage}</span>` : ''}
        </div>\`;
    }
  },
    chart:{events:{load:function (){
        this.renderer.text('4.3k conversations', 150, 180).add();
        }
      }
    }
});
`;
    }

    // Construct the payload for the Highcharts export server
    const exportServerPayload = {
      type:
        chartConfig?.renderingConfig?.chartDisplayType === 'PDF_EXPORT'
          ? 'pdf'
          : 'png', // Default to png, or pdf if specified
      scale: 2, // Or make this configurable
      constr: 'Chart', // Usually "Chart" or "StockChart"
      filename: `${chartConfig.displayName || 'chart'}.${chartConfig?.renderingConfig?.chartDisplayType === 'PDF_EXPORT' ? 'pdf' : 'png'}`, // Dynamic outfile name
      infile: highchartsOptionsObject,
      customCode: customCode || undefined, // Only include customCode if it's not empty
      height: 700,
      width: 600
    };

    // Replace the original request body with the new payload
    req.body = exportServerPayload;

    next();
  } catch (error) {
    console.error('Error in chartConfigMiddleware:', error);
    // Pass the error to the next error-handling middleware
    next(error);
  }
};

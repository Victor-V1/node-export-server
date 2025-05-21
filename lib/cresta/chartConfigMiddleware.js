import {
  generateHighchartsOptions,
  mapChartDataPointValueToString,
  chartStatsTypeToChartLabel,
  chartStatsToChartAggregation
} from './chartGenerationCore.js';
import fs from 'fs';
import path from 'path';

export const chartConfigMiddleware = async (req, res, next) => {
  try {
    const { chartConfig, evaluationData, chartDataMaps, renderingConfig } =
      req.body;

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

    const aggregationStats = chartStatsToChartAggregation(
      chartConfig,
      evaluationData?.analyticsNumbers
        ?.map(({ value }) => value)
        .filter((v) => v !== undefined),
      evaluationData?.groupsAsFiltersTotal
    );

    let customCode = '';
    if (isPieChart) {
      // Calculate ungroupedTotal for pie chart legend if evaluationData and analyticsNumbers are present
      const ungroupedTotal =
        evaluationData?.analyticsNumbers?.reduce(
          (sum, item) => sum + (item.value || 0),
          0
        ) || 1;

      // DATAPOINT SHOULD BE INSIDE ${} and not plain text
      customCode = `
Highcharts.setOptions({
  legend: {
    labelFormatter: function (chart) {
      const legendDataPoint = this;
      const dataPoint = {
        name: legendDataPoint.name,
        percentage: ((legendDataPoint.y ?? 0) / (${ungroupedTotal})) * 100,
        color: typeof legendDataPoint.color === 'string' ? legendDataPoint.color : JSON.stringify(legendDataPoint.color),
        y: legendDataPoint.y
      };
      const percentage = (dataPoint.percentage ?? 0).toFixed(2) + '%';
      const metricRanges = [
        { divider: 1e18, suffix: 'E' },
        { divider: 1e15, suffix: 'P' },
        { divider: 1e12, suffix: 'T' },
        { divider: 1e9, suffix: 'G' },
        { divider: 1e6, suffix: 'M' },
        { divider: 1e3, suffix: 'K' },
      ];
      function suffixNumberMagnitude(value) {
        for (let i = 0; i < metricRanges.length; i++) {
          if (value >= metricRanges[i].divider) {
            return (value / metricRanges[i].divider).toFixed(1).replace('.0', '') + metricRanges[i].suffix;
          }
        }
        return value.toString();
      }
      const formattedValue = suffixNumberMagnitude(this.y);
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
        const text = "${mapChartDataPointValueToString(aggregationStats, chartConfig.dataConfig?.metrics?.[0])} <br/> ${chartStatsTypeToChartLabel(chartConfig, aggregationStats)} "
        const x = this.plotLeft + this.plotWidth / 2;
        const y = this.plotTop + this.plotHeight / 2;
        this.centerText = this.renderer
                    .text(text, x, y)
                    .css({
                      color: 'var(--cresta-colors-grausy-8)',
                      fontSize: 'var(--cresta-fontSizes-xl)',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    })
                    .attr({
                      align: 'center',
                      class: 'highcharts-center-text',
                    })
                    .add();
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
      height: renderingConfig.height,
      width: renderingConfig.width
    };

    //TODO: Remove this
    // Write exportServerPayload to a JSON file for debugging/logging

    try {
      const debugDir = path.join(process.cwd(), 'debug');
      // Create debug directory if it doesn't exist
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = path.join(debugDir, `export-payload-${timestamp}.json`);

      fs.writeFileSync(filePath, JSON.stringify(exportServerPayload, null, 2));

      console.log(`Wrote export payload to ${filePath}`);
    } catch (writeErr) {
      console.error('Error writing debug file:', writeErr);
      // Don't throw - allow the main flow to continue
    }

    // Replace the original request body with the new payload
    req.body = exportServerPayload;

    next();
  } catch (error) {
    console.error('Error in chartConfigMiddleware:', error);
    // Pass the error to the next error-handling middleware
    next(error);
  }
};

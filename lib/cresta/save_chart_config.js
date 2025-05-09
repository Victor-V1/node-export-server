// Assuming chartGenerationCore.js is in the same directory
import { generateHighchartsOptions } from './chartGenerationCore.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Input Data (Replace with your actual dynamic data source) ---

// 1. Your Chart Config (AnalyticsChart)
const chartConfig = {
  name: 'customers/cresta/profiles/walter-dev/analyticsCharts/686e5986-1e8a-4279-b07d-6b40b50ee6fb',
  state: 'STATE_UNSPECIFIED',
  displayName: 'Test addition yayyyy',
  description: 'sdfsdfsdf',
  dataConfig: {
    metrics: [
      {
        renderingConfig: {
          colors: [
            '#228BE6',
            '#FD7E14',
            '#2F9E44',
            '#5246E0',
            '#E03131',
            '#15AABF',
            '#FCC419',
            '#F783AC',
            '#868E96',
            '#A9E34B'
          ]
        },
        forSentiment: {
          sentiments: [
            {
              momentName:
                'customers/cresta/profiles/walter-dev/moments/946e45e5-4946-4670-956e-7f2690b5dfa8',
              type: 'CONVERSATION'
            },
            {
              momentName:
                'customers/cresta/profiles/walter-dev/moments/527050fd-65f0-46f7-8a3d-6d11e1e07605',
              type: 'CONVERSATION'
            }
          ],
          statsType: {
            commonStatsType: 'COMMON_STATS_TYPE_CONVERSATION_COUNT'
          }
        }
      }
    ],
    filters: [
      {
        targetAttribute: 'CHART_ATTRIBUTE_UNSPECIFIED',
        operator: 'IN',
        valueSet: {
          rangeValues: {
            rangeValues: [
              {
                fromValue: {
                  relativeTimestamp: {
                    durationBeforeNow: {
                      days: 30
                    }
                  }
                },
                toValue: {
                  relativeTimestamp: {
                    durationBeforeNow: {
                      days: 0
                    }
                  }
                }
              }
            ]
          }
        }
      }
    ],
    groupBy: []
  },
  audience: {
    roles: []
  },
  accessibility: 'LIBRARY',
  creator: 'customers/cresta/users/3eff1d4ce2d36203',
  lastEditor: 'customers/cresta/users/3eff1d4ce2d36203',
  createTime: '2025-01-08T17:29:04.314280Z',
  updateTime: '2025-04-23T11:21:38.560170Z',
  renderingConfig: {
    chartDisplayType: 'LINE_CHART'
  }
};

// 2. Your Evaluation Data (AnalyticsResult from resultForChart.analyticsResults[0])
const evaluationData = {
  groupByValuesForAllKeys: [
    {
      groupByValues: [
        {
          value: {
            sentimentValue: {
              momentName:
                'customers/cresta/profiles/walter-dev/moments/946e45e5-4946-4670-956e-7f2690b5dfa8',
              type: 'CONVERSATION'
            }
          }
        },
        {
          value: {
            sentimentValue: {
              momentName:
                'customers/cresta/profiles/walter-dev/moments/527050fd-65f0-46f7-8a3d-6d11e1e07605',
              type: 'CONVERSATION'
            }
          }
        }
      ]
    }
  ],
  analyticsNumbers: [
    {
      value: 2651,
      groupByValueIndexes: [0]
    },
    {
      value: 42,
      groupByValueIndexes: [1]
    }
  ]
};

// 3. Your Chart Data Maps (CRUCIAL - Populate with actual display names)
// This object maps entity IDs (like momentNames, userNames, etc.) to their display names.
// The structure must be compatible with `mapChartAttributeValueToString` in chartGenerationCore.js
const chartDataMaps = {
  moments: {
    'customers/cresta/profiles/walter-dev/moments/946e45e5-4946-4670-956e-7f2690b5dfa8':
      { displayName: 'Subcategory Moment Alpha' },
    'customers/cresta/profiles/walter-dev/moments/527050fd-65f0-46f7-8a3d-6d11e1e07605':
      { displayName: 'Subcategory Bravo Name' }
    //"customers/cresta/profiles/walter-dev/moments/b597c212-ba94-4a2f-a495-d627d6c5a769": { "displayName": "Charlie Subcategory" },
    //"customers/cresta/profiles/walter-dev/moments/dfdc8e4e-afd5-4071-b60b-82b77535d742": { "displayName": "Delta Display Value" },
    //"customers/cresta/profiles/walter-dev/moments/5a447a37-61d1-4cdf-911b-b38ba3c10ae3": { "displayName": "Echo Moment Example" }
  },
  usecases: {
    'customers/cresta/profiles/walter-dev/usecases/walter-dev': {
      displayName: 'Walter Dev Usecase'
    }
  }
  // Add other maps as needed, e.g., users, metadataAttributes, etc.
  // metadataAttributes: {
  //   "attribute_resource_name_1": {
  //     displayName: "Attribute 1 friendly name",
  //     allowedValues: [ { value: "val1", displayName: "Value 1 Friendly"}, ...]
  //   }
  // },
};

// --- Main script logic ---
try {
  // Generate the Highcharts options (this is the content for `infile`)
  console.log('Generating Highcharts chart options object...');
  const highchartsOptionsObject = generateHighchartsOptions(
    chartConfig,
    evaluationData,
    chartDataMaps
  );

  //TODO: This has to be changed
  const hasConversationCountStatsType = true;

  // For PieChart
  const customCode = `
Highcharts.setOptions({
  legend: {
    labelFormatter: function () {
      const legendDataPoint = this;
      const dataPoint = {
        name: legendDataPoint.name,
        percentage: ((legendDataPoint.y ?? 0) / (${evaluationData.ungroupedTotal} ?? 1)) * 100,
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
  // Construct the final JSON structure for the export server
  const finalJsonForServer = {
    type: 'png', // Or make this configurable if needed
    scale: 2, // Or make this configurable
    constr: 'Chart', // Usually "Chart" or "StockChart"
    outfile: `output/${chartConfig.displayName || 'chart'}.png`, // Dynamic outfile name based on chart
    infile: highchartsOptionsObject,
    customCode: customCode
    //customCode: "Highcharts.setOptions({ legend: { labelFormatter: function () { const legendDataPoint = this; const dataPoint = { name: legendDataPoint.name, percentage: ((legendDataPoint.y ?? 0) / (evaluation?.ungroupedTotal ?? 1)) * 100, color: typeof legendDataPoint.color === 'string' ? legendDataPoint.color : JSON.stringify(legendDataPoint.color), y: legendDataPoint.y }; const percentage = formatPercentage(dataPoint.percentage ?? 0, 2); const formattedValue = suffixNumberMagnitude(roundNumber(dataPoint.y ?? 0, 100)); return `<div class='legend-item' style='display: flex; align-items: center; white-space: nowrap; width: 100%;' data-tooltip-point='${encode(JSON.stringify(dataPoint))}'><div style='width: 12px; height: 12px; flex-shrink: 0; border-radius: 2px; margin-right: 8px; background-color: ${dataPoint.color};'></div><span style='font-size: 13px; overflow: hidden; text-overflow: ellipsis;'>${dataPoint.name}</span><span style='font-size: 13px; margin-left: 4px; flex-shrink: 0;'>: <strong>${formattedValue}</strong></span>${hasConversationCountStatsType ? `<span style='background-color: #E9ECEF; border-radius: 4px; padding: 1px 4px; font-size: 12px; line-height: 16px; color: #343A40; font-weight: 500; margin-left: 8px; flex-shrink: 0; display: inline-flex; align-items: center;'>${percentage}</span>` : ''}</div>`; }} });"
  };

  // Convert the final structure to a JSON string
  const jsonString = JSON.stringify(finalJsonForServer, null, 2); // null, 2 for pretty printing

  // Save the JSON string to a file
  console.log(jsonString);

  // --- Save to file ---
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outputDir = path.join(__dirname, '../samples/http');
  const outputPath = path.join(outputDir, 'self_test.json');

  // Ensure the directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, jsonString);
  console.log(`Successfully saved Highcharts options to ${outputPath}`);
} catch (error) {
  console.error('Error generating or saving export server JSON:', error);
}

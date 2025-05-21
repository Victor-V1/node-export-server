// Import the Highcharts Export Server module
import exporter from './lib/index.js';

// Initialize the exporter once when the Lambda container starts
const initializeExporter = async (options) => {
  options.puppeteer.args.push('--no-sandbox');
  options.puppeteer.args.push('--single-process');
  options.puppeteer.args.push('--disable-setuid-sandbox');
  options.puppeteer.args.push('--disable-dev-shm-usage');
  options.puppeteer.args.push('--no-zygote');
  await exporter.initExport(options);
};

// Export options correspond to the available CLI/HTTP arguments
const getChartOptions = (title = 'My Chart') => ({
  export: {
    type: 'png',
    options: {
      chart: {
        type: 'line'
      },
      title: {
        text: title
      },
      xAxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June']
      },
      series: [
        {
          type: 'line',
          data: [1, 3, 2, 4, 10, 2]
        },
        {
          type: 'line',
          data: [5, 3, 4, 2, 0, 20]
        }
      ]
    }
  }
});

export const handler = async (event) => {
  try {
    // Get chart options, allowing title customization from the event
    const title = event.title || 'My Chart';
    const chartOptions = getChartOptions(title);
    let options = exporter.setOptions(chartOptions);
    await initializeExporter(options);

    // Create a promise wrapper around the export callback
    const chartResult = await new Promise((resolve, reject) => {
      exporter.startExport(chartOptions, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });

    // Return the base64 encoded image
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: chartResult.result,
        message: 'Chart generated successfully'
      })
    };
  } catch (error) {
    console.error('Error generating chart:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Error generating chart',
        error: error.message
      })
    };
  } finally {
    await exporter.killPool();
  }
};

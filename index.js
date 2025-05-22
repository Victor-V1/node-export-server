// Import the Highcharts Export Server module
import exporter from './lib/index.js';
import { chartConfigMiddleware } from './lib/cresta/chartConfigMiddleware.js';
import dotenv from 'dotenv';
import path from 'path';
import { __dirname } from './lib/utils.js';

dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize the exporter once when the Lambda container starts
const initializeExporter = async (options) => {
  options.puppeteer.args.push('--no-sandbox');
  options.puppeteer.args.push('--single-process');
  options.puppeteer.args.push('--disable-setuid-sandbox');
  options.puppeteer.args.push('--disable-dev-shm-usage');
  options.puppeteer.args.push('--no-zygote');
  await exporter.initExport(options);
};

export const handler = async (event) => {
  try {
    const chartOptions = await chartConfigMiddleware(event);
    let options = exporter.setOptions(chartOptions);
    await initializeExporter(options);

    // Create a promise wrapper around the export callback
    const chartResult = await new Promise((resolve, reject) => {
      exporter.startExport(options, (err, result) => {
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
        error: error.message,
      })
    };
  } finally {
    await exporter.killPool();
  }
};

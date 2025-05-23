// Import the Highcharts Export Server module
import exporter from './lib/index.js';
import { chartConfigMiddleware } from './lib/cresta/chartConfigMiddleware.js';
import { uploadToS3 } from './lib/s3.js';
import dotenv from 'dotenv';
import path from 'path';
import { __dirname } from './lib/utils.js';

dotenv.config({ path: path.join(__dirname, '.env') });

export const handler = async (event) => {
  try {
    const chartOptions = await chartConfigMiddleware(event);
    let options = exporter.setOptions(chartOptions);
    await exporter.initExport(options);

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

    // Upload the image to S3 and get the URL
    const imageUrl = await uploadToS3(
      chartResult.result,
      options.export.type || 'png'
    );

    // Return the image URL
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: imageUrl
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
        error: error.message
      })
    };
  } finally {
    await exporter.killPool();
  }
};

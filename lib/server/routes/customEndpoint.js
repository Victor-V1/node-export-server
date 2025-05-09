import { log } from '../../logger.js';

// const customHandler = (req, res) => {
//     log(4, '[customEndpoint] Request received for /my-custom-endpoint');
//     // Your custom logic here
//     // For example, access query parameters: const { myParam } = req.query;
//     // Or request body (if it's a POST/PUT and you've used body parsing middleware): const { myBodyParam } = req.body;
//     res.status(200).send({ message: 'This is a custom response!' });
// };

export default (app) => {
  // Example GET endpoint
  // app.get('/my-custom-endpoint', customHandler);

  // Example POST endpoint (remember to parse the body in server.js or here if needed)
  app.post('/my-custom-endpoint', (req, res) => {
    console.log('CEE');
    log(4, '[customEndpoint] POST request received for /my-custom-endpoint');
    const { chartConfig, evaluationData } = req.body;

    if (!chartConfig || !evaluationData) {
      log(
        2,
        '[customEndpoint] Missing chartConfig or evaluationData in request body'
      );
      return res.status(400).send({
        message: 'Missing chartConfig or evaluationData in request body'
      });
    }

    // Your custom logic here using chartConfig and evaluationData
    log(4, '[customEndpoint] Received chartConfig:', chartConfig);
    log(4, '[customEndpoint] Received evaluationData:', evaluationData);

    res.status(200).send({
      message: 'Successfully received chartConfig and evaluationData!',
      data: { chartConfig, evaluationData }
    });
  });

  log(
    3,
    '[customEndpoint] Custom POST endpoint /my-custom-endpoint initialized.'
  );
};

/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
const axios = require('axios');
require('firebase-functions/lib/logger/compat');

exports.notifySlack = (event, context) => {
  console.log('event.data', Buffer.from(event.data, 'base64'));
  console.log('contenxt', context);

  const message = event.data
    ? Buffer.from(event.data, 'base64').toString()
    : 'Hello, World';

  const info = JSON.stringify(context);

  axios({
    method: 'post',
    url: 'https://hooks.slack.com/services/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',
    headers: {
      'content-type': 'application/json'
    },
    data: {
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "plain_text",
            "text": "Test",
          }
        },
        {
          "type": "section",
          "text": {
            "type": "plain_text",
            "text": "Test 2",
          }
        },
      ]
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.error(error);
  });
};

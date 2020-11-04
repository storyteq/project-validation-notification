/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
require('dotenv').config()
require('firebase-functions/lib/logger/compat');
const axios = require('axios');

exports.notifySlack = (event, context) => {
  const message = event.data
    ? Buffer.from(event.data, 'base64').toString()
    : 'Hello, World';

  console.log('event.data', message);
  console.log('contenxt', context);


  const info = JSON.stringify(context);

  axios({
    method: 'post',
    url: process.env.SLACK_WEBHOOK,
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

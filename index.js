/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
require('dotenv').config()
require('firebase-functions/lib/logger/compat');
const axios = require('axios');

function getErrorBlock(severity, errors, message) {

  // Create Slack Notification Error Block
  let errorBlock = {
    "type": "section",
    "fields": []
  }

  if (errors.length) {
    for (const error of errors) {
      errorBlock.fields.push({
        "type": "mrkdwn",
        "text": `*Error*: '${error.code}'`
      });
    }
  } else {
    errorBlock.fields.push({
      "type": "mrkdwn",
      "text": `*Error*: '${message}'`
    });
  }

  return ['ERROR', 'WARNING'].includes(severity) ? errorBlock : { "type": "divider" };
}

async function getTemplateVersion(id) {
   // Get TemplateVersion
  const response = await axios({
    method: 'get',
    url: `${process.env.API_URL}/content/versions/${id}`,
    headers: {
      'content-type': 'application/json'
    },
    params: {
      api_token: process.env.API_TOKEN
    }
  });

  return response.data.data;
}

function getLogUrl(insertId, timestamp) {
  const basePath = `https://console.cloud.google.com/logs/viewer?project=${process.env.GOOGLE_CLOUD_PROJECT_ID}`;
  const query = `&customFacets=jsonPayload.msg&limitCustomFacetWidth=false&advancedFilter=insertId="${insertId}" AND timestamp="${timestamp}"`

  return encodeURI(basePath.concat(query));
}

function getHeader(severity, msg) {
  const header = {
    ERROR: `:x: ERROR: ${msg}`,
    WARNING: `:warning: WARNING: ${msg}`,
    INFO: `:tada: ${msg}`
  }

  return header[severity];
}

exports.notifySlack = async (event, context) => {
  const data = event.data
    ? JSON.parse(Buffer.from(event.data, 'base64').toString())
    : null;

  if (!data) return console.log('No Event Data');

  // Get the needed properties from the event
  const {
    insertId,
    timestamp,
    jsonPayload: {
      context: {
        entity,
        id,
        message,
        errors = [],
      },
      msg,
    },
    severity,
  } = data;


  const templateVersion = await getTemplateVersion(id);

  if (!templateVersion) return console.error('templateVersion not found');

  console.log('templateVersion', templateVersion);

  // The Slack notification webhook call
  axios({
    method: 'post',
    url: process.env.SLACK_WEBHOOK,
    headers: {
      'content-type': 'application/json'
    },
    data: {
      blocks: [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text":  getHeader(severity, msg),
            "emoji": true
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*Entity*: ${entity}`
            },
            {
              "type": "mrkdwn",
              "text": `*Id*: ${id}`
            }
          ]
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Log and Trace",
                "emoji": true
              },
              "url": getLogUrl(insertId, timestamp),
              "action_id": "actionId-cloudlog"
            },
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": `Template: ${templateVersion.template_name}`,
                "emoji": true
              },
              "url": `${process.env.PLATFORM_URL}#/admin/templates/${templateVersion.template_id}/versions/${id}`,
              "action_id": "actionId-platform"
            }
          ]
        },
        getErrorBlock(severity, errors, message)
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

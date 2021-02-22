require('dotenv').config();
const debug = require('debug')('goss-metrics-exporter');
const express = require('express');
const app = express();
const got = require('got').extend({
  prefixUrl: process.env.GOSS_SERVER_URL,
});

debug('GOSS_SERVER_URL', process.env.GOSS_SERVER_URL);

let enableRequest = true;

/* As specified at https://github.com/prometheus/docs/blob/master/content/docs/instrumenting/exposition_formats.md#comments-help-text-and-type-information */
let escapeHelpLabel = (rawLabel) => {
  var metricHelpEscapeMap = {
    '\n': '\\n',
    '\\': '\\\\',
  };

  return ("" + rawLabel).replace(/([\\\n])/g, (str, item) => {
    return metricHelpEscapeMap[item];
  });
};

/* As specified at https://github.com/prometheus/docs/blob/master/content/docs/instrumenting/exposition_formats.md#comments-help-text-and-type-information */
let quoteMetricLabel = (rawLabel) => {
  var metricLabelEscapeMap = {
    '\n': '\\n',
    '\\': '\\\\',
    '"': '\\"',
  };

  return "\"" + ("" + rawLabel).replace(/([\\\n"])/g, (str, item) => {
    return metricLabelEscapeMap[item];
  }) + "\"";
};

const getMetrics = () => {
  return got.post('healthz', {
    headers: {
      "Accept": "application/json"
    },
    throwHttpErrors: false
  }).then((gossResponse) => {
    return new Promise((resolve, reject) => {
      debug('gossResponse', gossResponse);
      let lines = [];

      let resultName = "goss_result";
      let durationName = "goss_duration_seconds";
      let type = "gauge";


      let results = JSON.parse(gossResponse.rawBody).results || [];
      let failedCount = 0;
      let successfulCount = 0;
      let skippedCount = 0;
      let durationSecondsTotal = 0;

      lines.push('# HELP ' + resultName + ' goss result');
      lines.push('# TYPE ' + resultName + ' ' + type.toLowerCase());
      lines.push('# HELP ' + durationName + ' goss duration');
      lines.push('# TYPE ' + durationName + ' ' + type.toLowerCase());

      results.forEach((result) => {

        debug('result', result);

        durationSecondsTotal += (result.duration / 1000000000);

        if (result.result === 0) {
          successfulCount++;
        }
        if (result.result === 1) {
          failedCount++;
        }
        if (result.result === 2) {
          skippedCount++;
        }

        let labels = {
          "property": result.property,
          "resource_id": result['resource-id'],
          "resource_type": result['resource-type'],
          "result": result.result === 0 ?  "success" : (result.result === 1 ? "failure" : "skipped")
        };

        if (result.title) {
          labels.title = result.title;
        }

        let labelsSuffixParts = [];
        Object.keys(labels).forEach((labelKey) => {
          labelsSuffixParts.push([labelKey, '=', quoteMetricLabel(labels[labelKey])].join(''));
        });

        if (labelsSuffixParts.length > 0) {
          lines.push(resultName + '{' + labelsSuffixParts.join(",") + '} ' + result.result);
        } else {
          lines.push(resultName + ' ' + result.result);
        }

        if (labelsSuffixParts.length > 0) {
          lines.push(durationName + '{' + labelsSuffixParts.join(",") + '} ' + (result.duration / 1000000000));
        } else {
          lines.push(durationName + ' ' + (result.duration / 1000000000));
        }
      });

      lines.push('# HELP goss_failed_total goss failed tests');
      lines.push('# TYPE goss_failed_total gauge');
      lines.push('goss_failed_total ' + failedCount);
      lines.push('# HELP goss_successful_total goss successful tests');
      lines.push('# TYPE goss_successful_total gauge');
      lines.push('goss_successful_total ' + successfulCount);
      lines.push('# HELP goss_skipped_total goss skipped tests');
      lines.push('# TYPE goss_skipped_total gauge');
      lines.push('goss_skipped_total ' + skippedCount);
      lines.push('# HELP goss_duration_seconds_total goss total duration');
      lines.push('# TYPE goss_duration_seconds_total gauge');
      lines.push('goss_duration_seconds_total ' + durationSecondsTotal);


      resolve(lines);
    });
  }, (error) => {
    debug('error', error.stack);
    process.exit(1);
  });
};

if (enableRequest) {
  getMetrics().then((lines) => {
  });
}

setTimeout(() => {}, 60 * 1000 * 1000);

app.get('/', function (req, res) {
  res.set('X-App-Version', process.env.APP_VERSION || 'dev')
  res.send('OK');
});

app.get('/metrics', function (req, res) {
  res.set('X-App-Version', process.env.APP_VERSION || 'dev')
  getMetrics().then((lines) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(lines.join("\n"));
  });
});

app.listen(process.env.PORT || 9442, '0.0.0.0', function () {
});



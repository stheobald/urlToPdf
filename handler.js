var http = require('http');
var AWS = require('aws-sdk');
var wkhtmltopdf = require('wkhtmltopdf');
var MemoryStream = require('memorystream');

exports.handler = function(event, context) {
  var body = JSON.parse(event.body)
  var options = {
    host: 'www.google.co.nz', // body.host,
    path: body.path
  };

  console.log('Options:', options);
  console.log('Event', event);
  console.log('Context', context);

  var req = http.request(options, function (res) {
    var data = '';
  
    res.on('data', function (chunk) {
      data += chunk;
    });

    res.on('end', function () {
      var params = {
        Bucket: 'simeonhtml2pdf',
        Key: body.fileName,
        Body: data
      };

      // console.log('DATA', data);

      var s3 = new AWS.S3();
      s3.putObject(params, function(err, data) {
        if (err) {
          console.log('ERR', err);
          context.fail(err);
        } else {
          console.log('WIN', params);
          context.succeed(params);
        }
      })
    });
  });

  req.on('error', function (e) {
    context.fail(e.message)
  });

  req.end();
}

exports.pdf = 

process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

var convertToPdf = function(htmlUtf8, event, callback) {
  var memStream = new MemoryStream();
  wkhtmltopdf(htmlUtf8, event.options, function(code, signal) {
    callback(memStream.read());
  }).pipe(memStream);
}

exports.pdfHandler = function(event, context) {
  if(event.Records) {
    var bucketName = event.Records[0].s3.bucket.name;
    var fileName = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    var params = {
      Bucket: bucketName,
      Key: fileName
    };

    var s3 = new AWS.S3();
    s3.getObject(params, function(err, data) {
      var htmlUtf8 = data.Body.toString('utf8');
      convertToPdf(htmlUtf8, event, function(pdf) {
        params.Body = pdf;
        params.Key = params.Key + ".pdf";
        s3.putObject(params, function(err, data) {
          context.done(null, { pdf_base64: pdf.toString('base64') });
        })
      });
    });
  }
};
var http = require('http');
var AWS = require('aws-sdk');
var wkhtmltopdf = require('wkhtmltopdf');
var MemoryStream = require('memorystream');
process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];
console.log('PROCESS>ENV',process.env['PATH'])

var convertToPdf = function(htmlUtf8, event, callback) {
  var memStream = new MemoryStream();
  wkhtmltopdf(htmlUtf8, event.options, function(code, signal) {
    callback(memStream.read());
  }).pipe(memStream);
}

exports.handler = function(event, context) {
  console.log(event);
  // var body = JSON.parse(event.body)
  var body = event;
  var options = {
    host: body.host,
    path: body.path
  };

  // console.log('Options:', options);
  console.log('Event', event);
  console.log('Context', context);


    var s3 = new AWS.S3();
  // const s3 = new AWS.S3({
  //   s3ForcePathStyle: true,
  //   endpoint: new AWS.Endpoint('http://localhost:8000'),
  // });
  convertToPdf(options.host+options.path, event, function(pdf) {
    console.log('PDF', pdf);
    var params = {
      Bucket: 'simeonhtml2pdf',
      Key: body.fileName + ".pdf",
      Body: pdf
    };

    s3.putObject(params, function(err, pdf) {
      context.succeed({statusCode: 200, body: JSON.stringify({file: 'https://s3.amazonaws.com/' + params.Bucket + '/' + params.Key}), headers: {"x-custom-header" : "my custom header value"}});
      // context.done(null, { key: params.Key});
    })
  });
}
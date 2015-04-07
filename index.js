'use strict';
var bodyParser = require('body-parser');
var csv = require('csv');

var DEFAULT_TYPE = 'text/csv';

module.exports = function (options, parseOptions) {
  var textOptions = Object.create({}, options);
  textOptions.type = options.type || DEFAULT_TYPE;
  var textMiddleware = bodyParser.text(textOptions);

  return function (req, res, next) {
    textMiddleware(req, res, function (err) {
      if (err || Object.prototype.toString.call(req.body) !== '[object String]') {
        return next(err);
      }

      csv.parse(req.body, parseOptions || {}, function(err, parsed) {
        if (err) {
          return next(err);
        }
        req.body = parsed;
        next();
      });
    });
  };
};

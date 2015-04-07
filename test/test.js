'use strict';
// var assert = require('assert');
var http = require('http');
var request = require('supertest');
var expressCsvMiddleware = require('../');

function createServer(opts, parseOpts, handler) {
  var _csv = expressCsvMiddleware(opts, parseOpts);

  return http.createServer(function (req, res, next) {
    _csv(req, res, function (err) {
      if (handler) {
        return handler(req, res, next);
      }
      res.statusCode = err ? (err.status || 500) : 200;
      res.end(err ? err.message : JSON.stringify(req.body));
    });
  });
}

describe('middleware', function () {
  it('should parse csv', function (done) {
    var server = createServer({
      limit: '1mb'
    });

    request(server)
      .post('/')
      .set('Content-Type', 'text/csv')
      .send('first,second,third\n1,123,"First \'cell\', with comma"\n"sdfsdf, ss",12345,"Second \'really double quoted, and some comma\'"\n3,,"Third \'doubled, quoted\'"')
      .expect(200, '[["first","second","third"],["1","123","First \'cell\', with comma"],["sdfsdf, ss","12345","Second \'really double quoted, and some comma\'"],["3","","Third \'doubled, quoted\'"]]', done);
  });

  it('should parse csv with auto type conversion', function (done) {
    var server = createServer({
      limit: '1mb'
    }, {
      'auto_parse': true
    });

    request(server)
      .post('/')
      .set('Content-Type', 'text/csv')
      .send('first,second,third\n1,123,"First \'cell\', with comma"\n"sdfsdf, ss",12345,"Second \'really double quoted, and some comma\'"\n3,,"Third \'doubled, quoted\'"')
      .expect(200, '[["first","second","third"],[1,123,"First \'cell\', with comma"],["sdfsdf, ss",12345,"Second \'really double quoted, and some comma\'"],[3,"","Third \'doubled, quoted\'"]]', done);
  });
});

describe('res.csv', function () {
  it('should send csv', function (done) {
    var server = createServer({
      limit: '1mb'
    }, null, function (req, res) {
      res.set = function () {
        return this;
      };
      res.send = function (data) {
        console.log(data);
        res.end(data);
      };
      res.csv([
        ["first", "second", "third"],
        [1, 123, "First 'cell', with comma"],
        ["sdfsdf, ss", 12345, "Second 'really double quoted, and some comma'"],
        [3, "", "Third 'doubled, quoted'"]
      ]);
    });

    request(server)
      .get('/')
      .expect(200, 'first,second,third\n1,123,"First \'cell\', with comma"\n"sdfsdf, ss",12345,"Second \'really double quoted, and some comma\'"\n3,,"Third \'doubled, quoted\'"\n', done);
  });
});

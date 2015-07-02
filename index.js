require('lazy-ass');
var check = require('check-more-types');
var Promise = require('bluebird');
var R = require('ramda');
var _ = require('lodash');
var packageJson = Promise.promisify(require('package-json'));
var packageField = Promise.promisify(require('package-json').field);
var utils = require('./src/utils');

var log = console.log.bind(console);
var debug = require('debug')('load');

function reportCommentsBetweenCommits() {
  var getCommentsBetween = require('./src/get-comments-between-commits');

  var fromToCommitOptions = {
    user: 'bahmutov',
    repo: 'next-update',
    from: '627250039b89fba678f57f428ee9151c370d4dad',
    to: '3d2b1fa3523c0be35ecfb30d4c81407fd4ce30a6'
  };

  return getCommentsBetween(fromToCommitOptions)
    .tap(function (report) {
      la(check.object(report), 'did not get a report', report);
      report.print();
    });
}


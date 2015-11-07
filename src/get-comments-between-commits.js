require('lazy-ass');
var check = require('check-more-types');
var utils = require('./utils');
var R = require('ramda');
var _ = require('lodash');
var debug = require('debug')('between');

var getCommitsBetween = require('./get-commits-between');
la(check.fn(getCommitsBetween), 'missing function get commits between', getCommitsBetween);

var Report = require('./report');
var areValidOptions = check.schema.bind(null, {
  user: check.unemptyString,
  repo: check.unemptyString,
  from: check.commitId,
  to: check.commitId
});

function getCommentsBetweenCommits(options) {
  la(areValidOptions(options), 'bad options', options);
  var report = new Report(options);

  return getCommitsBetween(options)
    .tap(function (commits) {
      report.ids = _.pluck(commits, 'sha');
      report.comments = _.pluck(commits, 'message');
    })
    .then(R.always(report));
}

// resolves with Report object
module.exports = getCommentsBetweenCommits;

if (!module.parent) {

  (function examples() {
    /* eslint no-unused-vars:0 */
    function smallNumberOfCommitsExample() {
      var options = {
        user: 'bahmutov',
        repo: 'next-update',
        from: '627250039b89fba678f57f428ee9151c370d4dad',
        to: '3d2b1fa3523c0be35ecfb30d4c81407fd4ce30a6'
      };
      getCommentsBetweenCommits(options)
        .tap(function (report) {
          la(check.object(report), 'did not get a report', report);
          report.print();
        });
    }

    function largeNumberOfCommitsExample() {
      var options = {
        user: 'chalk',
        repo: 'chalk',
        from: 'b0a0e42bfe96f77e0ce273c87b910ccc9280bbeb', // older (0.3.0)
        to: '994758f01293f1fdcf63282e9917cb9f2cfbdaac' // latest (tag 0.5.1)
      };
      getCommentsBetweenCommits(options)
        .tap(function (report) {
          la(check.object(report), 'did not get a report', report);
          report.print();
        });
    }

    largeNumberOfCommitsExample();
  }());
}

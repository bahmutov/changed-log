require('lazy-ass');
var check = require('check-more-types');

var log = console.log.bind(console);
var debug = require('debug')('main');
var _ = require('lodash');

function findCommitIds(options, repoInfo) {
  la(check.object(repoInfo), 'missing repo info', repoInfo);

  var tagsToCommits = require('./get-commits-from-tags');
  return tagsToCommits({
    user: repoInfo.user,
    repo: repoInfo.repo,
    from: options.from,
    to: options.to
  }).tap(debug)
    .then(function mergeCommitInfo(tagsInfo) {
      return _.extend({}, repoInfo, options, tagsInfo);
    });
}

function findCommentsBetweenTags(options) {
  la(check.object(options), 'missing options', options);
  la(check.object(options.fromTag), 'missing fromTag', options);
  la(check.object(options.toTag), 'missing toTag', options);

  var findCommits = require('./get-comments-between-commits');
  return findCommits({
    user: options.user,
    repo: options.repo,
    from: options.fromTag.sha,
    to: options.toTag.sha
  }).then(function (report) {
    report.options.name = options.name;
    report.options.from = options.from;
    report.options.to = options.to;
    return report;
  });
}

var packageRepo = require('./package-repo');

function changedLog(options) {
  // TODO validate options
  return packageRepo(options.name)
    .tap(debug)
    .then(_.partial(findCommitIds, options))
    .tap(debug)
    .then(findCommentsBetweenTags)
    .tap(debug)
    .tap(function (report) {
      la(check.object(report), 'missing report', report);
      la(check.fn(report.print), 'cannot print report', report);
      report.print();
    });
}

module.exports = changedLog;

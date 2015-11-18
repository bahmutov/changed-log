require('lazy-ass');
var check = require('check-more-types');
var packageRepo = require('./package-repo');
var Promise = require('bluebird');

/* eslint no-console:0 */
var log = console.log.bind(console);
var debug = require('debug')('changed');
var _ = require('lodash');

function failedToFind(err) {
  console.error('Could not find commit ids');
  console.error(err.message);
  return Promise.reject(err);
}

function failedToFindComments(err) {
  console.error('Could not find comments');
  console.error(err.message);
  return Promise.reject(err);
}

function findCommitIds(options, repoInfo) {
  la(check.object(repoInfo), 'missing repo info', repoInfo);
  debug('Finding commit ids');
  var tagsToCommits = require('./get-commits-from-tags');
  return tagsToCommits({
    user: repoInfo.user,
    repo: repoInfo.repo,
    from: options.from,
    to: options.to
  })
    .tap(debug)
    .then(function mergeCommitInfo(tagsInfo) {
      return _.extend({}, repoInfo, options, tagsInfo);
    }, failedToFind);
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
  }, failedToFindComments);
}

function changedLogReport(options, reportOptions) {
  // TODO validate options
  options = options || {};
  reportOptions = reportOptions || {};

  var allTags;

  return packageRepo(options.name)
    .tap(debug)
    .then(_.partial(findCommitIds, options))
    .tap(function (result) {
      la(check.array(result.allTags), 'expected all tags in', result);
      allTags = result.allTags;
    })
    .then(findCommentsBetweenTags)
    .tap(function (result) {
      console.log('found %d comments between tags', result.comments.length);
      // console.log(JSON.stringify(result, null, 2));
    })
    .then(function mergeCommitsAndTags(report) {
      report.allTags = allTags;
      return report;
    })
    .tap(debug)
    .tap(function (report) {
      la(check.object(report), 'missing report', report);
      la(check.fn(report.print), 'cannot print report', report);
      report.print(reportOptions);
    });
}

function onlyProvidedFromVersion(options) {
  return check.unemptyString(options.from) &&
    !options.to;
}

function fillMissingFromOptions(options) {
  la(check.unemptyString(options.name), 'missing package name', options);
  var exists = require('fs').existsSync;
  var join = require('path').join;
  var packageFileName = join(process.cwd(), 'package.json');
  if (!exists(packageFileName)) {
    return;
  }
  var pkg = require(packageFileName);
  var dependency = (pkg.dependencies && pkg.dependencies[options.name]) ||
    (pkg.devDependencies && pkg.devDependencies[options.name]);
  if (dependency) {
    options.to = options.from;
    options.from = dependency;
    console.log('using "from" version from package.json %s', dependency);
  }
}

function missingOptions(options) {
  var isValidCliOptions = check.schema.bind(null, {
    name: check.unemptyString,
    from: check.unemptyString,
    to: check.unemptyString
  });
  return !isValidCliOptions(options);
}

function changedLog(options, reportOptions) {
  options = options || {};
  reportOptions = reportOptions || {};

  if (onlyProvidedFromVersion(options)) {
    // assume we specified target "to" version
    fillMissingFromOptions(options);
  }

  if (missingOptions(options)) {
    console.error('Missing options', options);
    /* eslint no-process-exit:0 */
    process.exit(-1);
  }

  if (options.auth) {
    log('Please login to github to increase the API rate limit');
    var githubLogin = require('./github-login');
    return githubLogin()
      .then(_.partial(changedLogReport, options, reportOptions));
  }

  return changedLogReport(options, reportOptions);
}

module.exports = changedLog;

if (!module.parent) {
  // existing package
  changedLog({
    name: 'chalk',
    from: '0.3.0',
    to: '0.5.1'
  }).done();
}

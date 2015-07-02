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

function compareVersionPackages(from, to) {
  la(check.object(from) && check.object(to),
    'invalid from and to package json', from, to);
  debug('package from %s to %s', from.version, to.version);
}

var question = {
  user: 'bahmutov',
  name: 'next-update',
  repo: 'next-update',
  from: '0.8.0',
  to: '0.8.2' // or 'latest'
};

function diffVersions() {
  Promise.all([
    packageJson(question.name, question.from),
    packageJson(question.name, question.to)
  ]).spread(compareVersionPackages);
}

function packageRepo() {

  return packageField(question.name, 'repository')
    .tap(utils.verifyGithub)
    .then(R.prop('url'));
}

// packageRepo()
//  .then(console.log.bind(console));
var getFromToTags = require('./src/get-commits-from-tags');
getFromToTags(question)
  .then(log);

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


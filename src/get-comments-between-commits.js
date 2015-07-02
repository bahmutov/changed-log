require('lazy-ass');
var check = require('check-more-types');
var utils = require('./utils');
var R = require('ramda');
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('between');

var reposApi = utils.github.repos;

// returns list of commits between two given tags
// latest commit is first in the list
function getCommitsBetween(options) {
  utils.verifyRepoOptions(options);
  var schema = {
    from: check.commitId,
    to: check.commitId
  };
  la(check.schema(schema, options), 'invalid from and to commits', options);
  var getCommits = Promise.promisify(reposApi.getCommits);
  return getCommits({
    user: options.user,
    repo: options.repo,
    sha: options.to
  }).then(function (commits) {
    console.log('found %d commits finishing with the latest commit %s',
      commits.length, utils.shortenSha(options.to));
    return _.pluck(commits, 'sha');
  }).then(function (ids) {
    var fromIndex = _.findIndex(ids, _.matches(options.from));
    debug('from commit %s is at index %d', options.from, fromIndex);
    // we are not really interested in FROM commit, so start
    // slice at index 1
    // we ARE interested in TO commit, so make sure to grab
    // the item at the fromIndex position
    return _.slice(ids, 0, fromIndex);
  });
}

function getCommitComment(options, id) {
  la(check.commitId(id), 'missing commit id', arguments);
  var get = Promise.promisify(reposApi.getCommit);
  debug('loading commit for %s/%s sha %s', options.user, options.repo, id);

  return get({
    user: options.user,
    repo: options.repo,
    sha: id
  }).then(R.prop('commit'))
    .then(R.prop('message'));
}

function getComments(options, ids) {
  utils.verifyRepoOptions(options);

  ids = check.array(ids) ? ids : [ids];
  la(check.arrayOf(check.commitId, ids), 'expected list of commit ids', ids);

  var getComment = R.partial(getCommitComment, options);

  return Promise.all(
    ids.map(getComment)
  , { concurrency: 2 });
}

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
    .tap(function (ids) {
      report.ids = ids;
    })
    .then(R.partial(getComments, options))
    .tap(function (comments) {
      report.comments = comments;
    })
    .then(R.always(report));
}

// resolves with Report object
module.exports = getCommentsBetweenCommits;

if (!module.parent) {

  getCommentsBetween({
    user: 'bahmutov',
    repo: 'next-update',
    from: '627250039b89fba678f57f428ee9151c370d4dad',
    to: '3d2b1fa3523c0be35ecfb30d4c81407fd4ce30a6'
  }).tap(function (report) {
      la(check.object(report), 'did not get a report', report);
      report.print();
    });
}

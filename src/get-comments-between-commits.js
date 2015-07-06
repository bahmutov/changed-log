require('lazy-ass');
var check = require('check-more-types');
var utils = require('./utils');
var R = require('ramda');
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('between');

var reposApi = utils.github.repos;
var getCommits = Promise.promisify(reposApi.getCommits);

function getCommitsFrom(user, repo, latest, stop, previousCommits) {
  previousCommits = previousCommits || [];
  debug('commits %s/%s latest %s stop %s, previous number %d',
    user, repo, utils.shortenSha(latest), utils.shortenSha(stop),
    previousCommits.length);

  return getCommits({
    user: user,
    repo: repo,
    sha: latest
  }).then(function (commits) {
    debug('got %d new commits from %s to %s',
      commits.length,
      utils.shortenSha(R.head(commits).sha),
      utils.shortenSha(R.last(commits).sha)
    );

    var allCommits = previousCommits.length ? previousCommits.concat(commits.slice(1)) : commits;
    var fromIndex = _.findIndex(allCommits, 'sha', stop);
    if (fromIndex === -1) {
      if (commits.length === 1) {
        debug('fetched single commit %s, stopping', utils.shortenSha(commits[0].sha));
        return allCommits;
      }

      var last = R.last(allCommits).sha;
      console.log('could not find the stop commit, fetching more commits starting with %s', last);
      // using delay to debug
      return Promise.delay(1).then(function () {
        return getCommitsFrom(user, repo, last, stop, allCommits);
      });
    } else {
      return allCommits;
    }
  });
}

// returns list of commits between two given tags
// latest commit is first in the list
function getCommitsBetween(options) {
  utils.verifyRepoOptions(options);
  var schema = {
    from: check.commitId,
    to: check.commitId
  };
  la(check.schema(schema, options), 'invalid from and to commits', options);

  return getCommitsFrom(options.user, options.repo, options.to, options.from)
    .then(function (commits) {
      la(check.array(commits), 'could not get list of commits', options);
      debug('found %d commits finishing with the latest commit %s',
        commits.length, utils.shortenSha(options.to));

      return R.map(function (commit) {
        return {
          sha: commit.sha,
          message: commit.commit.message
        };
      }, commits);
    }).then(function (commits) {
      var fromIndex = _.findIndex(commits, 'sha', options.from);
      debug('from commit %s is at index %d', options.from, fromIndex);
      // we are not really interested in FROM commit, so start
      // slice at index 1
      // we ARE interested in TO commit, so make sure to grab
      // the item at the fromIndex position
      return _.slice(commits, 0, fromIndex);
    });
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

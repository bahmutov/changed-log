var la = require('lazy-ass')
var check = require('check-more-types')
var utils = require('./utils')
var R = require('ramda')
var _ = require('lodash')
var debug = require('debug')('between')
var reposApi = utils.github.repos
var Promise = require('bluebird')
var getCommits = Promise.promisify(reposApi.getCommits)

function getCommitsFrom (user, repo, latest, stop, previousCommits) {
  previousCommits = previousCommits || []
  debug('commits %s/%s latest %s stop %s, previous number %d',
    user, repo, utils.shortenSha(latest), utils.shortenSha(stop),
    previousCommits.length)

  var messageOptions = {
    user: user,
    repo: repo,
    sha: latest
  }
  if (utils.github.twoFactor) {
    messageOptions.headers = {
      'X-GitHub-OTP': utils.github.twoFactor
    }
  }

  return getCommits(messageOptions).then(function (commits) {
    debug('got %d new commits from %s to %s',
      commits.length,
      utils.shortenSha(R.head(commits).sha),
      utils.shortenSha(R.last(commits).sha)
    )

    var allCommits = previousCommits.length ? previousCommits.concat(commits.slice(1)) : commits
    var fromIndex = _.findIndex(allCommits, 'sha', stop)
    if (fromIndex === -1) {
      if (commits.length === 1) {
        debug('fetched single commit %s, stopping', utils.shortenSha(commits[0].sha))
        return allCommits
      }

      var last = R.last(allCommits).sha
      debug('could not find the stop commit, fetching more commits starting with %s', last)
      // using delay to debug
      return Promise.delay(1).then(function () {
        return getCommitsFrom(user, repo, last, stop, allCommits)
      })
    } else {
      return allCommits
    }
  })
}

// returns list of commits between two given tags
// latest commit is first in the list
function getCommitsBetween (options) {
  utils.verifyRepoOptions(options)
  var schema = {
    from: check.commitId,
    to: check.commitId
  }
  la(check.schema(schema, options), 'invalid from and to commits', options)

  return getCommitsFrom(options.user, options.repo, options.to, options.from)
    .then(function (commits) {
      la(check.array(commits), 'could not get list of commits', options)
      debug('found %d commits finishing with the latest commit %s',
        commits.length, utils.shortenSha(options.to))

      return R.map(function (commit) {
        return {
          sha: commit.sha,
          message: commit.commit.message
        }
      }, commits)
    }).then(function (commits) {
      var fromIndex = _.findIndex(commits, 'sha', options.from)
      debug('from commit %s is at index %d', options.from, fromIndex)
      // we are not really interested in FROM commit, so start
      // slice at index 1
      // we ARE interested in TO commit, so make sure to grab
      // the item at the fromIndex position
      return _.slice(commits, 0, fromIndex)
    })
}

module.exports = getCommitsBetween

if (!module.parent) {
  (function examples () {
    /* eslint no-unused-vars:0 */

    function commitsAfter () {
      var options = {
        user: 'chalk',
        repo: 'chalk',
        from: '8b554e254e89c85c1fd04dcc444beeb15824e1a5'
      }
      getCommitsBetween(options)
        .then(console.log.bind(console))
        .done()
    }
    commitsAfter()
  }())
}

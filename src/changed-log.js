var la = require('lazy-ass')
var check = require('check-more-types')
var packageRepo = require('./package-repo')
var Promise = require('bluebird')

/* eslint no-console:0 */
var log = console.log.bind(console)
var debug = require('debug')('changed')
var _ = require('lodash')

function failedToFind (err) {
  console.error('Could not find commit ids')
  console.error(err.message)
  return Promise.reject(err)
}

function failedToFindComments (err) {
  console.error('Could not find comments')
  console.error(err.message)
  return Promise.reject(err)
}

function findCommitIds (options, repoInfo) {
  la(check.object(repoInfo), 'missing repo info', repoInfo)
  debug('Finding commit ids')
  var tagsToCommits = require('./get-commits-from-tags')
  var tagOptions = {
    user: repoInfo.user,
    repo: repoInfo.repo,
    from: options.from,
    to: options.to
  }
  return tagsToCommits(tagOptions)
    .tap(debug)
    .then(function mergeCommitInfo (tagsInfo) {
      return _.extend({}, repoInfo, options, tagsInfo)
    }, failedToFind)
}

function findCommentsBetweenTags (options) {
  la(check.object(options), 'missing options', options)
  la(check.object(options.fromTag), 'missing fromTag', options)
  la(check.object(options.toTag), 'missing toTag', options)

  var findCommits = require('./get-comments-between-commits')
  var findOptions = {
    user: options.user,
    repo: options.repo,
    from: options.fromTag.sha,
    to: options.toTag.sha
  }

  function setReport (report) {
    report.options.name = options.name
    report.options.from = options.from
    report.options.to = options.to
    return report
  }

  return findCommits(findOptions)
    .then(setReport, failedToFindComments)
}

var isLatest = check.schema({
  from: check.equal('latest')
})

function changedAfterLatest (options/*, reportOptions */) {
  debug('Returning comments from commits after latest tag')
  return packageRepo(options.name)
    .then(_.partial(findCommitIds, options))
    .tap(debug)
}

function changedLogReport (options, reportOptions) {
  // TODO validate options
  options = options || {}
  reportOptions = reportOptions || {}

  if (isLatest(options)) {
    return changedAfterLatest(options, reportOptions)
  }

  var allTags

  return packageRepo(options.name)
    .tap(debug)
    .then(_.partial(findCommitIds, options))
    .tap(function (result) {
      la(check.array(result.allTags), 'expected all tags in', result)
      allTags = result.allTags
    })
    .then(findCommentsBetweenTags)
    .tap(function (result) {
      console.log('found %d comments between tags', result.comments.length)
      // console.log(JSON.stringify(result, null, 2));
    })
    .then(function mergeCommitsAndTags (report) {
      report.allTags = allTags
      return report
    })
    .tap(debug)
    .tap(function (report) {
      la(check.object(report), 'missing report', report)
      la(check.fn(report.print), 'cannot print report', report)
      report.print(reportOptions)
    })
}

function startFromLatestPublishedTag (options) {
  return options.from === 'latest' &&
    !options.to
}

function onlyProvidedFromVersion (options) {
  return check.unemptyString(options.from) &&
    !options.to
}

function providedNoVersions (options) {
  return !options.from &&
    !options.to
}

function readPackageJson () {
  var exists = require('fs').existsSync
  var join = require('path').join
  var packageFileName = join(process.cwd(), 'package.json')
  /* eslint consistent-return:0 */
  if (!exists(packageFileName)) {
    return
  }
  var pkg = require(packageFileName)
  return pkg
}

function getDependency (name) {
  la(check.unemptyString(name), 'missing package name', name)
  var pkg = readPackageJson()
  /* eslint consistent-return:0 */
  if (!pkg) {
    return
  }
  var dependency = (pkg.dependencies && pkg.dependencies[name]) ||
    (pkg.devDependencies && pkg.devDependencies[name])
  return dependency
}

function fillMissingFromOptions (options) {
  var dependency = getDependency(options.name)
  if (dependency) {
    options.to = options.from
    options.from = dependency
    console.log('using "from" version from package.json %s', dependency)
  }
}

function fillMissingFromToOptions (options) {
  var dependency = getDependency(options.name)
  if (dependency) {
    options.from = dependency
    options.to = 'latest'
    console.log('using "from" version from package.json %s to "latest"', dependency)
  }
}

function missingOptions (options) {
  var isValidCliOptions = check.schema.bind(null, {
    name: check.unemptyString,
    from: check.unemptyString,
    to: check.unemptyString
  })
  return !isValidCliOptions(options)
}

function changedLog (options, reportOptions) {
  options = options || {}
  reportOptions = reportOptions || {}

  if (startFromLatestPublishedTag(options)) {
    log('Finding changes after last published NPM version for "%s"', options.name)
    return changedLogReport(options, reportOptions)
  }

  if (onlyProvidedFromVersion(options)) {
    // assume we specified target "to" version
    fillMissingFromOptions(options)
  }

  if (providedNoVersions(options)) {
    log('need latest "to" version')
    fillMissingFromToOptions(options)
  }

  if (missingOptions(options)) {
    console.error('Missing options', options)
    /* eslint no-process-exit:0 */
    process.exit(-1)
  }

  if (options.auth) {
    log('Please login to github to increase the API rate limit')
    var githubLogin = require('./github-login')
    return githubLogin()
      .then(_.partial(changedLogReport, options, reportOptions))
  }

  return changedLogReport(options, reportOptions)
}

module.exports = changedLog

if (!module.parent) {
  // existing package with definite range
  // changedLog({
  //   name: 'chalk',
  //   from: '0.3.0',
  //   to: '0.5.1'
  // }).done();

  // existing package starting with
  // the latest published NPM tag
  changedLog({
    name: 'chalk',
    from: 'latest'
  }).done()
}

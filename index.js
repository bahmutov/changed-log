require('lazy-ass');
var check = require('check-more-types');
var Promise = require('bluebird');
var R = require('ramda');
var _ = require('lodash');
var packageJson = Promise.promisify(require('package-json'));
var packageField = Promise.promisify(require('package-json').field);
var GitHubApi = require('github');

var repoSchema = {
  user: check.unemptyString,
  repo: check.unemptyString
};

var isRepoQuestion = R.partial(check.schema, repoSchema);
function verifyRepoOptions(options) {
  la(isRepoQuestion(options), 'missing repo info', options);
}

var github = new GitHubApi({
  // required
  version: '3.0.0',
  // optional
  debug: false
});

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
  function verifyGithub(repo) {
    la(check.object(repo) &&
      repo.type === 'git' &&
      check.unemptyString(repo.url) &&
      /github\.com/.test(repo.url),
      'not a github repo', repo);
  }

  return packageField(question.name, 'repository')
    .tap(verifyGithub)
    .then(R.prop('url'));
}

// packageRepo()
//  .then(console.log.bind(console));


function getTags(options) {
  la(check.object(options), 'missing options', options);
  verifyRepoOptions(options);

  var gTags = Promise.promisify(github.repos.getTags);
  return gTags({
    user: 'bahmutov',
    repo: 'next-update'
  }).then(function (tags) {
    la(check.array(tags), 'expected tags to be an array', tags);
    console.log('received %d tags', tags.length);
    return _.map(tags, function (tag) {
      return {
        name: tag.name,
        sha: tag.commit.sha
      };
    });
  });
}

// getTags();

function getFromToTags(question) {
  var tagSchema = {
    from: check.unemptyString,
    to: check.unemptyString
  };
  la(check.schema(tagSchema, question), question);

  return getTags(_.pick(question, 'user', 'repo'))
    .then(function (allTags) {
      la(check.array(allTags), 'missing tags', allTags);
      var fromTag = _.find(allTags, 'name', question.from);
      la(fromTag, 'cannot find tag', question.from);
      var toTag = _.find(allTags, 'name', question.to);
      la(toTag, 'cannot to tag', question.to);

      return _.extend(question, {
        fromTag: fromTag,
        toTag: toTag
      });
    });
}

// getFromToTags(question)
//  .then(log);

// returns list of commits between two given tags
// latest commit is first in the list
function getCommitsBetween(options) {
  verifyRepoOptions(options);
  var schema = {
    from: check.commitId,
    to: check.commitId
  };
  la(check.schema(schema, options), 'invalid from and to commits', options);
  var getCommits = Promise.promisify(github.repos.getCommits);
  return getCommits({
    user: options.user,
    repo: options.repo,
    sha: options.to
  }).then(function (commits) {
    console.log('found %d commits finishing with the latest commit %s',
      commits.length, options.to);
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
  var get = Promise.promisify(github.repos.getCommit);
  debug('loading commit for %s/%s sha %s', options.user, options.repo, id);

  return get({
    user: options.user,
    repo: options.repo,
    sha: id
  }).then(R.prop('commit'))
    .then(R.prop('message'));
}

function getComments(options, ids) {
  verifyRepoOptions(options);

  ids = check.array(ids) ? ids : [ids];
  la(check.arrayOf(check.commitId, ids), 'expected list of commit ids', ids);

  var getComment = R.partial(getCommitComment, options);

  return Promise.all(
    ids.map(getComment)
  , { concurrency: 2 });
}

var fromToCommitOptions = {
  user: 'bahmutov',
  repo: 'next-update',
  from: '627250039b89fba678f57f428ee9151c370d4dad',
  to: '3d2b1fa3523c0be35ecfb30d4c81407fd4ce30a6'
};

var Report = require('./src/report');
var report = new Report(fromToCommitOptions);

getCommitsBetween(fromToCommitOptions)
  .tap(function (ids) {
    report.ids = ids;
  })
  .then(R.partial(getComments, fromToCommitOptions))
  .tap(function (comments) {
    report.comments = comments;
  })
  .then(R.always(report))
  .tap(R.invoke('print', []));


require('lazy-ass');
var check = require('check-more-types');
var Promise = require('bluebird');
var R = require('ramda');
var _ = require('lodash');
var packageJson = Promise.promisify(require('package-json'));
var packageField = Promise.promisify(require('package-json').field);
var GitHubApi = require('github');

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
  var repoSchema = {
    user: check.unemptyString,
    repo: check.unemptyString
  };
  la(check.object(options), 'missing options', options);
  la(check.schema(repoSchema, options), options);

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

// getTags();
getFromToTags(question)
  .then(log);

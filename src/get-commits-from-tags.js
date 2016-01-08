var la = require('lazy-ass');
var check = require('check-more-types');
var utils = require('./utils');
var _ = require('lodash');
var Promise = require('bluebird');

/* eslint no-console:0 */
var log = console.log.bind(console);
var reposApi = utils.github.repos;
var gTags = Promise.promisify(reposApi.getTags);
var debug = require('debug')('tags');

function nameAndSha(tags) {
  if (check.array(tags)) {
    return _.map(tags, nameAndSha);
  }
  return {
    name: tags.name,
    sha: tags.commit.sha
  };
}

function trimVersions(tags) {
  return tags.map(function (tag) {
    tag.name = utils.trimVersion(tag.name);
    return tag;
  });
}

function getTags(options) {
  la(check.object(options), 'missing options', options);
  utils.verifyRepoOptions(options);

  var messageOptions = _.clone(options);
  if (utils.github.twoFactor) {
    messageOptions.headers = {
      'X-GitHub-OTP': utils.github.twoFactor
    };
  }

  return gTags(messageOptions)
    .tap(check.array)
    .then(nameAndSha)
    .then(trimVersions);
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
      var fromTagIndex = _.findIndex(allTags, 'name', question.from);
      la(fromTagIndex !== -1, 'cannot find tag', question.from, 'all tags', allTags);

      var toTagIndex = question.to === 'latest' ? 0 :
        _.findIndex(allTags, 'name', question.to);
      la(toTagIndex !== -1, 'cannot to tag', question.to, 'all tags', allTags);

      debug('from tag %s index %d to tag %s index %d',
        question.from, fromTagIndex,
        question.to, toTagIndex);

      if (fromTagIndex < toTagIndex) {
        debug('flipping the tag order');
        var tmp = fromTagIndex;
        fromTagIndex = toTagIndex;
        toTagIndex = tmp;

        tmp = question.from;
        question.from = question.to;
        question.to = tmp;
      }

      var fromTag = allTags[fromTagIndex];
      var toTag = allTags[toTagIndex];

      return {
        fromTag: fromTag,
        toTag: toTag,
        allTags: allTags
      };
    });
}

module.exports = getFromToTags;

if (!module.parent) {

  (function examples() {

    /* eslint no-unused-vars:0 */
    function nextUpdateExample() {
      var question = {
        user: 'bahmutov',
        repo: 'next-update',
        from: '0.8.0',
        to: '0.8.2' // or 'latest?'
      };

      log('Getting commit SHA for the given tags');
      log(question);
      getFromToTags(question)
        .then(log);
    }

    function nextUpdateReverseTagOrderExample() {
      var question = {
        user: 'bahmutov',
        repo: 'next-update',
        from: '0.8.2',
        to: '0.8.0'
      };

      log('Getting commit SHA for the given tags');
      log(question);
      getFromToTags(question)
        .then(log);
    }

    function chalkExample() {
      var question = {
        user: 'chalk',
        repo: 'chalk',
        from: '0.5.1',
        to: '0.3.0'
      };

      log('Getting commit SHA for the given tags');
      log('%s / %s from %s to %s',
        question.user, question.repo, question.from, question.to);
      getFromToTags(question)
        .then(log);
    }

    // chalkExample();
    nextUpdateReverseTagOrderExample();
  }());
}

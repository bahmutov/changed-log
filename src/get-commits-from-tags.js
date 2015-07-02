require('lazy-ass');
var check = require('check-more-types');
var utils = require('./utils');
var R = require('ramda');
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('tags');

var reposApi = utils.github.repos;
var gTags = Promise.promisify(reposApi.getTags);

function getTags(options) {
  la(check.object(options), 'missing options', options);
  utils.verifyRepoOptions(options);

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

module.exports = getFromToTags;

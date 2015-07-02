require('lazy-ass');
var check = require('check-more-types');
var R = require('ramda');

var repoSchema = {
  user: check.unemptyString,
  repo: check.unemptyString
};

var isRepoQuestion = R.partial(check.schema, repoSchema);
function verifyRepoOptions(options) {
  la(isRepoQuestion(options), 'missing repo info', options);
}

var GitHubApi = require('github');
var github = new GitHubApi({
  // required
  version: '3.0.0',
  // optional
  debug: false
});

module.exports = {
  isRepoQuestion: isRepoQuestion,
  verifyRepoOptions: verifyRepoOptions,
  github: github
};

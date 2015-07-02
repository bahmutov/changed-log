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

function isGithubUrl(url) {
  return check.unemptyString(url) &&
    /github\.com/.test(url) &&
    /\.git$/.test(url);
}

function verifyGithub(repo) {
  la(check.object(repo) &&
    repo.type === 'git' &&
    isGithubUrl(repo.url),
    'not a github repo', repo);
}

var GitHubApi = require('github');
var github = new GitHubApi({
  // required
  version: '3.0.0',
  // optional
  debug: false
});

function parseGithubUrl(url) {
  la(isGithubUrl(url), 'not a github url', url);
  var matches = /github\.com\/([a-zA-Z-]+?)\/([a-zA-Z-]+?)\.git$/.exec(url);
  return {
    user: matches[1],
    repo: matches[2]
  };
}

module.exports = {
  isRepoQuestion: isRepoQuestion,
  verifyRepoOptions: verifyRepoOptions,
  github: github,
  verifyGithub: verifyGithub,
  parseGithubUrl: parseGithubUrl
};

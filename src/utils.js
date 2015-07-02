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
    /github\.com/.test(url);
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
  var matches = /github\.com\/([a-zA-Z-]+?)\/([a-zA-Z-]+?)(\.git)?$/.exec(url);
  la(check.array(matches),
    'could not extract user and repo name from github url', url);
  return {
    user: matches[1],
    repo: matches[2]
  };
}

function trimVersion(str) {
  la(check.unemptyString(str), 'missig tag', str);
  var startsWithV = /^v\d+/;
  if (startsWithV.test(str)) {
    return str.substr(1);
  }
  return str;
}

function firstLine(str) {
  la(check.string(str), 'expected str', str);
  str = str.trim();
  var firstNewline = str.indexOf('\n');
  if (firstNewline !== -1) {
    return str.substr(0, firstNewline);
  }
  return str;
}

module.exports = {
  isRepoQuestion: isRepoQuestion,
  verifyRepoOptions: verifyRepoOptions,
  github: github,
  verifyGithub: verifyGithub,
  parseGithubUrl: parseGithubUrl,
  trimVersion: trimVersion,
  firstLine: firstLine
};

var log = require('debug')('changed');
var la = require('lazy-ass');
var check = require('check-more-types');
var R = require('ramda');
var parseGh = require('@bahmutov/parse-github-repo-url');

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

function verifyGithub(message, repo) {
  la(check.object(repo) &&
    repo.type === 'git' &&
    isGithubUrl(repo.url),
    'not a github repo', repo, message);
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
  log('parsing github url', url);

  var githubUrlRegex = /github\.com[\/:]([a-zA-Z-]+?)\/([a-zA-Z-\.0-9]+?)(\.git)?$/;
  var matches = githubUrlRegex.exec(url);
  la(check.array(matches),
    'could not extract user and repo name from github url', url);
  return {
    user: matches[1],
    repo: matches[2]
  };
}

function shortenSha(str) {
  la(check.unemptyString(str), 'expected long commit sha string', str);
  return str.substr(0, 7);
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

// returns true if the package name is really github username/reponame
function isGithubName(str) {
  if (check.not.unemptyString(str)) {
    return false;
  }
  var parsed = parseGh(str);
  return check.array(parsed);
}

function parseGithubName(str) {
  la(isGithubName(str), 'not a github name', str);
  log('parsing github name', str);
  var matches = parseGh(str);
  return {
    user: matches[0],
    repo: matches[1]
  };
}

module.exports = {
  isRepoQuestion: isRepoQuestion,
  verifyRepoOptions: verifyRepoOptions,
  github: github,
  verifyGithub: R.curry(verifyGithub),
  parseGithubUrl: parseGithubUrl,
  trimVersion: trimVersion,
  firstLine: firstLine,
  shortenSha: shortenSha,
  isGithubName: isGithubName,
  parseGithubName: parseGithubName
};

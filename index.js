require('lazy-ass');
var check = require('check-more-types');
var Promise = require('bluebird');
var R = require('ramda');
var packageJson = Promise.promisify(require('package-json'));
var packageField = Promise.promisify(require('package-json').field);
var debug = require('debug')('load');

function compareVersionPackages(from, to) {
  la(check.object(from) && check.object(to),
    'invalid from and to package json', from, to);
  debug('package from %s to %s', from.version, to.version);
}

var question = {
  name: 'next-update',
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

packageRepo()
  .then(console.log.bind(console));

require('lazy-ass');
var check = require('check-more-types');
var Promise = require('bluebird');
var R = require('ramda');
var debug = require('debug')('changed');
var packageField = require('package-json');
var utils = require('./utils');
/* eslint no-console:0 */
var log = console.log.bind(console);

function getRepo(info) {
  debug('Getting repo from info object');
  debug(info);

  if (check.object(info.repository)) {
    return info.repository;
  }

  la(check.object(info.versions), 'missing versions', info);
  var latestTag = R.last(Object.keys(info.versions));
  var latest = info.versions[latestTag];
  return latest.repository;
}

function failedAtSomething(label, err) {
  console.error('failed at %s', label);
  console.error(err);
  return Promise.reject(err);
}

// resolves with the github url for the given NPM package name
function packageRepo(name) {
  la(check.unemptyString(name), 'missing package name', name);

  if (utils.isGithubName(name)) {
    debug('package name "%s" is repo', name);
    return Promise.resolve(utils.parseGithubName(name));
  }

  debug('getting package repo for "%s"', name);
  var json;

  return Promise.resolve(packageField(name))
    .then(R.tap(debug), R.partial(failedAtSomething, 'package field'))
    .tap(function (info) {
      json = info;
    })
    .then(getRepo)
    .catch(R.partial(failedAtSomething, 'getting repo info'))
    .then(function (repo) {
      debug('just the repo', repo);
      utils.verifyGithub(json, repo);
      return repo;
    })
    .then(R.prop('url'))
    .then(utils.parseGithubUrl)
    .then(R.tap(function (parsed) {
      debug('parsed github url', parsed);
    }));
}

module.exports = packageRepo;

if (!module.parent) {
  (function () {
    // var name = 'next-update';
    var name = 'grunt-contrib-jshint';
    log('getting repo info for package %s', name);
    packageRepo(name)
      .then(log)
      .catch(log);
  }());
}

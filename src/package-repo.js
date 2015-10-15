require('lazy-ass');
var check = require('check-more-types');
var Promise = require('bluebird');
var R = require('ramda');
var debug = require('debug')('changed');
var packageField = require('package-json');
var utils = require('./utils');
/* eslint no-console:0 */
var log = console.log.bind(console);

// resolves with the github url for the given NPM package name
function packageRepo(name) {
  la(check.unemptyString(name), 'missing package name', name);

  if (utils.isGithubName(name)) {
    debug('package name "%s" is repo', name);
    return Promise.resolve(utils.parseGithubName(name));
  }

  debug('getting package repo for "%s"', name);
  return Promise.resolve(packageField(name))
    .then(R.tap(debug))
    .then(function (json) {
      return json.repository;
    })
    .then(R.tap(utils.verifyGithub))
    .then(R.prop('url'))
    .then(utils.parseGithubUrl);
}

module.exports = packageRepo;

if (!module.parent) {
  var name = 'next-update';
  log('getting repo info for package %s', name);
  packageRepo(name)
    .then(log)
    .catch(log);
}

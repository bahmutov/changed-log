require('lazy-ass');
var check = require('check-more-types');
var Promise = require('bluebird');
var R = require('ramda');
var packageField = Promise.promisify(require('package-json').field);
var utils = require('./utils');

var log = console.log.bind(console);
var debug = require('debug')('load');

// resolves with the github url for the given NPM package name
function packageRepo(name) {
  la(check.unemptyString(name), 'missing package name', name);
  return packageField(name, 'repository')
    .tap(utils.verifyGithub)
    .then(R.prop('url'))
    .then(utils.parseGithubUrl);
}

module.exports = packageRepo;

if (!module.parent) {
  var name = 'next-update';
  log('getting repo info for package %s', name);
  packageRepo(name)
    .then(log);
}

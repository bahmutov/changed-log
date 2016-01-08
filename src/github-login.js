var la = require('lazy-ass');
var check = require('check-more-types');
/* eslint no-console:0 */
var log = console.log.bind(console);
var Promise = require('bluebird');
var utils = require('./utils');
var debug = require('debug')('login');
var inquirer = require('inquirer');

function askGithubUsernameAndPassword() {
  var username = {
    type: 'input',
    name: 'username',
    message: 'github username'
  };
  var password = {
    type: 'password',
    name: 'password',
    message: 'github password (not stored locally)'
  };
  var using2Factor = {
    type: 'confirm',
    name: 'twoFactor',
    message: 'Use 2Factor auth?'
  };

  return new Promise(function (resolve) {
    var questions = [username, password, using2Factor];

    inquirer.prompt(questions, function (answers) {
      la(check.unemptyString(answers.username), 'missing username', answers);
      la(check.unemptyString(answers.password), 'missing password', answers);

      resolve({
        username: answers.username,
        password: answers.password,
        using2Factor: answers.twoFactor
      });
    });
  });
}

function askGithub2FactorCode() {
  var twoFactor = {
    type: 'input',
    name: 'twoFactor',
    message: 'enter GitHub 2Factor code'
  };

  return new Promise(function (resolve) {
    var questions = [twoFactor];

    inquirer.prompt(questions, function (answers) {
      la(check.unemptyString(answers.twoFactor),
        'missing two factor code', answers);

      resolve(answers.twoFactor);
    });
  });
}

function githubLogin() {
  return askGithubUsernameAndPassword()
    .tap(function (answers) {
      log('trying to login to github %s', answers.username);
      la(check.unemptyString(answers.password), 'empty password for', answers.username);

      utils.github.authenticate({
        type: 'basic',
        username: answers.username,
        password: answers.password
      });
    })
    .then(function set2FactorHeader(answers) {
      if (answers.using2Factor) {
        return askGithub2FactorCode()
          .then(function (twoFactor) {
            la(check.unemptyString(twoFactor), 'expected valid two factor code');
            debug('User 2Factor code %s', twoFactor);
            utils.github.twoFactor = twoFactor;
          });
      }
    });
}

module.exports = githubLogin;

if (!module.parent) {
  (function exampleLogin() {
    log('example github login');
    githubLogin()
      .then(function () {
        log('finished login, trying a sample method');
      }).then(function () {
        var getFromToTags = require('./get-commits-from-tags');
        var question = {
          user: 'kensho',
          repo: 'charts-lib',
          from: '0.4.0',
          to: '0.4.2'
        };

        getFromToTags(question)
          .then(log);
      });
  }());
}

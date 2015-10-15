/* global describe, it */
require('lazy-ass');
var check = require('check-more-types');

describe('utils', function () {
  var utils = require('./utils');

  describe('verifyGithub', function () {
    var verifyGh = utils.verifyGithub;
    var repo = {
      type: 'git',
      url: 'https://github.com/foo/bar.git'
    };

    it('works with 2 args', function () {
      la(check.fn(verifyGh));
      verifyGh('foo', repo);
    });

    it('works curried', function () {
      verifyGh('foo')(repo);
    });

    it('throws', function () {
      la(check.raises(function () {
        verifyGh('foo', null);
      }), 'threw an error');
    });
  });

  describe('first line', function () {
    var firstLine = utils.firstLine;

    it('returns the only line', function () {
      var line = 'hi there';
      var first = firstLine(line);
      la(first === line, 'line has not changed', first);
    });

    it('returns the first line from multiline', function () {
      var text = 'hi there\nsecond line';
      var first = firstLine(text);
      la(first === 'hi there', 'only the first line', first, 'from', text);
    });
  });

  describe('trimming tags and versions', function () {
    var trim = utils.trimVersion;

    it('passes semver', function () {
      var tag = '3.0.0';
      var trimmed = trim(tag);
      la(trimmed === tag, 'unchanged semver', trimmed, 'from', tag);
    });

    it('removes leading v', function () {
      var tag = 'v3.0.0';
      var trimmed = trim(tag);
      la(trimmed === '3.0.0', 'removed leading v from', trimmed, 'from', tag);
    });
  });

  describe('is github user / repo pair', function () {
    var isGithubName = utils.isGithubName;

    it('rejects simple word', function () {
      la(!isGithubName('foo'));
    });

    it('rejects multiple words', function () {
      la(!isGithubName('foo/bar/baz'));
    });

    it('detects user / repo', function () {
      la(isGithubName('foo/bar'));
    });

    it('detects user / repo with dashes', function () {
      la(isGithubName('foo-bar/baz'));
    });

    it('detects user / repo with dashes and digits', function () {
      la(isGithubName('foo-bar/baz-21'));
    });
  });

  describe('parsing github user/repo pair', function () {
    var parseGithubName = utils.parseGithubName;

    it('detects user / repo', function () {
      var result = parseGithubName('foo/bar');
      la(result.user === 'foo', 'username', result);
      la(result.repo === 'bar', 'reponame', result);
    });

    it('detects user / repo with dashes', function () {
      var result = parseGithubName('foo-21/bar-baz');
      la(result.user === 'foo-21', 'username', result);
      la(result.repo === 'bar-baz', 'reponame', result);
    });
  });

  describe('parse github url', function () {
    var parse = utils.parseGithubUrl;

    it('parses example .git', function () {
      var url = 'https://github.com/bahmutov/next-update.git';
      var info = parse(url);
      la(check.object(info), 'not an object', info);
      la(check.has(info, 'user'), 'missing user', info);
      la(check.has(info, 'repo'), 'missing repo', info);

      la(info.user === 'bahmutov', 'wrong user', info);
      la(info.repo === 'next-update', 'wrong repo', info);
    });

    it('parses example without .git', function () {
      var url = 'https://github.com/chalk/chalk';
      var info = parse(url);
      la(info.user === 'chalk', 'wrong user', info);
      la(info.repo === 'chalk', 'wrong repo', info);
    });

    it('parses git@ urls', function () {
      var url = 'git@github.com:kensho/ng-describe.git';
      var info = parse(url);
      la(info.user === 'kensho', 'wrong user', info);
      la(info.repo === 'ng-describe', 'wrong repo', info);
    });

  });
});

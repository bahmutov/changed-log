require('lazy-ass');
var check = require('check-more-types');

describe('utils', function () {
  var utils = require('./utils');

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

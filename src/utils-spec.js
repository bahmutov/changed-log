require('lazy-ass');
var check = require('check-more-types');

describe('utils', function () {
  var utils = require('./utils');

  describe('parse github url', function () {
    var parse = utils.parseGithubUrl;

    it('parses example', function () {
      var url = 'https://github.com/bahmutov/next-update.git';
      var info = parse(url);
      la(check.object(info), 'not an object', info);
      la(check.has(info, 'user'), 'missing user', info);
      la(check.has(info, 'repo'), 'missing repo', info);

      la(info.user === 'bahmutov', 'wrong user', info);
      la(info.repo === 'next-update', 'wrong repo', info);
    });

  });
});

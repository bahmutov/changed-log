console.log('running with mocked Github calls');

require('lazy-ass');
var check = require('check-more-types');
var Promise = require('bluebird');
var mockCommits = require('./mock-chalk-ids.json');
var mockComments = require('./mock-chalk-comments.json');

require = require('really-need');

function mockGetCommitsFromTags(info) {
  console.log('mock get commits from tags', info);
  la(info.repo === 'chalk', 'got unexpected request', info);
  return Promise.resolve(mockCommits);
}

function mockGetComments(info) {
  console.log('mock get comments between commits', info);
  la(info.repo === 'chalk', 'got unexpected request', info);
  return Promise.resolve(mockComments);
}

require('../src/get-commits-from-tags', {
  post: function (exported, filename) {
    return mockGetCommitsFromTags;
  }
});

require('../src/get-commits-between', {
  post: function (exported, filename) {
    return mockGetComments;
  }
});

(function adjustProcessArgs() {
  process.argv.splice(1, 1);
  console.log('removed this filename from process arguments');
  process.argv[1] = require('path').resolve(process.argv[1]);
  console.log('resolved the name of the next script to load');
}());

console.log('loading the real script from %s', process.argv[1]);
require(process.argv[1]);


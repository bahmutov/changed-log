require('lazy-ass');
var check = require('check-more-types');

var log = console.log.bind(console);
var debug = require('debug')('main');
var _ = require('lodash');
var pkg = require('./package.json');

var options = {
  name: process.argv[2],
  from: process.argv[3],
  to: process.argv[4]
};

var isValidCliOptions = check.schema.bind(null, {
  name: check.unemptyString,
  from: check.unemptyString,
  to: check.unemptyString
});
if (!isValidCliOptions(options)) {
  log('%s@%s <package name> <from version> <to version>', pkg.name, pkg.version);
  process.exit(-1);
}

var changedLog = require('./src/changed-log');
changedLog(options);

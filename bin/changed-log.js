#!/usr/bin/env node

require('lazy-ass')
var check = require('check-more-types')

/* eslint no-console:0 */
var log = console.log.bind(console)
var debug = require('debug')('changed')
var _ = require('lodash')
var pkg = require('../package.json')
var updateNotifier = require('update-notifier')
updateNotifier({ pkg: pkg }).notify()

var options = {
  name: process.argv[2],
  from: process.argv[3],
  to: process.argv[4]
}

options.auth = _.some(process.argv, function (word) {
  return word === '--auth'
})
debug('options', options)

// TODO implement semver in check-more-types
var isValidCliOptions = check.schema.bind(null, {
  name: check.unemptyString,
  from: check.maybe.unemptyString,
  to: check.maybe.unemptyString
})
if (!isValidCliOptions(options)) {
  log('%s@%s <package name> <from version> <to version> [options]',
    pkg.name, pkg.version)
  log('options:\n  --auth  - login with github credentials for increased rate limit')
  /* eslint no-process-exit:0 */
  process.exit(-1)
}

if (!options.to) {
  debug('"to" version is not set, assuming latest')
  options.to = 'latest'
}

var changedLog = require('../src/changed-log')
changedLog(options)
  .catch(function (err) {
    debug(err.toString())
    debug(err.stack)
  })
  .done()

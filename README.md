# changed-log

> Returns all commit messages between 2 versions of an NPM module

[![NPM][npm-icon] ][npm-url]
[![Circle CI][circle-ci-icon] ][circle-ci-url]
[![Travis CI][travis-ci-image] ][travis-ci-url]

Install: `npm install -g changed-log`

Use:

> What has changed for module 'chalk' between version 0.3.0 and 0.5.1?

    $ changed-log chalk 0.3.0 0.5.1
    found 30 commits finishing with the latest commit 994758f
    Changelog for module chalk repo chalk/chalk from 0.3.0 to 0.5.1

    0.5.1
      994758f: 0.5.1
      ca250ab: Merge pull request #33 from seanmonstar/_styles
      7ef6f4c: dont use slice on arguments
      4291833: return a new function for each getter

    0.5.0
      3073fa3: 0.5.0
      af17529: use rawgithub to workaround npm website bug with relative image paths
      3ab833d: bench - increase iterations for more reliable results
      ...

    0.4.0
      0a33a27: 0.4.0
      ...
      15f928f: Update readme

The information is fetched from the github repo corresponding to the NPM package.
Alternatively you can provide github username / repo instead of NPM package name

    $ changed-log kensho/ng-describe 0.3.0 0.5.0

For private repos, you can authenticate one time (including 2Factor) by passing commandline
option `--auth` with the command

## Edge cases

To find all changes between a module and the latest release use the command

    $ changed-log <name> <from> latest
    $ changed-log pre-git 1.2.0 latest

If you only provide a single version from a folder that contains `package.json`
it will read the 'from' version from the the `package.json`, assuming you have only
provided the 'to' version

    $ changed-log <name> <to>
    # reads name "from" version in the package.json

If you do not provide any version information, it tries to read 'from' version
in the `package.json` and uses `latest` for 'to' version

    $ changed-log <name>
    # shows list of commits between the current version in package.json and latest

## Using as a module

You can use `changed-log` as a module from your application.

```js
var changedLog = require('changed-log');
// exports single function
changedLog(options, reportingOptions);
/*
  options = {
    auth: true | false - ask user to authenticate, optional
    name: <string> - package name OR <github username/repo name> to go directly to Github
    from: <string> - first tag
    to: <string> - second tag
  },
  reportingOptions = {
    details: true | false - prints the full commit message if true, otherwise just first line
  }
*/
```

The `changedLog` function returns a promise, resolved after report printing is complete.
The promise is resolved with an instance of `Report`, see [src/report.js](src/report.js)

### Small print

Author: Gleb Bahmutov &copy; 2015

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](http://glebbahmutov.com)
* [blog](http://glebbahmutov.com/blog/)

License: MIT - do anything with the code, but don't blame me if it does not work.

Spread the word: tweet, star on github, etc.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/changed-log/issues) on Github

## MIT License

Copyright (c) 2015 Gleb Bahmutov

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

[npm-icon]: https://nodei.co/npm/changed-log.png?downloads=true
[npm-url]: https://npmjs.org/package/changed-log
[circle-ci-icon]: https://circleci.com/gh/bahmutov/changed-log.svg?style=svg
[circle-ci-url]: https://circleci.com/gh/bahmutov/changed-log
[travis-ci-image]: https://travis-ci.org/bahmutov/changed-log.png?branch=master
[travis-ci-url]: https://travis-ci.org/bahmutov/changed-log

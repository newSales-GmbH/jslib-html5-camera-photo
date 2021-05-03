// const zip = require('bestzip');
const chalk = require('chalk');
const fs = require('fs');
const compressing = require('compressing');
const pump = require('pump');
const sanitize = require('sanitize-filename');
const printBuildError = require('react-dev-utils/printBuildError');

const tgzStream = new compressing.tgz.Stream();
tgzStream.addEntry('build');
tgzStream.addEntry('package.json');
tgzStream.addEntry('README.md');

const fsStream = fs.createWriteStream(`${sanitize(process.env.npm_package_name)}_${sanitize(process.env.npm_package_version)}.tgz`);
pump(tgzStream, fsStream, err => {
  if (err) {
    console.log(chalk.red('Failed to zip.\n'));
    printBuildError(err);
  }
});

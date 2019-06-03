const path = require('path');

const paths = {
    appBuild: path.resolve(__dirname, '../build'),
    appPublic: '/',
    appPackageJson: path.resolve(__dirname, '../package.json'),
    yarnLockFile: path.resolve(__dirname, '../yarn.lock'),
};

module.exports = paths;

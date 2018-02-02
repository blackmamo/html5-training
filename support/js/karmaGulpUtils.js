var gulp = require('gulp');
var KarmaServer = require('karma').Server;
var getArg = require('./getArg')

// Parse additional args passed to gulp
var debugKarmaArg = getArg('mamos-debug-karma', 9021)

// exports a stream to launch karma that will be setup to debug if gulp is passed that arg
module.exports = function(baseConfig, done) {
    if (debugKarmaArg){
        Object.assign(baseConfig,{
            browsers: ['Chrome_customised'],
            customLaunchers: {
                Chrome_customised: {
                    base: 'Chrome',
                    flags: [
                        '--remote-debugging-port='+debugKarmaArg,
                        '--no-first-run', '--disable-fre', '--disable-extensions', '--disable-plugins',
                        '--disable-component-extensions-with-background-pages'
                    ]
                }
            },
            browserNoActivityTimeout: 1000000,
            logLevel: "DEBUG"
        })
        baseConfig.client.jasmine['timeout'] = 1000000
    }
    Object.assign(baseConfig, {configFile: process.cwd()+'/spec/integration/karma.conf.js'})
    new KarmaServer(baseConfig, done).start();
}
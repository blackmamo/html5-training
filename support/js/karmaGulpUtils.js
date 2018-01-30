var gulp = require('gulp');
var through = require('through2');
var KarmaServer = require('karma').Server;
var getArg = require('./getArg')

// Parse additional args passed to gulp
var debugKarmaArg = getArg('mamos-debug-karma', 9021)

// exports a stream to launch karma that will be setup to debug if gulp is passed that arg
module.exports = function(baseConfig) {
    return through.obj(
        function (file, enc, done) {
            if (debugKarmaArg){
                Object.assign(baseConfig,{
                    browsers: ['Chrome_customised'],
                    customLaunchers: {
                        Chrome_customised: {
                            base: 'Chrome',
                            flags: [
                                '--remote-debugging-port='+debugKarmaArg,
                                '--user-data-dir=C:\\Users\\mamos\\.WebStorm2017.3\\config\\chrome-user-data-debug',
                                '--no-first-run', '--disable-fre', '--no-default-browser-check'
                            ]
                        }
                    },
                    debug: debugKarmaTests
                })
            }
            Object.assign(baseConfig, {configFile: file.base+'karma.conf.js'})
            new KarmaServer(baseConfig, done).start();
        })
}
var gulp = require('gulp');
var benchmark = require('gulp-benchmark');
var jasmine = require('gulp-jasmine');
var karma = require('mamos-support/js/karmaGulpUtils');
require('karma-jasmine');
var dockerUtils = require('mamos-support/js/dockerGulpUtils');

// This dependency does the magic things needed when using the debug server option
var util = require('./spec/support/serverGulpUtils')

// If this var is set, the server will be started up such that the
var ServerImg = "matcher", ServerContainer ="matchServer"

gulp.task('createImage', function(done){
    return util.createServerImage(ServerImg, done)
})

gulp.task('runServer', ['createImage'], function(){
    util.runServer(ServerImg, ServerContainer, {isTest: false, removeDeadOrders: false})
})

gulp.task('runTestServer', ['createImage'], function(){
    util.runServer(ServerImg, ServerContainer, {isTest: true, removeDeadOrders: false})
})

gulp.task('runPerfTestServer', ['createImage'], function(){
    //running perf tests we don't want the baggage of storing the order history
    util.runServer(ServerImg, ServerContainer, {isTest: true, removeDeadOrders: true})
})

gulp.task('unitTests', function() {
    gulp.src('spec/unit/*.js').pipe(jasmine())
})

// When debugging the server, it stays alive and we have hot code swap, so we don't want to
// restart it each time we run the tests
gulp.task('integrationTests', util.nonServerDebugDependencies(['runTestServer']), function(done) {
    gulp.src('spec/integration/*.js')
        .pipe(karma({
            // This is how we pass the server address to the client
            client: {
                jasmine: {
                    serverPort: util.boundServerPort
                },
            }
        }))
})

// When debugging the server, it stays alive and we have hot code swap, so we don't want to
// restart it each time we run the tests
gulp.task('perfTests', util.nonServerDebugDependencies(['runTestServer']), function(done) {
    gulp.src('spec/integration/*.js')
        .pipe(karma({
            configFile: file.base+'karma.conf.js',
            // This is how we pass the server address to the client
            client: {
                jasmine: {
                    serverPort: util.boundServerPort
                },
            }
        }))
})

gulp.task('all', ['unitTests', 'integrationTests', 'perfTests'])
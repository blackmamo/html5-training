var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var karma = require('bitcoin-support/js/karmaGulpUtils');
var perfTests = require('./test/benchmarks/benchmarkSuite');

// This dependency does the magic things needed when using the debug server option
var util = require('./spec/support/serverGulpUtils')

// If this var is set, the server will be started up such that the
var ServerImg = "matcher", ServerContainer ="matchServer"

gulp.task('createImage', function(done){
    return util.createServerImage(ServerImg, done)
})

gulp.task('runServer', ['createImage'], function(){
    util.runServer(ServerImg, ServerContainer, {})
})

gulp.task('runTestServer', ['createImage'], function(){
    util.runServer(ServerImg, ServerContainer, {isTest: true, canClearBook: true})
})

gulp.task('runPerfTestServer', ['createImage'], function(){
    //running perf tests we don't want the baggage of storing the order history
    util.runServer(ServerImg, ServerContainer, {isTest: true, removeDeadOrders: true})
})

gulp.task('unitTests', function(done) {
    gulp.src('spec/unit/*.js')
        .pipe(jasmine())
        .on('jasmineDone',function(){done()})
})

gulp.task('integrationTests', util.nonServerDebugDependencies(['runTestServer']), function(done) {
    karma({
        // This is how we pass the server address to the client
        client: {
            jasmine: {
                serverPort: util.boundServerPort()
            },
        }
    }, done)
})

gulp.task('perfTests', util.nonServerDebugDependencies(['runTestServer']), function(done) {
    perfTests(util.boundServerPort(), done)
})

gulp.task('all', ['unitTests', 'integrationTests', 'perfTests'])
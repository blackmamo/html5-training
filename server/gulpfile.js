var gulp = require('gulp');
var changed = require('gulp-changed');
var benchmark = require('gulp-benchmark');
var jasmine = require('gulp-jasmine');
var cp = require('child_process');
var fs = require('fs');
var through = require('through2');
var KarmaServer = require('karma').Server;

var DockerFile = "DockerFile", PackageFile = "package.json", AppCode = "app/**/*.js"
var TestImg = "test_matcher", ServerImg = "matcher",
    TestContainer = "testMatchServer", ServerContainer ="matchServer"

// If the gulp task is being debugged then we will do things differently
var debuggingGulp = process.execArgv &&
    (process.execArgv.findIndex(function (arg){return arg.includes("inspect-brk")}) != -1)
var dockerServerBoundPort

function runCmd(cmd, captureOutput) {
    console.log('Executing: ' + cmd)
    console.log('This could take some time')
    return cp.execSync(cmd, captureOutput ? {} : { stdio: 'inherit' })
}

function createImage(inputs, imgName){
    // used to determine if we need to rebuild the image, which is expensive,
    // relying on having written this file and gulp-changed is easier than
    // writing code that checks with docker, but isn't 100% accurate e.g. the img manually deleted
    var imgCreatedFile = 'dist/'+imgName+'.created'

    return gulp.src(inputs)
        .pipe(changed('dist',{transformPath: function(p){return imgCreatedFile}}))
        .pipe(through.obj(function (file, enc, done){
            runCmd('docker build -t '+imgName+' .')
            fs.writeFileSync(imgCreatedFile,'Last test image created '+Date.now())
            done()
        }))
}

function runImage(imgName, runOptions, containerName, command) {
    try {
        runCmd('docker rm -f ' + containerName)
    } catch(err) {}
    containerName =  containerName ? ' --name ' + containerName : ''
    command =  command ? command : ''
    runCmd('docker run -d --rm ' + runOptions + containerName + ' ' + imgName + ' ' + command)
}

gulp.task('testImage', function(done){
    // since we will rely on a volume mapping to bring in the code, the only
    // thing that changes the image is the docker file, or package.json
    return createImage([DockerFile, PackageFile], TestImg).pipe(through.obj(done))
})

gulp.task('serverImage', function(done){
    // The server code bakes in the application and requires rebuilds when the code is changed
    return createImage([DockerFile, PackageFile, AppCode], ServerImg).pipe(through.obj(done))
})


gulp.task('runServer', ['serverImage'], function(){
    // dynamic port binding when testing, and use local file volume
    runImage(ServerImg, '', ServerContainer)
})

gulp.task('runTestServer', ['testImage'], function(){
    // dynamic port binding when testing, this is overridden with a fixed port if we are debugging
    // and we use a local file volume so developers don't need to build a new docker image when they
    // change files
    if (debuggingGulp) {
        dockerServerBoundPort =  8888
        runImage(TestImg,
            '--expose=9000 -p 9999:9000 -p '+dockerServerBoundPort+':8080 -v '+process.cwd()+'/app:/usr/src/app/app:ro',
            TestContainer, 'startDebug')
    } else {
        runImage(TestImg, '-p 8080 -v '+process.cwd()+'/app:/usr/src/app/app:ro', TestContainer, 'startTest')
        var portOutput = runCmd('docker port '+TestContainer+' 8080', true)
        dockerServerBoundPort =  /\d(\.\d){3}:(\d+)/.exec(portOutput)[2]
    }

    console.log('Server was mapped to host port: ' + dockerServerBoundPort)
})

gulp.task('unitTests', function() {
    gulp.src('spec/unit/*.js').pipe(jasmine())
})

gulp.task('integrationTests', ['runTestServer'], function(done) {
    // This all exists to make it easier for devs. If the gulp task is run in debug mode, we assume
    // it was launched e.g. from the ide in a debug mode. We will want to debug the actual test too
    // so we pass the debug flags into the browser that karma launches. Using a fixed port to make the
    // dev's life easy. No contention for ports here unlike in C.I. context
    // var debugging = process.execArgv && (process.execArgv.findIndex(function (arg){
    //     return arg.includes("inspect-brk")}) != -1)
    // var browserDebugPort = 9000
    //Chrome attempts
    // var debuggingFlags = debugging ? ['--remote-debugging-port='+browserDebugPort, '--wait-for-debugger-children','--renderer-process-limit=1'] : []
    //phantom attempts
    //var debuggingFlags = debugging ? ['--remote-debugger-port='+browserDebugPort,'--remote-debugger-autorun=no'] : []
    // if (debugging) {
    //     console.log("Starting karma with the browser in debug mode on port " + browserDebugPort)
    // }

    gulp.src('spec/integration/*.js').pipe(through.obj(
        function (file, enc, done) {
            new KarmaServer({
                configFile: file.base+'karma.conf.js',
                // This is how we pass the server address to the client
                client: {
                    jasmine: {
                        serverPort: dockerServerBoundPort
                    },
                }//,
                // customLaunchers: {
                //     PhantomJS_customised: {
                //         base: 'Chrome',
                //         flags: debuggingFlags
                //     }
                // },
                // captureTimeout: debugging ? 60000 : 1000
            }, done).start();
        }))
})

gulp.task('all', ['unitTests', 'integrationTests'])
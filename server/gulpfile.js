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

function runImage(imgName, runOptions, containerName) {
    try {
        runCmd('docker rm -f ' + containerName)
    } catch(err) {}
    containerName =  containerName ? ' --name ' + containerName : ''
    runCmd('docker run -d --rm ' + runOptions + containerName + ' ' + imgName)
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
    // dynamic port binding when testing, and use local file volume
    runImage(TestImg, '-p 80 -v app:/usr/src/app/app:ro', TestContainer)

    // {} means runCmd captures the stdout instead of passing it to console
    var portOutput = runCmd('docker port '+TestContainer+' 80', true)
    dockerServerBoundPort =  /\d(\.\d){3}:(\d+)/.exec(portOutput)[2]
    console.log('Server was mapped to host port: ' + dockerServerBoundPort)
})

gulp.task('unitTests', function() {
    gulp.src('spec/unit/*.js').pipe(jasmine())
})

gulp.task('integrationTests', ['runTestServer'], function(done) {
    gulp.src('spec/integration/*.js').pipe(through.obj(
        function (file, enc, done) {
            console.log(process.cwd())
            new KarmaServer({
                configFile: file.base+'karma.conf.js'
            }, done).start();
        }))
})

gulp.task('all', ['unitTests', 'integrationTests'])
var gulp = require('gulp');
var karma = require('gulp-karma');
var benchmark = require('gulp-benchmark');
var jasmine = require('gulp-jasmine');

var dockerServerBoundPort

gulp.task(function unitTests() {
    gulp.src('spec/unit/*.js').pipe(jasmine())
})

gulp.task(function integrationTests() {
    gulp.src('spec/integration/*.js').pipe(jasmine())
})

gulp.task('all', ['unitTests', 'integrationTests'])
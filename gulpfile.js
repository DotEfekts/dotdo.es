// Sass configuration
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');

gulp.task('sass', function(cb) {
  gulp
    .src('css/**/*.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      })
    );
  cb();
});

gulp.task('minify', function(cb) {
  gulp
    .src(['css/**/*.css', '!css/**/*.min.css'])
    .pipe(plumber())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      }));
  cb();
});

gulp.task(
  'default',
  gulp.series('sass', 'minify', function(cb) {
    gulp.watch('css/**/*.scss', gulp.series('sass'));
    gulp.watch(['css/**/*.css', '!css/**/*.min.css'], gulp.series('minify'));
    cb();
  })
);
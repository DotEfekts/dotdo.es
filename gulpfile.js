// Sass configuration
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const cleanJS = require('gulp-minify');
const cwebp = require('gulp-cwebp');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const fs = require('fs');
const es = require('event-stream');

gulp.task('removedist', function(cb) {
  if(fs.existsSync('dist'))
    del(['dist']).then(function() { cb(); });
  else
    cb();
});

gulp.task('copysrc', function() {
    return gulp.src('./src/**/*')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copycontent', function() {
    return gulp.src('./content/**/*')
    .pipe(gulp.dest('./dist/content'));
});

gulp.task('sass', function() {
    return gulp.src('dist/css/**/*.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      }));
});

gulp.task('minifycss', function(cb) {
    return gulp.src(['dist/css/**/*.css', '!dist/css/**/*.min.css'])
    .pipe(plumber())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(
      gulp.dest(function(f) {
        return f.cwd + "/dist/css";
      }));
});

gulp.task('minifyjs', function(cb) {
    return gulp.src(['dist/js/**/*.js', '!dist/js/**/*.min.js'])
    .pipe(plumber())
    .pipe(cleanJS({
      ext:{
        src:'.js',
        min:'.min.js'
      },
      noSource: true
    }))
    .pipe(sourcemaps.write())
    .pipe(
      gulp.dest(function(f) {
        return f.cwd + "/dist/js";
      }))
});

gulp.task('buildimages', function (cb) {
  es.concat(
    gulp.src('dist/img/**/*.png')
    .pipe(cwebp({ q: 75 }))
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      })),
    gulp.src('dist/content/**/*.png')
    .pipe(cwebp({ resize: [1280, 0], q: 75 }))
    .pipe(rename({
      suffix: '-large'
    }))
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      })),
    gulp.src('dist/content/**/*.png')
    .pipe(cwebp({ resize: [640, 0], q: 75 }))
    .pipe(rename({
      suffix: '-regular'
    }))
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      })),
    gulp.src('dist/content/**/*.png')
    .pipe(cwebp({ resize: [480, 0], q: 75 }))
    .pipe(rename({
      suffix: '-medium'
    }))
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      })),
    gulp.src('dist/content/**/*.png')
    .pipe(cwebp({ resize: [320, 0], q: 75 }))
    .pipe(rename({
      suffix: '-small'
    }))
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      }))
  ).on('end', cb);
});

gulp.task('cleanup', function(cb) {
  Promise.all([
    del(['dist/content/**/*.png']),
    del(['dist/img/**/*.png']),
    del(['dist/css/**/*.scss']),
    del(['dist/css/**/*.css', '!dist/css/**/*.min.css']),
    del(['dist/js/**/*.js', '!dist/js/**/*.min.js'])
  ]).then(function() { cb(); });
});

gulp.task(
  'watch',
  gulp.series('copysrc', 'copycontent', 'sass', 'minifycss', 'minifyjs', 'buildimages', function(cb) {
    gulp.watch('src/css/**/*.scss', gulp.series('sass'));
    gulp.watch(['src/css/**/*.css', '!src/css/**/*.min.css'], gulp.series('minifycss'));
    gulp.watch(['src/js/**/*.js', '!src/js/**/*.min.js'], gulp.series('minifyjs'));
    cb();
  })
);

gulp.task(
  'build',
  gulp.series('removedist', 'copysrc', 'copycontent', 'sass', 'minifycss', 'minifyjs', 'buildimages', 'cleanup')
);

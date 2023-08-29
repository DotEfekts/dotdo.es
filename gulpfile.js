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

gulp.task('sass', function(cb) {
  gulp
    .src('src/css/**/*.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      })
    );
  cb();
});

gulp.task('minifycss', function(cb) {
  gulp
    .src(['src/css/**/*.css', '!src/css/**/*.min.css'])
    .pipe(plumber())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(
      gulp.dest(function(f) {
        return f.cwd + "/docs/css";
      }));
  cb();
});

gulp.task('minifyjs', function(cb) {
  gulp
    .src(['src/js/**/*.js', '!src/js/**/*.min.js'])
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
        return f.cwd + "/docs/js";
      }));
  cb();
});

gulp.task('copycontent', function(cb) {
  gulp
    .src('./content/**/*')
    .pipe(gulp.dest('./docs/content'));
  cb();
});

gulp.task('buildimages', function (cb) {
  gulp.src('docs/content/**/*.png')
    .pipe(cwebp({ resize: [1280, 0], q: 75}))
    .pipe(rename({
      suffix: '-large'
    }))
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      }));
      
  gulp.src('docs/content/**/*.png')
  .pipe(cwebp({ resize: [640, 0], q: 75}))
  .pipe(rename({
    suffix: '-regular'
  }))
  .pipe(
    gulp.dest(function(f) {
      return f.base;
    }));
    
  gulp.src('docs/content/**/*.png')
  .pipe(cwebp({ resize: [480, 0], q: 75}))
  .pipe(rename({
    suffix: '-medium'
  }))
  .pipe(
    gulp.dest(function(f) {
      return f.base;
    }));
    
  gulp.src('docs/content/**/*.png')
  .pipe(cwebp({ resize: [320, 0], q: 75}))
  .pipe(rename({
    suffix: '-small'
  }))
  .pipe(
    gulp.dest(function(f) {
      return f.base;
    }));

  cb();
});

gulp.task('removepng', function(cb) {
  del('docs/content/**/*.png');
  cb();
});

gulp.task(
  'default',
  gulp.series('sass', 'minifycss', 'minifyjs', function(cb) {
    gulp.watch('src/css/**/*.scss', gulp.series('sass'));
    gulp.watch(['src/css/**/*.css', '!src/css/**/*.min.css'], gulp.series('minifycss'));
    gulp.watch(['src/js/**/*.js', '!src/js/**/*.min.js'], gulp.series('minifyjs'));
    cb();
  })
);

gulp.task(
  'build',
  gulp.series('sass', 'minifycss', 'minifyjs', 'copycontent', 'buildimages')
);
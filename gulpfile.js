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
const connect = require('gulp-connect');
const rev = require('gulp-rev');
const revDel = require('gulp-rev-delete-original');
const revRewrite = require('gulp-rev-rewrite');

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
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(
      gulp.dest(function(f) {
        return f.cwd + "/dist/css";
      }));
});

gulp.task('minifycss-sourcemap', function(cb) {
  return gulp.src(['dist/css/**/*.css', '!dist/css/**/*.min.css'])
  .pipe(plumber())
  .pipe(sourcemaps.init())
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
    .pipe(
      gulp.dest(function(f) {
        return f.cwd + "/dist/js";
      }))
});

gulp.task('minifyjs-sourcemap', function(cb) {
    return gulp.src(['dist/js/**/*.js', '!dist/js/**/*.min.js'])
    .pipe(plumber())
    .pipe(sourcemaps.init())
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

gulp.task(
  'generaterev', 
  function(){
    return gulp.src(['dist/**/*.min.{css,js}', '!dist/**/vendor/*'])
    .pipe(rev())
    .pipe(revDel())
    .pipe(gulp.src('dist/**/*.html'))
    .pipe(revRewrite())
    .pipe(gulp.dest('dist'));
  }
);

gulp.task('cleanup', function(cb) {
  Promise.all([
    del(['dist/content/**/*.png']),
    del(['dist/img/**/*.png']),
    del(['dist/css/**/*.scss']),
    del(['dist/css/**/*.css', '!dist/css/**/*.min.css']),
    del(['dist/js/**/*.js', '!dist/js/**/*.min.js'])
  ]).then(function() { cb(); });
});

gulp.task('cleanupdev', function(cb) {
  Promise.all([
    del(['dist/content/**/*.png']),
    del(['dist/img/**/*.png']),
    del(['dist/css/**/*.scss'])
  ]).then(function() { cb(); });
});

gulp.task(
  'build',
  gulp.series('removedist', 'copysrc', 'copycontent', 'sass', 'minifycss', 'minifyjs', 'buildimages', 'generaterev', 'cleanup')
);

gulp.task(
  'builddev',
  gulp.series('removedist', 'copysrc', 'copycontent', 'sass', 'minifycss-sourcemap', 'minifyjs-sourcemap', 'buildimages', 'cleanup')
);

gulp.task(
  'serve',
  function(cb) {
    connect.server({
      root: 'dist',
      port: 8000,
      fallback: 'dist/index.html',
      livereload: true
    });
    cb();
  }
)

var lastPath = "";
function callReload(cb) {
  gulp.src(lastPath)
    .pipe(connect.reload());
  cb();
}

gulp.task(
  'watch',
  gulp.series('builddev', 'serve', function(cb) {
    const watcher = gulp.watch('src/**/*', gulp.series('builddev', callReload));
    watcher.on('change', function (path) {
      lastPath = path;
    });
    cb();
  })
);
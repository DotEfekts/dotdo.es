// Sass configuration
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const cleanJS = require('gulp-minify');
const cwebp = require('gulp-cwebp');
const through = require('through2');
const imageSize = require('image-size');
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
var gulpif = require('gulp-if');
var processhtml = require('gulp-processhtml');

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

gulp.task('removekb', function(cb) {
  del(['dist/content/knowledge-base']).then(function() { cb(); });
});

gulp.task('sass', function() {
    return gulp.src('dist/css/**/*.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(gulp.dest((f) => f.base));
});

gulp.task('minifycss', function() {
    return gulp.src(['dist/css/**/*.css', '!dist/css/**/*.min.css'])
    .pipe(plumber())
    .pipe(cleanCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest((f) => f.base));
});

gulp.task('minifycss-sourcemap', function() {
  return gulp.src(['dist/css/**/*.css', '!dist/css/**/*.min.css'])
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(cleanCSS())
  .pipe(sourcemaps.write())
  .pipe(rename({
    suffix: '.min'
  }))
  .pipe(gulp.dest((f) => f.base));
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
    .pipe(gulp.dest((f) => f.base));
});

gulp.task('minifyjs-sourcemap', function() {
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
    .pipe(gulp.dest((f) => f.base));
});

gulp.task('buildimages', function (cb) {
  return gulp.series(
    runCWebP('dist/img/**/*.{png,jpg}', { q: 75 }),
    runCWebP('dist/content/**/*.{png,jpg}', { resize: [1280, 0], q: 75 }, '-large'),
    runCWebP('dist/content/**/*.{png,jpg}', { resize: [640, 0], q: 75 }),
    runCWebP('dist/content/**/*.{png,jpg}', { resize: [480, 0], q: 75 }, '-medium'),
    runCWebP('dist/content/**/*.{png,jpg}', { resize: [320, 0], q: 75 }, '-small'),
    function(cb2) {
      cb2();
      cb();
    }
  )();
});

function runCWebP(path, params, suffix) {
  return function(cb){
    return gulp.src(path)
    .pipe(cwebp(params))
    .pipe(gulpif(suffix != undefined, rename({
      suffix: suffix
    })))
    .pipe(gulp.dest((f) => f.base));
  };
}


gulp.task('putimagesize', function(cb) {
  return gulp.src(['dist/content/**/*.md'])
    .pipe(through.obj((chunk, _, cb) => {
      if (chunk.isNull()) {
        callback(null, file);
        return;
      }
    
      let contents = chunk.contents.toString();
      contents = contents.replace(/\[\[(.*?)\]\]/gi, function (_, linkText) {
        let split = linkText.split('|');
        return split.length > 1 ? split[1] : split[0];
      });

      chunk.contents = Buffer.from(contents.replace(/\!\[(.*?)\]\((.*?)\.(png|jpg)\)/gi, (_, alt, path, type) => {
        let size = imageSize(`dist/content${path}.webp`);
        return `![${alt}](${path}[${size.width}x${size.height}])`
      }));

      cb(null, chunk);
    }))
    .pipe(gulp.dest((f) => f.base));
});

gulp.task(
  'processhtml', 
  function () {
  return gulp
    .src(['dist/**/*.html'])
    .pipe(processhtml())
    .pipe(gulp.dest((f) => f.base));
});

gulp.task(
  'generaterev', 
  function(){
    return gulp.src(['dist/**/*.min.{css,js}', '!dist/**/vendor/**/*'])
    .pipe(rev())
    .pipe(revDel())
    .pipe(gulp.src('dist/**/*.html'))
    .pipe(revRewrite())
    .pipe(gulp.dest((f) => f.base));
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
  gulp.series('removedist', 'copysrc', 'copycontent', 'removekb', 'sass', 'minifycss', 'minifyjs', 'buildimages', 'putimagesize', 'processhtml', 'generaterev', 'cleanup')
);

gulp.task(
  'builddev',
  gulp.series('removedist', 'copysrc', 'copycontent', 'removekb', 'sass', 'minifycss-sourcemap', 'minifyjs-sourcemap', 'buildimages', 'putimagesize', 'processhtml', 'cleanup')
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
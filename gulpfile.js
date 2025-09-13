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
const { marked } = require('marked');
const { glob } = require('glob');
const replace = require('gulp-replace');
const modRewrite = require('connect-modrewrite');
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
    return gulp.src('./content/**/*.md')
      .pipe(replace(/\[([^\]]+)\]\(([^:\)]*?).md\)/gi, '[$1]($2)'))
      .pipe(rename(path => path.dirname = path.dirname.startsWith("blog") ? "blog" : ""))
      .pipe(gulp.dest('./dist/content'));
});

gulp.task('copyimages', function() {
    return gulp.src(['./content/**/*.png', './content/**/*.jpg'])
      .pipe(rename(path => path.dirname = ""))
      .pipe(gulp.dest('./dist/img/content'));
});

gulp.task('buildimages', function (cb) {
  return gulp.series(
    runCWebP('dist/img/*.{png,jpg}', { q: 75 }),
    runCWebP('dist/img/content/**/*.{png,jpg}', { resize: [1280, 0], q: 75 }, '-large'),
    runCWebP('dist/img/content/**/*.{png,jpg}', { resize: [640, 0], q: 75 }),
    runCWebP('dist/img/content/**/*.{png,jpg}', { resize: [480, 0], q: 75 }, '-medium'),
    runCWebP('dist/img/content/**/*.{png,jpg}', { resize: [320, 0], q: 75 }, '-small'),
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

      chunk.contents = Buffer.from(contents.replace(/\!\[(.*?)\]\((.*?)\.(png|jpg)\)/gi, (_, alt, name, type) => {
        name = name.lastIndexOf("/") < 0 ? name : name.substring(name.lastIndexOf("/"));
        let size = imageSize(`dist/img/content/${name}.webp`);
        return `![${alt}](${name}[${size.width}x${size.height}])`
      }));

      cb(null, chunk);
    }))
    .pipe(gulp.dest((f) => f.base));
});

gulp.task('renderpages', function() {
    const contentFiles = glob('./dist/content/**/*.md');
    const imgRegex = new RegExp(/(<img .*?)src="\/(.*?)\%5B([0-9]+)x([0-9]+)\%5D"( .*?>)/, "gi");
    const imgOnlyChild = new RegExp(/<p>(\w*<img [^>]+?>\w*)<\/p>/, "gi");
    const imgOnlyChildFirst = new RegExp(/<p class="img-container">(\w*<img [^>]*?src="([^"]+)"[^>]*?\/?>\w*)<\/p>/, "i");
    const aExternalRegex = new RegExp(/(<a [^>]*?)(href="[^\:]+\:\/\/.*?>)/, "gi");
    const aInternalRegex = new RegExp(/(<a [^>]*?)href="([^\/][^\:"]*?".*?>)/, "gi");
    const titleRegex = new RegExp(/<(h1|h2)[^>]*>\w*([^<]+)\w*<\/(h1|h2)>/, "i");

    return contentFiles.then(vals => vals.map(v => {
      const markdown = fs.readFileSync(v, 'utf8').replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,"");
      let parsedDom = marked.parse(markdown, { breaks: true });

      let first = true;
      parsedDom = parsedDom.replace(imgRegex, function(_, pre, name, width, height, post) {
        if(first)
            post = ' fetchpriority="high" loading="eager"' + post;
        else
            post = ' loading="lazy"' + post;
        first = false;
        return pre + `width="${width}" height="${height}" src="/img/content/${name}.webp" srcset="/img/content/${name}-small.webp 320w, /img/content/${name}-medium.webp 480w, /img/content/${name}.webp 640w, /img/content/${name}-large.webp 1280w" sizes="(max-width: 920px) 80vw, 640px"` + post;
      });

      parsedDom = parsedDom.replace(imgOnlyChild, function(_, img) {
        return `<p class="img-container">${img}</p>`;
      });

      parsedDom = parsedDom.replace(aExternalRegex, function(_, pre, post) {
        return `${pre}target="_blank" ${post}`;
      });

      parsedDom = parsedDom.replace(aInternalRegex, function(_, pre, post) {
        return `${pre}href="/blog/${post}`;
      });

      let basePipe = gulp.src('./src/index.html')
        .pipe(replace('<!-- Content Render Injection -->', parsedDom))
        .pipe(replace(`<meta property="og:url" id="url-tag" content="https://dotdo.es/">`, 
          `<meta property="og:url" id="url-tag" content="https://dotdo.es/${v.slice('dist/content/'.length, v.length - (v.endsWith("index.md") ? 8 : 3))}">`));

      let titleMatch = parsedDom.match(titleRegex);
      if(titleMatch != null) {
        basePipe = basePipe
        .pipe(replace(`<title>Dot Does Stuff</title>`, `<title>${titleMatch[2]} - Dot Does Stuff</title>`))
        .pipe(replace(
          `<meta name="description" content="The personal website of Chelsea Pritchard (aka DotEfekts)." id="description-tag">`,
          `<meta name="description" content="${titleMatch[2]} on Dot Does Stuff (dotdo.es)" id="description-tag">`
        ))
        .pipe(replace(
          `<meta property="og:title" id="title-tag" content="Dot Does Stuff">`,
          `<meta property="og:title" id="title-tag" content="${titleMatch[2]} - Dot Does Stuff">`
        ));
      }

      let firstImageMatch = parsedDom.match(imgOnlyChildFirst);
      if(firstImageMatch != null) {
        basePipe = basePipe
        .pipe(replace(
          `<meta property="og:image" id="img-tag" content="https://dotdo.es/img/coolyori.png">`,
          `<meta property="og:image" id="img-tag" content="https://dotdo.es${firstImageMatch[2]}">`
        ));
      }

      return basePipe
        .pipe(rename(v.slice('dist/content/'.length, v.length - 2) + "html"))
        .pipe(gulp.dest('./dist/'));
    }));
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

gulp.task(
  'processhtml', 
  function () {
  return gulp
    .src(['dist/**/*.html'])
    .pipe(processhtml({
      includeBase: './dist'
    }))
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
  gulp.series('removedist', 'copysrc', 'copycontent', 'copyimages', 'buildimages', 'putimagesize', 'renderpages', 'removekb', 'sass', 'minifycss', 'minifyjs', 'processhtml', 'generaterev', 'cleanup')
);

gulp.task(
  'builddev',
  gulp.series('removedist', 'copysrc', 'copycontent', 'copyimages', 'buildimages', 'putimagesize', 'renderpages', 'removekb', 'sass', 'minifycss-sourcemap', 'minifyjs-sourcemap', 'processhtml', 'cleanup')
);

gulp.task(
  'serve',
  function(cb) {
    connect.server({
      root: 'dist',
      port: 8000,
      fallback: 'dist/404.html',
      livereload: true,
      middleware: function(connect, opt) {
      return [
        function(req, res, next) {
          // Check if the request is for an HTML file and doesn't already have an extension
          if (req.url.indexOf('.') === -1 && req.url !== '/') {
            // Append .html to the URL
            req.url += '.html';
          }
          next(); // Pass control to the next middleware
        }
      ]}
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
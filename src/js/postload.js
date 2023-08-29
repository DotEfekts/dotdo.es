window.addEventListener('load', function() {
    loadSheet('/css/music.min.css');
    loadSheet('/css/search.min.css');
    loadSheet('/css/print.min.css');

    loadScript('/js/search.min.js');
    loadScript('/js/music.min.js');

    loadSheet('/css/vendor/highlightjs-copy.min.css');
    loadSheet('/css/highlight.min.css');

    loadScript('/js/vendor/highlightjs-copy.min.js', () => loadHljsCopy());
    loadScript('/js/vendor/highlight/highlight.min.js', () => loadHljs());
});

function loadSheet(url) {
    let sheet = document.createElement("link");
    sheet.rel = "stylesheet";
    sheet.href = url;
    document.body.append(sheet);
}

function loadScript(url, callback) {
    let script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = callback;
    document.body.append(script);
}
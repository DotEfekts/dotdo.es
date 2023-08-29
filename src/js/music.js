var player;
var playOnReady = false;
var loadOnReady = false;

function onYouTubeIframeAPIReady() {
    apiLoaded = true;
    if(playOnReady || loadOnReady)
        loadYoutubeFrame();
}

function loadYoutubeFrame() {
    player = new YT.Player('player', {
        height: '100',
        width: '100',
        videoId: 'CwJx3Dbh4e8',
        playerVars: {
            'origin': 'https://dotdo.es/',
            'playsinline': 1,
            'start': 90,
            'end': 135,
            'enablejsapi': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

var playerLoaded = false;
var apiLoaded = false;
var musicEl = document.getElementById("music-container");

musicEl.addEventListener("pointerenter", loadYoutubeApi);

function loadYoutubeApi(event) {
    var script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.body.append(script);

    if(event.pointerType == "touch")
        loadOnReady = true;

    musicEl.removeEventListener("pointerenter", loadYoutubeApi);
}

function onPlayerReady(event) {
    event.target.setVolume(25);

    playerLoaded = true;
    if(playOnReady)
        overlayClick();
}

var overlayState = "unloaded";

function overlayClick() {
    if(playerLoaded) {
        if(overlayState == "unloaded") {
            overlayState = "loading";
            setMusicClass("loading");
            playVideo();
        } else if(overlayState == "playing") {
            pauseVideo();
        } else if(overlayState == "stopped") {
            setMusicClass("loading");
            playVideo();
        }
    } else {
        if(apiLoaded)
            loadYoutubeFrame();
        playOnReady = true;
        setMusicClass("loading");
    }
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        setMusicClass("playing");
        overlayState = "playing";
    } else if (event.data == YT.PlayerState.PAUSED) {
        setMusicClass("stopped");
        overlayState = "stopped";
    } else if (event.data == YT.PlayerState.ENDED) {
        pauseVideo();
    }
}

function setMusicClass(className) {
    musicEl.classList.remove("ready");
    musicEl.classList.remove("loading");
    musicEl.classList.remove("playing");
    musicEl.classList.remove("stopped");
    musicEl.classList.add(className);
}

function playVideo() {
    player.playVideo();
}

function pauseVideo() {
    player.pauseVideo();
    player.seekTo(90, true);
}


var overlayState = "unloaded";
var musicEl = document.getElementById("music-container");

function overlayClick() {
    if(overlayState == "unloaded") {
        overlayState = "loading";
        musicEl.className = "music-container loading";
        if(apiLoaded)
            createPlayer();
    } else if(overlayState == "playing") {
        pauseVideo();
    } else if(overlayState == "stopped") {
        playVideo();
    }
}

var player;
var apiLoaded = false;
function onYouTubeIframeAPIReady() {
    apiLoaded = true;
    if(overlayState == "loading")
        createPlayer();
}

function createPlayer() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
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

function onPlayerReady(event) {
    event.target.setVolume(25);
    playVideo();
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        pauseVideo();
    }
}

function playVideo() {
    player.playVideo();
    overlayState = "playing";
    musicEl.className = "music-container playing";
}

function pauseVideo() {
    player.pauseVideo();
    player.seekTo(90, true);
    overlayState = "stopped";
    musicEl.className = "music-container stopped";
}

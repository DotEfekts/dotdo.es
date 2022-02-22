var player;
function onYouTubeIframeAPIReady() {
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

var playerLoaded = false;
var musicEl = document.getElementById("music-container");

function onPlayerReady(event) {
    event.target.setVolume(25);

    playerLoaded = true;
    musicEl.className = "music-container ready";
}

var overlayState = "unloaded";

function overlayClick() {
    if(playerLoaded) {
        if(overlayState == "unloaded") {
            overlayState = "loading";
            musicEl.className = "music-container loading";
            playVideo();
        } else if(overlayState == "playing") {
            pauseVideo();
        } else if(overlayState == "stopped") {
            playVideo();
        }
    }
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        musicEl.className = "music-container playing";
        overlayState = "playing";
    } else if (event.data == YT.PlayerState.PAUSED) {
        musicEl.className = "music-container stopped";
        overlayState = "stopped";
    } else if (event.data == YT.PlayerState.ENDED) {
        pauseVideo();
    }
}

function playVideo() {
    player.playVideo();
}

function pauseVideo() {
    player.pauseVideo();
    player.seekTo(90, true);
}

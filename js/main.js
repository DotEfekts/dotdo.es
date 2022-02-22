
var overlayState = "unloaded";
var musicEl = document.getElementById("music-container");

function overlayClick() {
    if(overlayState == "unloaded") {
        overlayState = "loading";
        musicEl.className = "music-container loading";
        if(playerLoaded)
            playVideo();
    } else if(overlayState == "playing") {
        pauseVideo();
    } else if(overlayState == "stopped") {
        playVideo();
    }
}

var player;
var playerLoaded = false;
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

function onPlayerReady(event) {
    playerLoaded = true;
    event.target.setVolume(25);

    if(overlayState == "loading") {
        playVideo();
    }
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        musicEl.className = "music-container playing";
        overlayState = "playing";
    } else if (event.data == YT.PlayerState.PAUSED) {
        musicEl.className = "music-container stopped";
        overlayState = "stopped";
    } else if(event.data == YT.PlayerState.CUED) {
        musicEl.className = "music-container play";
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

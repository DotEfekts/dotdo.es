var player;
function onYouTubeIframeAPIReady() {
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

const markdownContainer = document.getElementById("markdown-container");
const contentContainer = document.getElementById("content-container");

const navContainer = document.getElementById("nav-container");
const currentUrl = new URL(document.URL);

navContainer.addEventListener("click", async function(event) {
    if(event.target.tagName === "A" && 
       event.target.href.startsWith(currentUrl.origin) && 
       !event.target.target){
        event.preventDefault();
        history.pushState({ url: event.target.href }, null, event.target.href);
        loadPage(new URL(event.target.href));
        return false;
    }
});

window.addEventListener("popstate", async function(event) {
    if(event.state.url)
        loadPage(new URL(event.state.url));
});

async function loadPage(url) {
    contentContainer.classList.add("loading");

    if(url.pathname === "" || url.pathname == "/")
        url.pathname = "/index";

    url.pathname = "/markdown" + url.pathname + ".md";

    let pageMarkdown;
    try {
        pageMarkdown = await getMarkdown(url);
        if(pageMarkdown === null)
            pageMarkdown = await getNotFound();
        if(pageMarkdown === "cancelled")
            return;
    } catch {
        pageMarkdown = "## An unknown error occurred. Could not load page.";
    }


    pageMarkdown = pageMarkdown.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,"");
    markdownContainer.innerHTML = marked.parse(pageMarkdown);
    contentContainer.classList.remove("loading");
}

var abortController;
async function getMarkdown(url) {
    abortController && abortController.abort();
    abortController = new AbortController();

    try {
        let currentLoad = await fetch(url, {
            signal: abortController.signal
        });

        if(currentLoad.status == 404)
            return null;
        if(currentLoad.status > 299)
            throw new Error("Unknown Error");
        
        return await currentLoad.text();
    } catch(err) {
        if(err.name == 'AbortError')
            return "cancelled";
        throw err;
    }
}

async function getNotFound() {
    return await getMarkdown("/markdown/404.md");
}

history.replaceState({ url: document.URL }, null, document.URL);
loadPage(currentUrl);
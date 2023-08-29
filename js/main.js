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

const currentUrl = new URL(document.URL);

window.addEventListener("click", async function(event) {
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
    const aTags = markdownContainer.getElementsByTagName("A");
    for (let i = 0; i < aTags.length; i++) {
        if(!aTags[i].href.startsWith(currentUrl.origin))
            aTags[i].target = "_blank";
    }

    contentContainer.classList.remove("loading");
}

var abortController;
async function getMarkdown(url, preserveExisting) {
    if(!preserveExisting)
    {
        abortController && abortController.abort();
        abortController = new AbortController();
    }

    try {
        let currentLoad = await fetch(url, {
            signal: preserveExisting ? null : abortController.signal
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

var searchInfo = document.createElement("div");
var searchBox = document.getElementById("article-search");
var searchResults = document.getElementById("search-results");
var searchOverlay = document.getElementById("search-overlay");

async function loadSearchData() {
    searchBox.value = "";

    let pageMarkdown;
    try {
        pageMarkdown = await getMarkdown("/markdown/writeups.md", true);
    } catch {
        console.log("Error loading search data");
    }

    if(!pageMarkdown)
        pageMarkdown = "## An unknown error occurred. Could not load search info.";

    pageMarkdown = pageMarkdown.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,"");
    searchInfo.innerHTML = marked.parse(pageMarkdown);

    const aTags = markdownContainer.getElementsByTagName("A");
    for (let i = 0; i < aTags.length; i++) {
        if(!aTags[i].href.startsWith(currentUrl.origin))
            aTags[i].target = "_blank";
    }

    searchBox.setAttribute('placeholder', 'Search...');
    searchBox.removeAttribute('disabled');
}

searchBox.addEventListener("input", processSearch);
searchBox.addEventListener("paste", processSearch);
searchBox.addEventListener("focus", processSearch);

function processSearch(event) {
    searchResults.innerHTML = "";
    let h2First = -1;
    let resultCount = 0;

    if(!searchBox.value) {
        closeSearch();
        return;
    }

    for(var i = 0; i < searchInfo.children.length && resultCount < 10; i++) {
        let child = searchInfo.children[i];
        if(h2First == -1)
            if(child.tagName == "H2")
                h2First = i;
            else
                continue;
        
        if(child.innerHTML.includes(searchBox.value)) {
            var linkCheck = child;
            if(child.tagName != "H2")
                linkCheck = searchInfo.children[i-1];

            if(linkCheck.getElementsByTagName("A").length > 0) {
                let resultDiv = document.createElement("div");
                let resultA = document.createElement("a");
                resultDiv.append(resultA);
                resultA.href = linkCheck.getElementsByTagName("A")[0].href;
                resultA.addEventListener("click", handleSearchClick);

                if(child.tagName == "H2")
                {
                    resultA.append(child.cloneNode(true));
                    if(searchInfo.children.length > i+1)
                        resultA.append(searchInfo.children[i+1].cloneNode(true));
                    i++;
                } else {
                    resultA.append(linkCheck.cloneNode(true));
                    resultA.append(child.cloneNode(true));
                }

                for(var x = 0; x < resultA.children.length; x++)
                    resultA.children[x].innerHTML = resultA.children[x].innerText;

                resultA.children[1].setAttribute('title', resultA.children[1].innerText);
                resultCount++;
                searchResults.append(resultDiv);
            }
        }
    }

    if(!searchResults.innerHTML)
        searchResults.innerHTML = "<h2>No search results found.</h2>";

    document.body.classList.add("show-search-results");
}

searchOverlay.addEventListener("click", closeSearch);

function closeSearch() {
    document.body.classList.remove("show-search-results");
}

function handleSearchClick(event) {
    if(event.currentTarget !== event.target){
        event.preventDefault();
        event.currentTarget.click();
        return false;
    }

    closeSearch();
}

loadSearchData();
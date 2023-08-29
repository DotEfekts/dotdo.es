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
    setMusicClass("ready");
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
            playVideo();
        }
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

const menuContainer = document.getElementById("nav-links-container");
const menuIcon = document.getElementById("menu-icon");
document.getElementById("menu-control").addEventListener("click", toggleMenu);

function toggleMenu() {
    menuContainer.classList.toggle("open");
    updateMenuIcon();
}

function updateMenuIcon() {
    if(menuContainer.classList.contains("open"))
        menuIcon.data = "img/menu_close.svg";
    else
        menuIcon.data = "img/menu_open.svg";
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
    menuContainer.classList.remove("open");
    updateMenuIcon();

    if(url.pathname === "" || url.pathname == "/")
        url.pathname = "/index";

    url.pathname = "/content" + url.pathname + ".md";

    let pageMarkdown;
    try {
        pageMarkdown = await getMarkdown(url);
        if(pageMarkdown === null)
            pageMarkdown = await getNotFound();
        if(pageMarkdown === "cancelled")
            return;
    } catch { }

    if(!pageMarkdown)
        pageMarkdown = "## An unknown error occurred. Could not load page.";


    pageMarkdown = pageMarkdown.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,"");
    markdownContainer.innerHTML = marked.parse(pageMarkdown);
    const aTags = markdownContainer.getElementsByTagName("A");
    for (let i = 0; i < aTags.length; i++) {
        if(!aTags[i].href.startsWith(currentUrl.origin))
            aTags[i].target = "_blank";
    }

    const children = markdownContainer.children;
    for (let i = 0; i < children.length; i++) {
        if(children[i].children.length == 1 && children[i].children[0].tagName == "IMG")
            children[i].classList.add("img-container");
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
    return await getMarkdown("/content/404.md");
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
        pageMarkdown = await getMarkdown("/content/writeups.md", true);
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

    const terms = searchBox.value.toLowerCase().split(' ');
    const results = [];

    for(var i = 0; i < searchInfo.children.length && resultCount < 10; i++) {
        let child = searchInfo.children[i];
        if(h2First == -1)
            if(child.tagName == "H2")
                h2First = i;
            else
                continue;
        
        let matches = 0;
        let contentSearch = child.innerHTML.toLowerCase();
        for(var t = 0; t < terms.length; t++)
            if(contentSearch.includes(terms[t]))
                child.tagName == "H2" ? matches += 2 : matches++;

        if(matches > 0) {
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

                resultDiv.numMatches = matches;
                results.push(resultDiv);
            }
        }
    }

    results.sort(function(a, b) {
        return b.numMatches - a.numMatches;
    });

    for(var r = 0; r < results.length; r++)
        searchResults.append(results[r]);

    if(!searchResults.innerHTML)
        searchResults.innerHTML = '<h2 class="no-results">No search results found.</h2>';

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

var scrollToTopBtn = document.getElementById("scroll-top");

scrollToTopBtn.addEventListener("click", function(event) {
    event.preventDefault();
    document.documentElement.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    return false;
});

document.addEventListener("scroll", function(event) {
    let rootElement = document.documentElement;
    var scrollTotal = rootElement.scrollHeight - rootElement.clientHeight;
    if (rootElement.scrollTop > rootElement.clientHeight * 0.5 && scrollTotal > rootElement.clientHeight) {
        scrollToTopBtn.classList.add("show")
    } else {
        scrollToTopBtn.classList.remove("show")
    }
});



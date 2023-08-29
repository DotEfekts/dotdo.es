const menuContainer = document.getElementById("nav-links-container");
const menuIcon = document.getElementById("menu-icon");
document.getElementById("menu-control").addEventListener("click", toggleMenu);

function toggleMenu() {
    menuContainer.classList.toggle("open");
    updateMenuIcon();
}

function updateMenuIcon() {
    if(menuContainer.classList.contains("open")){
        menuIcon.data = "img/menu_close.svg";
        menuContainer.ariaLabel = "Close the menu";
    } else {
        menuIcon.data = "img/menu_open.svg";
        menuContainer.ariaLabel = "Open the menu";
    }
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
    setTimeoutLoader();
    menuContainer.classList.remove("open");
    updateMenuIcon();

    if(url.pathname === "" || url.pathname == "/")
        url.pathname = "/index";

    url.pathname = "/content" + url.pathname + ".md";

    let pageMarkdown;
    try {
        pageMarkdown = await getMarkdown(url);
        if(pageMarkdown === null)
            pageMarkdown = await getMarkdown('/content/404.md');
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

    const imgTags = markdownContainer.getElementsByTagName("IMG");
    for (let i = 0; i < imgTags.length; i++) {
        if(i > 0)
            imgTags[i].loading = "lazy";

        let name = imgTags[i].getAttribute('src');
        imgTags[i].setAttribute('srcset', 
        name.replace(".png", "-small.webp") + " 320w, " + 
        name.replace(".png", "-medium.webp") + " 480w," + 
        name.replace(".png", "-regular.webp") + " 640w," + 
        name.replace(".png", "-large.webp") + " 1280w");

        imgTags[i].setAttribute('sizes', '(max-width: 920px) 80vw, 640px')

        imgTags[i].setAttribute('src', name.replace(".png", ".webp"));
    }

    const children = markdownContainer.children;
    for (let i = 0; i < children.length; i++) {
        if(children[i].children.length == 1 && children[i].children[0].tagName == "IMG")
            children[i].classList.add("img-container");
    }

    window.clearTimeout(timeout);
    timeout = null;
    
    contentContainer.classList.remove("loading");
}

var timeout;
function setTimeoutLoader() {
    if(!timeout)
        timeout = window.setTimeout(function() {
            contentContainer.classList.add("loading");
            timeout = null;
        }, 50);
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

        if(currentLoad.status === 404)
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

history.replaceState({ url: document.URL }, null, document.URL);
loadPage(currentUrl);

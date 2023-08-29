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

markdownContainer.addEventListener('touchstart', function(event) {
    let wrapper = event.target.closest('.hljs-copy-wrapper');
    if(wrapper) {
        wrapper.classList.add('show-copy');
        if(wrapper.copyTimeout)
            window.clearTimeout(wrapper.copyTimeout);
        wrapper.copyTimeout = window.setTimeout(function() { wrapper.copyTimeout = null; wrapper.classList.remove('show-copy');}, 5000);
    }
});

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

var imgRegex = new RegExp(/(<img .*?)src="\/(.*?)\.png"( .*?>)/, "gi");
var internalLinkRegex = new RegExp(/\[\[(.*?)\]\]/, "gi");
var loadingCallback = {};
var loadedLanguages = [];

function parseMarkdown(markdown, container) {
    markdown = markdown.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,"");
    let parsedDom = marked.parse(markdown, { breaks: true });

    let first = true;
    parsedDom = parsedDom.replace(imgRegex, function(_, pre, name, post) {
        if(!first)
            post = 'loading="lazy"' + post;
        first = false;
        return pre + `src="/content/${name}.webp" srcset="/content/${name}-small.webp 320w, /content/${name}-medium.webp 480w, /content/${name}.webp 640w, /content/${name}-large.webp 1280w" sizes="(max-width: 920px) 80vw, 640px"` + post;
    });

    parsedDom = parsedDom.replace(internalLinkRegex, function (_, linkText) {
        let split = linkText.split('|');
        return split.length > 1 ? split[1] : split[0];
    });

    container.innerHTML = parsedDom;
    const aTags = container.getElementsByTagName("A");
    for (let i = 0; i < aTags.length; i++) {
        if(!aTags[i].href.startsWith(currentUrl.origin))
            aTags[i].target = "_blank";
    }

    const children = container.children;
    for (let i = 0; i < children.length; i++) {
        if(children[i].children.length == 1 && children[i].children[0].tagName == "IMG")
            children[i].classList.add("img-container");
    }

    const codeBlocks = container.getElementsByTagName("CODE");
    for (let i = 0; i < codeBlocks.length; i++) {
        if(codeBlocks[i].parentElement.tagName == "PRE")
            if(codeBlocks[i].classList.length > 0) {
                for (let c = 0; c < codeBlocks[i].classList.length; c++)
                    if(codeBlocks[i].classList[c].startsWith('language-')){
                        let language = codeBlocks[i].classList[c].replace('language-', '');
                        highlightBlock(language, codeBlocks[i]);
                    }
            } else {
                codeBlocks[i].classList.add('language-bash');
                highlightBlock('bash', codeBlocks[i]);
            }
    }

}

function highlightBlock(language, block) {
    if(loadedLanguages.includes(language)){
        hljs.highlightElement(block);
    } else if(loadingCallback[language]) {
        loadingCallback[language].push(block);
    } else {
        let script = document.createElement("script");
        script.src = `/js/vendor/highlight/languages/${language}.min.js`;
        script.onload = function() {
            loadedLanguages.push(language);
            for(let l = 0; l < loadingCallback[language].length; l++)
                hljs.highlightElement(loadingCallback[language][l]);
            loadingCallback[language] = null;
        };

        loadingCallback[language] = [block];
        document.body.append(script);
    }
}

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

    parseMarkdown(pageMarkdown, markdownContainer);
    document.documentElement.scrollTo({
        top: 0,
        behavior: "smooth"
    });

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
        }, 200);
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

var printContainer = document.getElementById('print-content');
window.addEventListener("beforeprint", function() {
    printContainer.innerHTML = markdownContainer.innerHTML;
});
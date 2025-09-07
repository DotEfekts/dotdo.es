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

var printContainer = document.getElementById('print-content');
window.addEventListener("beforeprint", function() {
    printContainer.innerHTML = markdownContainer.innerHTML;
});

const markdownContainer = document.getElementById("markdown-container");
const contentContainer = document.getElementById("content-container");

markdownContainer.addEventListener('touchstart', function(event) {
    let wrapper = event.target.closest('.hljs-copy-wrapper');
    if(wrapper) {
        wrapper.classList.add('show-copy');
        if(wrapper.copyTimeout)
            window.clearTimeout(wrapper.copyTimeout);
        wrapper.copyTimeout = window.setTimeout(function() { wrapper.copyTimeout = null; wrapper.classList.remove('show-copy');}, 5000);
    }
}, { passive: true });

window.addEventListener("click", async function(event) {
    if(event.target.tagName === "A" && (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) && 
       event.target.href.startsWith(currentUrl.origin) && !event.target.target) {
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

var imgRegex = new RegExp(/(<img .*?)src="\/(.*?)\%5B([0-9]+)x([0-9]+)\%5D"( .*?>)/, "gi");
var loadingCallback = {};
var loadedLanguages = [];

function parseMarkdown(markdown, container) {
    markdown = markdown.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,"");
    let parsedDom = marked.parse(markdown, { breaks: true });

    let first = true;
    parsedDom = parsedDom.replace(imgRegex, function(_, pre, name, width, height, post) {
        if(first)
            post = ' fetchpriority="high" loading="eager"' + post;
        else
            post = ' loading="lazy"' + post;
        first = false;
        return pre + `width="${width}" height="${height}" src="/content/${name}.webp" srcset="/content/${name}-small.webp 320w, /content/${name}-medium.webp 480w, /content/${name}.webp 640w, /content/${name}-large.webp 1280w" sizes="(max-width: 920px) 80vw, 640px"` + post;
    });

    container.innerHTML = parsedDom;
    processContent(container);
}

function processContent(container) {
    const aTags = container.getElementsByTagName("A");
    for (let i = 0; i < aTags.length; i++) {
        if(!aTags[i].href.startsWith(currentUrl.origin))
            aTags[i].target = "_blank";
    }

    const children = container.children;
    let firstImage = true;
    for (let i = 0; i < children.length; i++) {
        if(children[i].children.length == 1 && children[i].children[0].tagName == "IMG") {
            children[i].classList.add("img-container");
            if(firstImage) {
                document.getElementById('img-tag').setAttribute('content', `https://dotdo.es${children[i].children[0].attributes.src.value}`);
                firstImage = false;
            }
        }
    }

    if(firstImage)
        document.getElementById('img-tag').setAttribute('content', `https://dotdo.es/img/coolyori.png`);

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

    var titles = container.getElementsByTagName("H1");
    if(titles.length = 0)
        titles = container.getElementsByTagName("H2");

    if(titles.length > 0 && titles[0].innerText != 'Dot Does Stuff') {
        document.title = `${titles[0].innerText} - Dot Does Stuff`;
        document.getElementById('title-tag').setAttribute('content', `${titles[0].innerText} - Dot Does Stuff`);
        document.getElementById('description-tag').setAttribute('content', `${titles[0].innerText} on Dot Does Stuff (dotdo.es)`);
    } else {
        document.title = 'Dot Does Stuff';
        document.getElementById('title-tag').setAttribute('content', 'Dot Does Stuff');
        document.getElementById('description-tag').setAttribute('content', 'The personal website of Chelsea Pritchard (aka DotEfekts).');
    }

    document.getElementById('url-tag').setAttribute('content', document.URL);
}

function highlightBlock(language, block) {
    if(loadedLanguages.includes(language)){
        triggerHighlight(block);
    } else if(loadingCallback[language]) {
        loadingCallback[language].push(block);
    } else {
        loadingCallback[language] = [block];

        if(typeof hljs !== 'undefined') {
            addHighlightLang(language);
        }
    }
}

function addHighlightLang(language) {
    let script = document.createElement("script");
    script.src = `/js/vendor/highlight/languages/${language}.min.js`;
    script.async = true;
    script.onload = function() {
        loadedLanguages.push(language);
        for(let l = 0; l < loadingCallback[language].length; l++)
            triggerHighlight(loadingCallback[language][l]);
        loadingCallback[language] = null;
    };
    document.body.append(script);
}

function runHighlight() {
    for(const lang in loadingCallback)
        addHighlightLang(lang);
}

async function triggerHighlight(element) {
    hljs.highlightElement(element);
}

async function loadPage(url) {
    setTimeoutLoader();
    menuContainer.classList.remove("open");
    updateMenuIcon();

    var pageMarkdown = await loadPageMarkdown(url);

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

if(typeof firstLoadMarkdown !== 'undefined' && firstLoadMarkdown) {
    parseMarkdown(firstLoadMarkdown, markdownContainer);
    contentContainer.classList.remove("first-load");
}

if(typeof pendingProcessing !== 'undefined' && pendingProcessing) {
    processContent(markdownContainer);
}

if(typeof CopyButtonPlugin !== 'undefined' && typeof hljs !== 'undefined')
    runHighlight();
function setTheme(theme) {
    document.documentElement.classList.remove('theme-auto');
    document.documentElement.classList.remove('theme-dark');
    document.documentElement.classList.remove('theme-light');
    document.documentElement.classList.add(theme);
}

function queryTheme() {
    const storedTheme = localStorage.getItem('theme');

    if (storedTheme) {
        setTheme(storedTheme);
    } else {
        setTheme('theme-auto');
    }
}

async function loadPageMarkdown(url) {
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

    return pageMarkdown;
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

var firstLoadMarkdown;
const currentUrl = new URL(document.URL);

async function firstLoad() {
    let markdown = await loadPageMarkdown(currentUrl);
    if(typeof parseMarkdown !== 'undefined') {
        parseMarkdown(markdown, document.getElementById("markdown-container"));
        document.getElementById("content-container").classList.remove("first-load");
    } else {
        firstLoadMarkdown = markdown;
    }
}

function loadHljs() {
    if(typeof CopyButtonPlugin !== 'undefined') {
        hljs.addPlugin(new CopyButtonPlugin());
        if(typeof runHighlight !== 'undefined')
            runHighlight();
    }
}

function loadHljsCopy() {
    if(typeof hljs !== 'undefined') {
        hljs.addPlugin(new CopyButtonPlugin());
        if(typeof runHighlight !== 'undefined')
            runHighlight();
    }
}

queryTheme();
firstLoad();
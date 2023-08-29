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
        document.getElementById("content-container").classList.remove("loading");
    } else {
        firstLoadMarkdown = markdown;
    }
}

firstLoad();
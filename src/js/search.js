var searchInfo = document.createElement("div");
var searchBox = document.getElementById("article-search");
var searchResults = document.getElementById("search-results");
var searchOverlay = document.getElementById("search-overlay");

async function loadSearchData() {
    searchBox.value = "";

    let pageMarkdown;
    try {
        pageMarkdown = await getMarkdown("/content/writeups/search.md", true);
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

                if(resultA.children.length > 1)
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

function selectSearch() {
    searchBox.select();
}

searchBox.addEventListener("input", processSearch);
searchBox.addEventListener("paste", processSearch);
searchBox.addEventListener("focus", processSearch);
searchBox.addEventListener("click", selectSearch);

loadSearchData();
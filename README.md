# Dot Does Stuff
The personal website for Chelsea Pritchard. I always have both too much and not enough free time.

## About This Site
This site runs entirely on [Github Pages](https://pages.github.com/), using markdown files for the content, rendered by [marked.js](https://marked.js.org/). A [Cloudflare transform rule](https://developers.cloudflare.com/rules/transform/) is used to modify the request path to prevent Github pages from returning a `404` response. The client code then reads the URL and requests the coresponding markdown file from the content folder. The search function takes the `writeups.md` file and searches the titles and content from it to parse results. You can view the source for this website on it's [Github repo here](https://github.com/DotEfekts/dotdo.es).

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
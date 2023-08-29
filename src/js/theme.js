function setTheme(theme) {
    document.body.classList.remove('theme-auto');
    document.body.classList.remove('theme-dark');
    document.body.classList.remove('theme-light');
    document.body.classList.add(theme);
}

function setThemeBool(dark) {
    if (dark) {
        setTheme('theme-dark');
    } else {
        setTheme('theme-light');
    }
}

function queryTheme() {
    const storedTheme = localStorage.getItem('theme');

    if (storedTheme) {
        setTheme(storedTheme);
    } else {
        setTheme('theme-auto');
    }
}

function cycleTheme(event) {
    event.preventDefault();

    let storedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if(!storedTheme)
        storedTheme = systemDark ? 'theme-light' : 'theme-dark';
    else if(storedTheme == 'theme-light')
        storedTheme = systemDark ? 'theme-dark' : null;
    else if(storedTheme == 'theme-dark')
        storedTheme = systemDark ? null : 'theme-light'
    
    if(storedTheme == null)
        localStorage.removeItem('theme');
    else
        localStorage.setItem('theme', storedTheme);

    queryTheme();
}

(function() {
    queryTheme();
    const switcher = document.getElementById('theme-switcher');
    switcher.addEventListener('click', cycleTheme);
    
    const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    themeQuery.addEventListener('change', event => {
        queryTheme();
    });
}());
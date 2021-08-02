/* cookie functions */
/* Taken from Plone */

export function createCookie(name, value, days) {
    var date,
        expires;
    if (days) {
        date = new Date();        
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = name + "=" + escape(value) + expires + "; path=/;";
}

export function readCookie(name) {
    var nameEQ = name + "=",
        ca = document.cookie.split(';'),
        i,
        c;
    for(i = 0; i < ca.length;i = i + 1) {
        c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return unescape(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
}

/* toggle vertical arrow icon */
export function toggle_arrow(arrow) {
    if (arrow.hasClass('bi-chevron-up')) {
        arrow.removeClass('bi-chevron-up');
        arrow.addClass('bi-chevron-down');
    } else {
        arrow.removeClass('bi-chevron-down');
        arrow.addClass('bi-chevron-up');
    }
};

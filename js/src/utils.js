import ts from 'treibstoff';

export function createCookie(name, value, days) {
    ts.deprecate('createCookie', 'ts.create_cookie', '1.1');
    ts.create_cookie(name, value, days);
}

export function readCookie(name) {
    ts.deprecate('readCookie', 'ts.read_cookie', '1.1');
    return ts.read_cookie(name);
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

/* calculate passed time from timestamp */
export function time_delta_str(time, end) {
    let now;
    /* istanbul ignore else */
    if (end) {
        now = end;
    } else {
        now = new Date();
    }

    // Compute time difference in milliseconds
    let timeDiff = now.getTime() - time.getTime();

    // Convert from milliseconds to seconds
    let seconds = timeDiff / 1000;

    // Convert from seconds to minutes
    let minutes = Math.floor(seconds / 60);

    // Convert from minutes to hours
    let hours = Math.floor(minutes / 60);

    // Convert from hours to days
    let days = Math.floor(hours / 24);

    // Convert from days to months
    let months = Math.floor(days / 30);

    // Convert from months to years
    let years = Math.floor(days / 365);

    if (years > 0) {
        if (years > 2) {
            return 'a long time ago';
        } else if (years === 2) {
            return '2 years ago';
        } else if (years === 1) {
            return 'a year ago';
        }
    } else if (months > 0) {
        if (months > 1) {
            return `${months} months ago`;
        } else {
            return 'a month ago';
        }
    } else if (days > 0) {
        if (days === 1) {
            return 'a day ago';
        } else {
            return `${days} days ago`;
        }
    } else if (hours > 0) {
        if (hours === 1) {
            return 'an hour ago';
        } else {
            return `${hours} hours ago`;
        }
    } else if (minutes > 0) {
        if (minutes === 1) {
            return 'a minute ago';
        } else {
            return `${minutes} minutes ago`;
        }
    } else if (seconds > 0) {
        return 'just now';
    }
}

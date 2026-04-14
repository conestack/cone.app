import ts from 'treibstoff';

/**
 * Creates a cookie with the specified name, value, and expiration days.
 * This function is deprecated; use `ts.create_cookie` instead.
 * 
 * @param {string} name
 * @param {string} value
 * @param {number} days
 */
export function createCookie(name, value, days) {
    ts.deprecate('createCookie', 'ts.create_cookie', '1.1');
    ts.create_cookie(name, value, days);
}

/**
 * Reads the value of the cookie with the specified name.
 * This function is deprecated; use `ts.read_cookie` instead.
 * 
 * @param {string} name
 * @returns {string|null}
 */
export function readCookie(name) {
    ts.deprecate('readCookie', 'ts.read_cookie', '1.1');
    return ts.read_cookie(name);
}

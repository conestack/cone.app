import ts from 'treibstoff';

export function createCookie(name, value, days) {
    ts.deprecate('createCookie', 'ts.create_cookie', '1.1');
    ts.create_cookie(name, value, days);
}

export function readCookie(name) {
    ts.deprecate('readCookie', 'ts.read_cookie', '1.1');
    return ts.read_cookie(name);
}

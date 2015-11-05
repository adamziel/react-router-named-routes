
var jsdom = require('jsdom');
global.document = jsdom.jsdom('<!doctype html><html><body></body></html>');
global.window = document.defaultView;
global.window.sessionStorage = require('sessionstorage');
global.navigator = {userAgent: 'node.js'};

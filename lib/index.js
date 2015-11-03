'use strict'; var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } 
return target; }; function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var routesMap = {};
var React = require('react');
var ReactRouter = require('react-router');
var OriginalLink = ReactRouter.Link;

function isEmptyObject(object) {
    for (var p in object) {
        if (object.hasOwnProperty(p)) return false;
    }
return true;
}
var ProperLink = function ProperLink() {
    OriginalLink.call(this);
};
ProperLink.prototype = Object.create(OriginalLink.prototype); ProperLink.prototype.render = function () {
    var _this = this;
    var _props = this.props;
    var to = _props.to;
    var query = _props.query;
    var hash = _props.hash;
    var state = _props.state;
    var activeClassName = _props.activeClassName;
    var activeStyle = _props.activeStyle;
    var onlyActiveOnIndex = _props.onlyActiveOnIndex;
    var props = _objectWithoutProperties(_props, ['to', 'query', 'hash', 'state', 'activeClassName', 'activeStyle', 'onlyActiveOnIndex']);
    to = this._resolveUrl(to);
    // Manually override onClick.
    props.onClick = function (e) {
        return _this.handleClick(e);
    };
    // Ignore if rendered outside the context of history, simplifies unit testing.
    var history = this.context.history;
    if (history) {
        props.href = history.createHref(to, query);
        if (hash) props.href += hash;
        if (activeClassName || activeStyle != null && !isEmptyObject(activeStyle)) {
            if (history.isActive(to, query, onlyActiveOnIndex)) {
                if (activeClassName) props.className += props.className === '' ? activeClassName : ' ' + activeClassName;
                if (activeStyle) props.style = _extends({}, props.style, activeStyle);
            }
        }
    }
    return React.createElement('a', props);
};
ProperLink.prototype._resolveUrl = function (to) {
    if (to && to in routesMap) {
        var routePath = routesMap[to];
        for (var name in this.props.params || {}) {
            routePath = routePath.replace(':' + name, escape(this.props.params[name]));
        }
        return routePath;
    }
    return to;
};
function extractPaths(route) {
    var prefix = arguments.length <= 1 || arguments[1] === undefined ? "" : arguments[1];
    if (!route.props) return;
    var newPrefix = (prefix + "/" + (route.props.path || "")).replace("//", "/");
    if (route.props.name && route.props.path) {
        routesMap[route.props.name] = newPrefix;
    }
    var children = route.props.children || {};
    for (var k in children) {
        extractPaths(children[k], newPrefix);
    }
};
module.exports = function FixNamedRoutesSupport(routesMap) {
    extractPaths(routesMap, "/");
    ReactRouter.Link = ProperLink;
};

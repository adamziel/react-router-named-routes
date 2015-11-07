'use strict';

(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports', 'react', 'react-router'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require('react'), require('react-router'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.react, global.reactRouter);
        global.index = mod.exports;
    }
})(this, function (exports, React, ReactRouter) {
    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

    function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

    var OriginalLink = ReactRouter.Link;

    function NamedURLResolverClass() {
        this.routesMap = {};
    }

    function toArray(val) {
        return Object.prototype.toString.call(val) !== '[object Array]' ? [val] : val;
    }

    var reRepeatingSlashes = /\/+/g;
    var reSplatParams = /\*{1,2}/g;
    var reResolvedOptionalParams = /\(([^:*?#]+?)\)/g;
    var reUnresolvedOptionalParams = /\([^:?#]*:[^?#]*?\)/g;
    var reTokens = /<(.*?)>/g;
    var reSlashTokens = /_!slash!_/g;

    NamedURLResolverClass.prototype.resolve = function (name, params) {
        if (name && name in this.routesMap) {
            var routePath = this.routesMap[name];

            if (!params) {
                return routePath;
            }

            var tokens = {};

            for (var paramName in params) {
                if (params.hasOwnProperty(paramName)) {
                    var paramValue = params[paramName];

                    if (paramName === "splat") {
                        paramValue = toArray(paramValue);
                        var i = 0;
                        routePath = routePath.replace(reSplatParams, function (match) {
                            var val = paramValue[i++];

                            if (val == null) {
                                return "";
                            } else {
                                var tokenName = 'splat' + i;
                                tokens[tokenName] = match === "*" ? encodeURIComponent(val) : encodeURIComponent(val.toString().replace(/\//g, "_!slash!_")).replace(reSlashTokens, "/");
                                return '<' + tokenName + '>';
                            }
                        });
                    } else {
                        var paramRegex = new RegExp('(\/|\\(|\\)|^):' + paramName + '(\/|\\)|\\(|$)');
                        routePath = routePath.replace(paramRegex, function (match, g1, g2) {
                            tokens[paramName] = encodeURIComponent(paramValue);
                            return g1 + '<' + paramName + '>' + g2;
                        });
                    }
                }
            }

            return routePath.replace(reResolvedOptionalParams, "$1").replace(reUnresolvedOptionalParams, "").replace(reTokens, function (match, token) {
                return tokens[token];
            }).replace(reRepeatingSlashes, "/");
        }

        return name;
    };

    NamedURLResolverClass.prototype.mergeRouteTree = function (routes) {
        var _this = this;

        var prefix = arguments.length <= 1 || arguments[1] === undefined ? "" : arguments[1];
        routes = toArray(routes);
        routes.forEach(function (route) {
            if (!route) return;
            var newPrefix = "";

            if (route.props) {
                var routePath = route.props.path || "";
                var newPrefix = (routePath != null && routePath[0] === "/" ? routePath : [prefix, routePath].filter(function (x) {
                    return x;
                }).join("/")).replace(reRepeatingSlashes, "/");

                if (route.props.name) {
                    _this.routesMap[route.props.name] = newPrefix;
                }

                React.Children.forEach(route.props.children, function (child) {
                    _this.mergeRouteTree(child, newPrefix);
                });
            }
        });
    };

    NamedURLResolverClass.prototype.reset = function () {
        this.routesMap = {};
    };

    var NamedURLResolver = new NamedURLResolverClass();
    var Link = React.createClass({
        render: function render() {
            var _props = this.props;
            var to = _props.to;
            var resolver = _props.resolver;

            var rest = _objectWithoutProperties(_props, ['to', 'resolver']);

            if (!resolver) resolver = NamedURLResolver;
            to = resolver.resolve(to, this.props.params);
            return React.createElement(OriginalLink, _extends({
                to: to
            }, rest));
        }
    });

    function MonkeyPatchNamedRoutesSupport(routes) {
        var basename = arguments.length <= 1 || arguments[1] === undefined ? "/" : arguments[1];
        NamedURLResolver.mergeRouteTree(routes, basename);
        ReactRouter.Link = Link;
    }

    ;

    function setNamedURLResolver(resolver) {
        exports.NamedURLResolver = NamedURLResolver = resolver;
    }

    ;
    exports.Link = Link;
    exports.NamedLink = Link;
    exports.NamedURLResolver = NamedURLResolver;
    exports.NamedURLResolverClass = NamedURLResolverClass;
    exports.MonkeyPatchNamedRoutesSupport = MonkeyPatchNamedRoutesSupport;
    exports.FixNamedRoutesSupport = MonkeyPatchNamedRoutesSupport;
    exports.setNamedURLResolver = setNamedURLResolver;
});

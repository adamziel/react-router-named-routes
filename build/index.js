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

    var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

    var OriginalLink = ReactRouter.Link;

    function NamedURLResolverClass() {
        this.routesMap = {};
        this.escapeSequences = [[/:/g, '_'], [/\//g, '_']];
    }

    NamedURLResolverClass.prototype.escape = function (string) {
        if (string === undefined) {
            return "";
        }

        this.escapeSequences.forEach(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2);

            var from = _ref2[0];
            var to = _ref2[1];
            string = string.replace(from, to);
        });
        return string;
    };

    NamedURLResolverClass.prototype.resolve = function (name, params) {
        if (name && name in this.routesMap) {
            if (!params) params = {};
            var routePath = this.routesMap[name];

            for (var paramName in params) {
                if (params.hasOwnProperty(paramName)) {
                    var paramRegex = new RegExp('(/|^):' + paramName + '(/|$)');
                    var paramValue = this.escape('' + params[paramName]);
                    routePath = routePath.replace(paramRegex, '$1' + paramValue + '$2');
                }
            }

            return routePath;
        }

        return name;
    };

    NamedURLResolverClass.prototype.mergeRouteTree = function (routes) {
        var _this = this;

        var prefix = arguments.length <= 1 || arguments[1] === undefined ? "" : arguments[1];

        if (Object.prototype.toString.call(routes) !== '[object Array]') {
            routes = [routes];
        }

        routes.forEach(function (route) {
            if (!route) return;
            var newPrefix = "";

            if (route.props) {
                var routePath = route.props.path || "";
                var newPrefix = [prefix, routePath].filter(function (x) {
                    return x;
                }).join("/").replace(/\/+/g, "/");

                if (route.props.name) {
                    _this.routesMap[route.props.name] = newPrefix;
                }
            }

            var children = route.props.children || {};

            for (var k in children) {
                _this.mergeRouteTree(children[k], newPrefix);
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

            var rest = _objectWithoutProperties(_props, ['to']);

            var resolver = this.props.resolver || NamedURLResolver;
            to = resolver.resolve(to, this.props.params);
            return React.createElement(OriginalLink, _extends({
                to: to
            }, rest));
        }
    });

    function MonkeyPatchNamedRoutesSupport(routes) {
        NamedURLResolver.mergeRouteTree(routes, "/");
        ReactRouter.Link = Link;
    }

    ;
    var FixNamedRoutesSupport = MonkeyPatchNamedRoutesSupport;
    exports.Link = Link;
    exports.NamedURLResolver = NamedURLResolver;
    exports.NamedURLResolverClass = NamedURLResolverClass;
    exports.FixNamedRoutesSupport = FixNamedRoutesSupport;
    exports. // backwards compat
    MonkeyPatchNamedRoutesSupport = MonkeyPatchNamedRoutesSupport;
});

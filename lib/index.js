
var React = require('react');
var ReactRouter = require('react-router');
var OriginalLink = ReactRouter.Link;
var createReactClass = require('create-react-class');

// Deliberately not using ES6 classes - babel spits out too much boilerplate
//                                      and I don't want to add a dependency on babel
//                                      runtime
function NamedURLResolverClass() {
    this.routesMap = {};
}

function toArray(val) {
    return Object.prototype.toString.call(val) !== '[object Array]' ? [ val ] : val;
}

// Cached regexps:

var reRepeatingSlashes = /\/+/g; // "/some//path"
var reSplatParams = /\*{1,2}/g;  // "/some/*/complex/**/path"
var reResolvedOptionalParams = /\(([^:*?#]+?)\)/g; // "/path/with/(resolved/params)"
var reUnresolvedOptionalParams = /\([^:?#]*:[^?#]*?\)/g; // "/path/with/(groups/containing/:unresolved/optional/:params)"
var reUnresolvedOptionalParamsRR4 = /(\/[^\/]*\?)/g; // "/path/with/groups/containing/unresolved?/optional/params?"
var reTokens = /<(.*?)>/g;
var reSlashTokens = /_!slash!_/g;

NamedURLResolverClass.prototype.resolve = function(name, params) {
    if(name && (name in this.routesMap)) {
        var routePath = this.routesMap[name];
        return formatRoute(routePath, params);
    }

    return name;
};

NamedURLResolverClass.prototype.mergeRouteTree = function(routes, prefix="") {
    routes = toArray(routes);

    routes.forEach((route) => {
        if(!route) return;

        var newPrefix = "";
        if(route.props) {
            var routePath = (route.props.path || "");
            var newPrefix = ((routePath != null && routePath[0] === "/")
                ? routePath
                : [prefix, routePath].filter(x=>x).join("/")
            ).replace(reRepeatingSlashes, "/");
            if (route.props.name) {
                this.routesMap[route.props.name] = newPrefix;
            }

            React.Children.forEach(route.props.children, (child) => {
                this.mergeRouteTree(child, newPrefix);
            });
        }
    });
};

NamedURLResolverClass.prototype.reset = function() {
    this.routesMap = {};
};

var NamedURLResolver = new NamedURLResolverClass();

var Link = createReactClass({

    render() {
        var {to, resolver, params, ...rest} = this.props;
        if(!resolver) resolver = NamedURLResolver;

        var finalTo = resolveTo(resolver, to, params);
        return <OriginalLink to={finalTo} {...rest} />;
    }

});

function resolveTo(resolver, to, params) {
    if(typeof to === "string") {
        return resolver.resolve(
            to,
            params
        );
    }

    if(typeof to === "function") {
        return function(location) {
            return resolveTo(resolver, to(location), params);
        };
    }

    if(!to.name) {
        return to;
    }

    if(to.pathname) {
        throw new Error('Cannot specify both "pathname" and "name" options in location descriptor.');
    }

    var {name, ...rest} = to;
    return {
        ...rest,
        pathname: resolver.resolve(
            name,
            params
        )
    };
}


function MonkeyPatchNamedRoutesSupport(routes, basename="/") {
    NamedURLResolver.mergeRouteTree(routes, basename);
    ReactRouter.Link = Link;
};

function setNamedURLResolver(resolver) {
    NamedURLResolver = resolver;
};

function formatRoute(routePath, params) {
    if (params) {
        var tokens = {};

        for (var paramName in params) {
            if (params.hasOwnProperty(paramName)) {
                var paramValue = params[paramName];

                if (paramName === "splat") { // special param name in RR, used for "*" and "**" placeholders
                    paramValue = toArray(paramValue); // when there are multiple globs, RR defines "splat" param as array.
                    var i = 0;
                    routePath = routePath.replace(reSplatParams, (match) => {
                        var val = paramValue[i++];
                        if (val == null) {
                            return "";
                        } else {
                            var tokenName = `splat${i}`;
                            tokens[tokenName] = match === "*"
                              ? encodeURIComponent(val)
                                // don't escape slashes for double star, as "**" considered greedy by RR spec
                              : encodeURIComponent(val.toString().replace(/\//g, "_!slash!_")).replace(reSlashTokens, "/");
                            return `<${tokenName}>`;
                        }
                    });
                } else {
                    // Rougly resolve all named placeholders.
                    // Cases:
                    // - "/path/:param"
                    // - "/path/(:param)"
                    // - "/path(/:param)"
                    // - "/path(/:param/):another_param"
                    // - "/path/:param(/:another_param)"
                    // - "/path(/:param/:another_param)"
                    var paramRegex = new RegExp('(\/|\\(|\\)|^):' + paramName + '(\/|\\)|\\(|$)');
                    routePath = routePath.replace(paramRegex, (match, g1, g2) => {
                        tokens[paramName] = encodeURIComponent(paramValue);
                        return `${g1}<${paramName}>${g2}`;
                    });
                    var paramRegexRR4 = new RegExp('(.*):' + paramName + '\\?(.*)');
                    routePath = routePath.replace(paramRegexRR4, (match, g1, g2) => {
                         tokens[paramName] = encodeURIComponent(paramValue);
                         return `${g1}<${paramName}>${g2}`;
                     });
                }
            }
        }
    }

    return routePath
        // Remove braces around resolved optional params (i.e. "/path/(value)")
      .replace(reResolvedOptionalParams, "$1")
        // Remove all sequences containing at least one unresolved optional param
      .replace(reUnresolvedOptionalParams, "")
        // Remove all sequences containing at least one unresolved optional param in RR4
      .replace(reUnresolvedOptionalParamsRR4, "")
        // After everything related to RR syntax is removed, insert actual values
      .replace(reTokens, (match, token) => tokens[token])
        // Remove repeating slashes
      .replace(reRepeatingSlashes, "/")
        // Always remove ending slash for consistency
      .replace(/\/+$/, "")
        // If there was a single slash only, keep it
      .replace(/^$/, "/");
}

const resolve = NamedURLResolver.resolve.bind(NamedURLResolver);

export {
    Link,
    Link as NamedLink,
    NamedURLResolver,
    NamedURLResolverClass,
    MonkeyPatchNamedRoutesSupport,
    MonkeyPatchNamedRoutesSupport as FixNamedRoutesSupport,

    setNamedURLResolver,

    resolve,
    formatRoute
};

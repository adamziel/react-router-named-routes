
var React = require('react');
var ReactRouter = require('react-router');
var OriginalLink = ReactRouter.Link;

// Deliberately not using ES6 classes - babel spits out too much boilerplate
//                                      and I don't want to add a dependency on babel
//                                      runtime
function NamedURLResolverClass() {
    this.routesMap = {};
    this.escapeSequences = [
        [/:/g,  '_'],
        [/\//g, '_']
    ];
}

function toArray(val) {
    return Object.prototype.toString.call(val) !== '[object Array]' ? [ val ] : val;
}

// Cached regexps:

var reRepeatingSlashes = /\/+/g; // "/some//path"
var reSplatParams = /\*{1,2}/g;  // "/some/*/complex/**/path"
var reResolvedOptionalParams = /\(([^:*?#]+?)\)/g; // "/path/with/(resolved/params)"
var reUnresolvedOptionalParams = /\([^:?#]*:[^?#]*?\)/g; // "/path/with/(groups/containing/:unresolved/optional/:params)"


NamedURLResolverClass.prototype.escape = function(string, escapeSlashes = true) {
    if(string === undefined) {
        return "";
    }

    this.escapeSequences.forEach(function(fromto, idx) {
        // need ability to omit escaping slashes, when reversing splat params
        if (!(idx === 1 && !escapeSlashes)) {
            string = string.replace(fromto[0], fromto[1]);    
        }
    });

    return string;
};

NamedURLResolverClass.prototype.resolve = function(name, params) {
    if(name && (name in this.routesMap)) {
        var routePath = this.routesMap[name];

        if(!params) {
            return routePath;
        }

        for (var paramName in params) {
            if (params.hasOwnProperty(paramName)) {
                var paramValue = params[paramName];
        
                if (paramName === "splat") { // special param name in RR, used for "*" and "**" placeholders
                    paramValue = toArray(paramValue); // when there are multiple globs, RR defines "splat" param as array.
                    var i = 0;
                    routePath = routePath.replace(reSplatParams, (match) => {
                        var val = paramValue[i++];
                        // don't escape slashes for double star, as "**" considered greedy by RR spec
                        return val == null ? "" : this.escape('' + val, match === "*");
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
                    var replacement = '$1' + this.escape('' + paramValue) + '$2';
                    routePath = routePath.replace(paramRegex, replacement);
                }
            }
        }
        return routePath
            // Remove braces around resolved optional params (i.e. "/path/(value)")
            .replace(reResolvedOptionalParams, "$1")
            // Remove all sequences containing at least one unresolved optional param
            .replace(reUnresolvedOptionalParams, "")
            // Finally remove repeating slashes
            .replace(reRepeatingSlashes, "/");
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
            var newPrefix = [prefix, routePath].filter(x=>x).join("/").replace(reRepeatingSlashes, "/");
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

var Link = React.createClass({

    render() {
        var {to, ...rest} = this.props;
        var resolver = this.props.resolver || NamedURLResolver;
        to = resolver.resolve(
            to,
            this.props.params
        );

        return <OriginalLink to={to} {...rest} />;
    }

});


function MonkeyPatchNamedRoutesSupport(routes) {
    NamedURLResolver.mergeRouteTree(routes, "/");
    ReactRouter.Link = Link;
};

function setNamedURLResolver(resolver) {
    NamedURLResolver = resolver;
};

export {
    Link,
    Link as NamedLink,
    NamedURLResolver,
    NamedURLResolverClass,
    MonkeyPatchNamedRoutesSupport,
    MonkeyPatchNamedRoutesSupport as FixNamedRoutesSupport,

    setNamedURLResolver
};



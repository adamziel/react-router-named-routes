
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

NamedURLResolverClass.prototype.escape = function(string) {
    if(string === undefined) {
        return "";
    }

    this.escapeSequences.forEach(function(fromto) {
        string = string.replace(fromto[0], fromto[1]);
    });

    return string;
};

NamedURLResolverClass.prototype.resolve = function(name, params) {
    if(name && (name in this.routesMap)) {
        if(!params) params = {};

        var routePath = this.routesMap[name];
        for(var paramName in params) {
            if(params.hasOwnProperty(paramName)) {
                let paramRegex = new RegExp('(/|^):' + paramName + '(/|$)');
                let paramValue = this.escape('' + params[paramName]);
                routePath = routePath.replace(paramRegex, '$1' + paramValue + '$2');
            }
        }
        return routePath;
    }

    return name;
};

NamedURLResolverClass.prototype.mergeRouteTree = function(routes, prefix="") {
    if(Object.prototype.toString.call(routes) !== '[object Array]') {
        routes = [routes];
    }

    routes.forEach((route) => {
        if(!route) return;

        var newPrefix = "";
        if(route.props) {
            var routePath = (route.props.path || "");
            var newPrefix = [prefix, routePath].filter(x=>x).join("/").replace(/\/+/g, "/");
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




var React = require('react');
var ReactRouter = require('react-router');
var OriginalLink = ReactRouter.Link;


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

    this.escapeSequences.forEach(function([from, to]) {
        string = string.replace(from, to);
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
        }

        var children = route.props.children || {};
        for(var k in children) {
            this.mergeRouteTree(children[k], newPrefix);
        }
    });
};

var NamedURLResolver = new NamedURLResolverClass();

var Link = React.createClass({

    render() {
        var {to, ...rest} = this.props;
        to = NamedURLResolver.resolve(
            to,
            this.props.params
        );

        console.log('to is', to)

        return <OriginalLink to={to} {...rest} />;
    }

});


function MonkeyPatchNamedRoutesSupport(routes) {
    NamedURLResolver.mergeRouteTree(routes, "/");
    ReactRouter.Link = Link;
};

var FixNamedRoutesSupport = MonkeyPatchNamedRoutesSupport;

export {
    Link,
    NamedURLResolver,
    NamedURLResolverClass,
    FixNamedRoutesSupport, // backwards compat
    MonkeyPatchNamedRoutesSupport
};



var routesMap = {};

var ReactRouter = require('react-router');
var OriginalLink = ReactRouter.Link;

function isEmptyObject(object) {
    for (let p in object)
        if (object.hasOwnProperty(p))
            return false

    return true
}

var ProperLink = function() {
    OriginalLink.call(this);
};
ProperLink.prototype = Object.create(OriginalLink.prototype);

ProperLink.prototype.render = function() {
    var { to, query, hash, state, activeClassName, activeStyle, onlyActiveOnIndex, ...props } = this.props
    to = this._resolveUrl(to);

    // Manually override onClick.
    props.onClick = (e) => this.handleClick(e)

    // Ignore if rendered outside the context of history, simplifies unit testing.
    const { history } = this.context
    if (history) {
        props.href = history.createHref(to, query)

        if (hash)
            props.href += hash

        if (activeClassName || (activeStyle != null && !isEmptyObject(activeStyle))) {
            if (history.isActive(to, query, onlyActiveOnIndex)) {
                if (activeClassName)
                    props.className += props.className === '' ? activeClassName : ` ${activeClassName}`

                if (activeStyle)
                    props.style = { ...props.style, ...activeStyle }
            }
        }
    }

    return <a {...props} />;
};

ProperLink.prototype._resolveUrl = function(to) {
    if(to && (to in routesMap)) {
        var routePath = routesMap[to];
        for(var name in this.props.params||{}) {
            routePath = routePath.replace(':'+name, escape(this.props.params[name]));
        }

        return routePath;
    }

    return to;
};

function extractPaths(route, prefix="") {
    if(!route.props) return;

    var newPrefix = (prefix + "/" + (route.props.path || "")).replace("//", "/");
    if(route.props.name && route.props.path) {
        routesMap[route.props.name] = newPrefix;
    }

    var children = route.props.children || {};
    for(var k in children) {
        extractPaths(children[k], newPrefix);
    }
};

module.exports = function FixNamedRoutesSupport(routes) {
    extractPaths(routes, "/");
    ReactRouter.Link = ProperLink;
};

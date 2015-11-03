var routesMap = {};

var ReactRouter = require('react-router');
var OriginalLink = ReactRouter.Link;

var ProperLink = Object.create(OriginalLink.prototype);
ProperLink.prototype.componentWillMount = function() {
    this._resolveUrl(this.props);
};

ProperLink.prototype.componentWillUpdate = function(nextProps) {
    this._resolveUrl(nextProps);
};

ProperLink.prototype._resolveUrl = function(nextProps) {
    var to = nextProps.to || this._routeName;
    if(to && (to in routesMap)) {
        this._routeName = to;
        var routePath = routesMap[to];
        for(var name in this.props.params||{}) {
            routePath = routePath.replace(':'+name, escape(this.props.params[name]));
        }
        this.props = Object.assign({}, this.props, {
            to: routePath
        });
    }
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

module.exports = function FixNamedRoutesSupport(routesMap) {
    extractPaths(routesMap, "/");
    ReactRouter.Link = ProperLink;
};

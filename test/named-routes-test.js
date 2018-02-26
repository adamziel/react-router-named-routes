
var React = require('react');
var ReactDOM = require('react-dom');
var ReactTestUtils = require('react-addons-test-utils');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var IndexRoute = ReactRouter.IndexRoute;

var ReactRouterNamedRoutes = require("../build/index");
var NamedURLResolverClass = ReactRouterNamedRoutes.NamedURLResolverClass;
var NamedURLResolver = ReactRouterNamedRoutes.NamedURLResolver;
var Link = ReactRouterNamedRoutes.Link;
var formatRoute = ReactRouterNamedRoutes.formatRoute;
var createBrowserHistory = require('history/lib/createBrowserHistory').default;

var expect = require('chai').expect;

var compareVersions = require('compare-versions');
var ReactRouterVersion = require('react-router/package.json').version;
var preV4 = compareVersions(ReactRouterVersion, '4.0.0') === -1;

if(preV4) {
    var Component = React.createClass({
        render: function () {
        }
    });

    var createComplexRouteTree = function () {
        return (
            React.createElement(Route, {component: Component, name: 'root', path: '/'}, [
                React.createElement(Route, {component: Component, path: '/app'}, [
                    React.createElement(IndexRoute, {name: 'app.index'}),
                    React.createElement(Route, {name: 'app.list'})
                ]),

                React.createElement(Route, {name: 'users', path: '/users'}, [
                    React.createElement(IndexRoute, {name: 'users.index'}),
                    React.createElement(Route, {name: 'users.list', path: 'list'}),
                    React.createElement(Route, {name: 'users.show', path: ':id'}),
                    React.createElement(Route, {path: ':id/edit'})
                ])
            ])
        );
    };

    describe('NamedURLResolver', function () {

        var resolver;
        beforeEach(() => {
            resolver = new NamedURLResolverClass();
        });

        it('correctly maps route tree #1', function () {
            resolver = new NamedURLResolverClass();
            resolver.mergeRouteTree(
                React.createElement(Route, {}, [
                    React.createElement(Route, {name: 'users.show', path: '/users/:id'}),
                    React.createElement(Route, {path: '/user/:id-parent/:id', name: 'test1'}),
                    React.createElement(Route, {path: '/user/semi:colon/:colon', name: 'test2'})
                ])
            );

            expect(resolver.routesMap).to.deep.equal({
                'users.show': '/users/:id',
                'test1': '/user/:id-parent/:id',
                'test2': '/user/semi:colon/:colon'
            });
        });

        it('correctly maps route tree #2', function () {
            resolver = new NamedURLResolverClass();
            resolver.mergeRouteTree([
                React.createElement(Route, {name: 'users.show', path: '/users/:id'}),
                React.createElement(Route, {path: '/user/:id-parent/:id', name: 'test1'}),
                React.createElement(Route, {path: '/user/semi:colon/:colon', name: 'test2'})
            ]);

            expect(resolver.routesMap).to.deep.equal({
                'users.show': '/users/:id',
                'test1': '/user/:id-parent/:id',
                'test2': '/user/semi:colon/:colon'
            });
        });

        it('correctly maps route tree #3', function () {
            resolver = new NamedURLResolverClass();
            resolver.mergeRouteTree((
                React.createElement(Route, {component: Component, path: '/'}, [
                    React.createElement(Route, {component: Component}, [
                        React.createElement(IndexRoute, {component: Component}),
                        React.createElement(Route, {name: 'deeply-nested', component: Component})
                    ]),
                    React.createElement(Route, {path: '*', component: Component}),
                    React.createElement(Route)
                ])
            ));

            expect(resolver.routesMap).to.deep.equal({'deeply-nested': '/'});
        });

        it('correctly maps route tree #4', function () {
            resolver.mergeRouteTree(createComplexRouteTree());
            expect(resolver.routesMap).to.deep.equal({
                'root': '/',
                'app.index': '/app',
                'app.list': '/app',

                'users': '/users',
                'users.index': '/users',
                'users.list': '/users/list',
                'users.show': '/users/:id'
            });
        });

        it('correctly maps absolute paths for nested routes', function () {
            resolver = new NamedURLResolverClass();
            resolver.mergeRouteTree(
                React.createElement(Route, {path: "/users"}, [
                    React.createElement(Route, {name: 'users.show', path: '/:id'}),
                    React.createElement(Route, {name: 'users.list', path: '/list'})
                ])
            );

            expect(resolver.routesMap).to.deep.equal({
                'users.show': '/:id',
                'users.list': '/list'
            });

            expect(resolver.resolve("users.list")).to.equal("/list");
        });

        it('correctly resolve named routes', function () {
            resolver.mergeRouteTree(createComplexRouteTree());
            expect(resolver.resolve("root")).to.equal("/");
            expect(resolver.resolve("app.index")).to.equal("/app");
            expect(resolver.resolve("app.list")).to.equal("/app");

            expect(resolver.resolve("users")).to.equal("/users");
            expect(resolver.resolve("users.index")).to.equal("/users");
            expect(resolver.resolve("users.list")).to.equal("/users/list");
            expect(resolver.resolve("users.show")).to.equal("/users/:id");
        });

        it('correctly formats named routes', function () {
            resolver.mergeRouteTree([
                React.createElement(Route, {name: 'users.show', path: '/users/:id'}),
                React.createElement(Route, {path: '/users/:id-parent/:id', name: 'test1'}),
                React.createElement(Route, {path: '/users/semi:colon/:colon', name: 'test2'})
            ]);

            expect(resolver.resolve("users.show", {id: 4})).to.equal("/users/4");
            expect(resolver.resolve("test1", {id: 4, 'id-parent': 5})).to.equal("/users/5/4");
            expect(resolver.resolve("test2", {colon: 7})).to.equal("/users/semi:colon/7");

            expect(resolver.resolve("users.show", {id: 'id/:id'})).to.equal("/users/" + encodeURIComponent("id/:id"));
            expect(resolver.resolve("test1", {
                id: 'id/:id',
                'id-parent': 'idp:id'
            })).to.equal("/users/" + encodeURIComponent("idp:id") + "/" + encodeURIComponent("id/:id"));
            expect(resolver.resolve("test2", {colon: 'colon:colon'})).to.equal("/users/semi:colon/" + encodeURIComponent("colon:colon"));
        });

        it('correctly resolves optional params', function () {
            resolver.mergeRouteTree([
                React.createElement(Route, {name: 'test1', path: '/path(/:param)'}),
                React.createElement(Route, {name: 'test2', path: '/path/(:param)'}),

                React.createElement(Route, {name: 'test3', path: '/path/(:param1)/:param2'}),
                React.createElement(Route, {name: 'test4', path: '/path/(:param1/):param2'}),
                React.createElement(Route, {name: 'test5', path: '/path(/:param1/):param2'}),
                React.createElement(Route, {name: 'test6', path: '/path(/:param1)/:param2'}),

                React.createElement(Route, {name: 'test7', path: '/path/:param1/(:param2)'}),
                React.createElement(Route, {name: 'test8', path: '/path/:param1(/:param2)'}),

                React.createElement(Route, {name: 'test9', path: '/path(/:param1/:param2/)'}),
            ]);

            expect(resolver.resolve("test1", {param: 1})).to.equal("/path/1", "Substitute case 1");
            expect(resolver.resolve("test2", {param: 1})).to.equal("/path/1", "Substitute case 2");

            expect(resolver.resolve("test1")).to.equal("/path", "Simple omit case 1");
            expect(resolver.resolve("test2")).to.equal("/path", "Simple omit case 2");

            expect(resolver.resolve("test3", {param2: 2})).to.equal("/path/2", "Middle omit case 1");
            expect(resolver.resolve("test4", {param2: 2})).to.equal("/path/2", "Middle omit case 2");
            expect(resolver.resolve("test5", {param2: 2})).to.equal("/path2", "Middle omit case 3");
            expect(resolver.resolve("test6", {param2: 2})).to.equal("/path/2", "Middle omit case 4");

            expect(resolver.resolve("test7", {param1: 1})).to.equal("/path/1", "Trailing omit case 1");
            expect(resolver.resolve("test8", {param1: 1})).to.equal("/path/1", "Trailing omit case 2");

            expect(resolver.resolve("test8", {
                param1: "p(1)",
                param2: "p(2)"
            })).to.equal("/path/p(1)/p(2)", "Params with parentheses");

            // if any part of optional sequence is omitted, entire sequence is omitted
            expect(resolver.resolve("test9", {param1: 1})).to.equal("/path", "Omitted sequence");
            expect(resolver.resolve("test9", {param1: 1, param2: 2})).to.equal("/path/1/2", "Resolved sequence");
        });

        it('correctly resolves splat params', function () {
            resolver.mergeRouteTree([
                React.createElement(Route, {name: 'test1', path: '/some/*'}),
                React.createElement(Route, {name: 'test2', path: '/some/*/path'}),

                React.createElement(Route, {name: 'test3', path: '/some/**'}),
                React.createElement(Route, {name: 'test4', path: '/some/**/path'}),

                React.createElement(Route, {name: 'test5', path: '/some/*/path/**'})
            ]);

            expect(resolver.resolve("test1", {splat: 1})).to.equal("/some/1", "Trailing single star");
            expect(resolver.resolve("test2", {splat: 1})).to.equal("/some/1/path", "Middle single star");
            expect(resolver.resolve("test1", {splat: "slash/here"})).to.equal("/some/" + encodeURIComponent("slash/here"), "Slash with single star");

            expect(resolver.resolve("test3", {splat: 1})).to.equal("/some/1", "Trailing double star");
            expect(resolver.resolve("test4", {splat: 1})).to.equal("/some/1/path", "Middle double star");
            expect(resolver.resolve("test3", {splat: "slash/here"})).to.equal("/some/slash/here", "Slash with double star");

            expect(resolver.resolve("test5", {splat: "first/splat"})).to.equal("/some/" + encodeURIComponent("first/splat") + "/path", "Multiple globs 1");
            expect(resolver.resolve("test5", {splat: ["first/splat", "second/splat"]})).to.equal("/some/" + encodeURIComponent("first/splat") + "/path/second/splat", "Multiple globs 2");
        });
    });

    describe('Link', function() {

        afterEach(() => {
            NamedURLResolver.reset();
            // document.body.removeChild(document.body.children[0]);
        });

        function render(element, tag) {
            var DOMComponent = ReactTestUtils.renderIntoDocument(
                element
            );
            var RenderedComponent = ReactTestUtils.findRenderedDOMComponentWithTag(
                DOMComponent,
                tag
            );
            return RenderedComponent;
        };

        it('correctly renders <Link /> elements', function() {
            NamedURLResolver.mergeRouteTree(createComplexRouteTree());

            var TestComponent = React.createClass({
                render: function() {
                    return (
                        React.createElement('div', {}, [
                            React.createElement(Link, {to: 'root'}),
                            React.createElement(Link, {to: 'app.index'}),
                            React.createElement(Link, {to: 'app.list'}),
                            React.createElement(Link, {to: 'users'}),
                            React.createElement(Link, {to: 'users.index'}),
                            React.createElement(Link, {to: 'users.list'}),
                            React.createElement(Link, {to: 'users.show'}),
                            React.createElement(Link, {to: 'users.show', params: {id: 4}}),
                            React.createElement(Link, {to: 'users.show', params: {id: ':mal/ici/:ous'}}),

                            React.createElement(Link, {to: '/some-unnamed-path'}),
                            React.createElement(Link, {to: '/'}),
                            React.createElement(Link, {to: '/users'}),
                            React.createElement(Link, {to: '/users/5'})
                        ])
                    )
                }
            });

            var root = render(
                React.createElement(Router, {history: createBrowserHistory()}, [
                    React.createElement(Route, {path: '/', component: TestComponent})
                ]),
                'div'
            );
            expect(root).to.be.ok;

            expect(root.children.length).to.equal(13);
            var i = 0;
            expect(root.children[i++].getAttribute('href')).to.equal('/');
            expect(root.children[i++].getAttribute('href')).to.equal('/app');
            expect(root.children[i++].getAttribute('href')).to.equal('/app');
            expect(root.children[i++].getAttribute('href')).to.equal('/users');
            expect(root.children[i++].getAttribute('href')).to.equal('/users');
            expect(root.children[i++].getAttribute('href')).to.equal('/users/list');
            expect(root.children[i++].getAttribute('href')).to.equal('/users/:id');
            expect(root.children[i++].getAttribute('href')).to.equal('/users/4');
            expect(root.children[i++].getAttribute('href')).to.equal('/users/' + encodeURIComponent(':mal/ici/:ous'));

            expect(root.children[i++].getAttribute('href')).to.equal('/some-unnamed-path');
            expect(root.children[i++].getAttribute('href')).to.equal('/');
            expect(root.children[i++].getAttribute('href')).to.equal('/users');
            expect(root.children[i++].getAttribute('href')).to.equal('/users/5');
        });

        it('correctly renders <Link /> elements with custom resolver', function() {
            var resolver = new NamedURLResolverClass();
            resolver.mergeRouteTree([
                React.createElement(Route, {path: '/users/:id', name: 'users.show'}),
                React.createElement(Route, {path: '/user/:id-parent/:id', name: 'test1'}),
                React.createElement(Route, {path: '/user/semi:colon/:colon', name: 'test2'})
            ]);

            var TestComponent = React.createClass({
                render: function() {
                    return (
                        React.createElement('div', {}, [
                            React.createElement(Link, {to: 'users.show', resolver: resolver}),
                            React.createElement(Link, {to: 'test1', resolver: resolver}),
                            React.createElement(Link, {to: 'test2', resolver: resolver})
                        ])
                    )
                }
            });

            var root = render(
                React.createElement(Router, {history: createBrowserHistory()}, [
                    React.createElement(Route, {path: '/', component: TestComponent})
                ]),
                'div'
            );
            expect(root).to.be.ok;

            expect(root.children.length).to.equal(3);
            var i = 0;
            expect(root.children[i++].getAttribute('href')).to.equal('/users/:id');
            expect(root.children[i++].getAttribute('href')).to.equal('/user/:id-parent/:id');
            expect(root.children[i++].getAttribute('href')).to.equal('/user/semi:colon/:colon');
        });

        it('correctly renders <Link /> elements with object descriptor', function() {
            NamedURLResolver.mergeRouteTree(createComplexRouteTree());

            var TestComponent = React.createClass({
                render: function() {
                    return (
                        React.createElement('div', {}, [
                            React.createElement(Link, {to: {pathname: '/test'}}),
                            React.createElement(Link, {to: {pathname: '/test', search: '?param=1'}}),
                            React.createElement(Link, {to: {name: 'users.show'}}),
                            React.createElement(Link, {to: {name: 'users.show'}, params: {id: 15}}),
                            React.createElement(Link, {to: {name: 'users.show', search: '?param=1'}, params: {id: 15}}),
                            React.createElement(Link, {to: function(location) {return Object.assign({}, location, {search: '?param=1'})}, params: {id: 15}}),
                            React.createElement(Link, {to: function(location) {delete location.pathname; return Object.assign({}, location, {name: 'users.show', search: '?param=1'})}, params: {id: 15}}),
                        ])
                    )
                }
            });

            var root = render(
                React.createElement(Router, {history: createBrowserHistory()}, [
                    React.createElement(Route, {path: '/', component: TestComponent})
                ]),
                'div'
            );
            expect(root).to.be.ok;

            expect(root.children.length).to.equal(7);
            var i = 0;
            expect(root.children[i++].getAttribute('href')).to.equal('/test');
            expect(root.children[i++].getAttribute('href')).to.equal('/test?param=1');
            expect(root.children[i++].getAttribute('href')).to.equal('/users/:id');
            expect(root.children[i++].getAttribute('href')).to.equal('/users/15');
            expect(root.children[i++].getAttribute('href')).to.equal('/users/15?param=1');
            expect(root.children[i++].getAttribute('href')).to.equal('/?param=1');
            expect(root.children[i++].getAttribute('href')).to.equal('/users/15?param=1');
        });

    });
}



describe('formatRoute', function() {

    it('correctly resolve simple routes', function () {
        expect(formatRoute("/")).to.equal("/");
        expect(formatRoute("/app")).to.equal("/app");
        expect(formatRoute("/users/:id")).to.equal("/users/:id");
    });

    it('correctly formats simple routes', function () {
        expect(formatRoute("/users/:id")).to.equal("/users/:id");
        expect(formatRoute("/users/:id-parent/:id", {id: 4, 'id-parent': 5})).to.equal("/users/5/4");
        expect(formatRoute("/users/:id", {id: 'id/:id'})).to.equal("/users/" + encodeURIComponent("id/:id"));
        expect(formatRoute("/users/:id-parent/:id", {
            id: 'id/:id',
            'id-parent': 'idp:id'
        })).to.equal("/users/" + encodeURIComponent("idp:id") + "/" + encodeURIComponent("id/:id"));
        expect(formatRoute("/users/semi:colon/:colon", {colon: 'colon:colon'})).to.equal("/users/semi:colon/" + encodeURIComponent("colon:colon"));
    });

    it('correctly resolves optional params', function () {
        expect(formatRoute("/path(/:param)", {param: 1})).to.equal("/path/1", "Substitute case 1");
        expect(formatRoute("/path/(:param)", {param: 1})).to.equal("/path/1", "Substitute case 2");
        expect(formatRoute("/path/(:param)")).to.equal("/path", "Substitute case 3");
    });

    it('correctly resolves optional params', function () {
        expect(formatRoute("/path(/:param)", {param: 1})).to.equal("/path/1", "Substitute case 1");
        expect(formatRoute("/path/(:param)", {param: 1})).to.equal("/path/1", "Substitute case 2");

        expect(formatRoute("/path(/:param)")).to.equal("/path", "Simple omit case 1");
        expect(formatRoute("/path/(:param)")).to.equal("/path", "Simple omit case 2");

        expect(formatRoute("/path/(:param1)/:param2", {param2: 2})).to.equal("/path/2", "Middle omit case 1");
        expect(formatRoute("/path/(:param1/):param2", {param2: 2})).to.equal("/path/2", "Middle omit case 2");
        expect(formatRoute("/path(/:param1/):param2", {param2: 2})).to.equal("/path2", "Middle omit case 3");
        expect(formatRoute("/path(/:param1)/:param2", {param2: 2})).to.equal("/path/2", "Middle omit case 4");

        expect(formatRoute("/path/:param1/(:param2)", {param1: 1})).to.equal("/path/1", "Trailing omit case 1");
        expect(formatRoute("/path/:param1(/:param2)", {param1: 1})).to.equal("/path/1", "Trailing omit case 2");

        expect(formatRoute("/path/:param1(/:param2)", {
            param1: "p(1)",
            param2: "p(2)"
        })).to.equal("/path/p(1)/p(2)", "Params with parentheses");

        // if any part of optional sequence is omitted, entire sequence is omitted
        expect(formatRoute("/path(/:param1/:param2/)", {param1: 1})).to.equal("/path", "Omitted sequence");
        expect(formatRoute("/path(/:param1/:param2/)", {param1: 1, param2: 2})).to.equal("/path/1/2", "Resolved sequence");
    });

    it('correctly resolves React Router 4 optional params', function() {
        expect(formatRoute("/path/:param?", {param: 1})).to.equal("/path/1", "Substitute case");
        expect(formatRoute("/path/:param?")).to.equal("/path", "Simple omit case");
        expect(formatRoute("/path/:param1?/:param2?", {param2: 2})).to.equal("/path/2", "Middle omit case 1");
        expect(formatRoute("/path/:param1/:param2?", {param1: 1})).to.equal("/path/1", "Trailing omit case 1");
    });

    it('correctly resolves splat params', function () {
        expect(formatRoute("/some/*", {splat: 1})).to.equal("/some/1", "Trailing single star");
        expect(formatRoute("/some/*/path", {splat: 1})).to.equal("/some/1/path", "Middle single star");
        expect(formatRoute("/some/*", {splat: "slash/here"})).to.equal("/some/" + encodeURIComponent("slash/here"), "Slash with single star");

        expect(formatRoute("/some/**", {splat: 1})).to.equal("/some/1", "Trailing double star");
        expect(formatRoute("/some/**/path", {splat: 1})).to.equal("/some/1/path", "Middle double star");
        expect(formatRoute("/some/**", {splat: "slash/here"})).to.equal("/some/slash/here", "Slash with double star");

        expect(formatRoute("/some/*/path/**", {splat: "first/splat"})).to.equal("/some/" + encodeURIComponent("first/splat") + "/path", "Multiple globs 1");
        expect(formatRoute("/some/*/path/**", {splat: ["first/splat", "second/splat"]})).to.equal("/some/" + encodeURIComponent("first/splat") + "/path/second/splat", "Multiple globs 2");
    });
});

# react-router-named-routes

If you tried upgrading to React-Router 1.0.0, you probably realized that
they deliberately removed support for named routes without any deprecations or
grace period:

https://github.com/rackt/react-router/issues/1840#issue-105240108

This is not a cool move:

* This is a breaking change, and not a small one
* A lot of existing software is effectively stuck on old version of react
  since the upgrade requires too much effort
* It is perfectly valid function to have, and why remove it when any decent
  web framework offers some kind of url_by_name() or reverse() function
* It just makes certain things easier.

I need to upgrade my application to react 0.14, and I believe it should
not require hours of refactoring. Also I believe having such functionality
is an absolute must for a router. So I created this package to fix .

## Usage

1) Define all your routes in a single module. You probably do it like this anyway.
2) Monkey-patch react router:

```js
var routes = require("myproject/routes");
var FixNamedRoutesSupport = require("react-router-named-routes");
FixNamedRoutesSupport(routes);
```

That's it, you may now use react-router like this:
```js
<Route name="todo.edit" path="todo/:id/edit" component={TodosList} />

<Link to="todo.edit" params={{id: 123}}>Edit</Link>
```

## License

New BSD and MIT. Check the LICENSE file for all the details.

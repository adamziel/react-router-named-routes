# react-router-named-routes

If you tried upgrading to React-Router 1.0.0, you probably realized that
they deliberately removed support for named routes without any deprecations or
grace period:

https://github.com/rackt/react-router/issues/1840#issue-105240108

This affects a lot of people:

* This is a breaking change, and not a small one
* A lot of existing software is effectively stuck on old version of react
  since the upgrade requires too much effort
* It is perfectly valid function to have, any decent web framework offers
  some kind of url_by_name() or reverse() function
* It just makes certain things easier.

I needed to "just upgrade" my application to react 0.14, without spending
hours on refactoring. Also I **wanted** to use named routes. So I created
this package.

## Installation

`npm install react-router-named-routes`

## Usage

1. Define all your routes in a single module. You probably do it like this anyway.  
1. Use this package before you `render()` anything:

```js
var routes = require("myproject/routes");
var FixNamedRoutesSupport = require("react-router-named-routes");
FixNamedRoutesSupport(routes);
```

That's it, you may now use react-router just like in react-router 0.13:
```js
<Route name="todo.edit" path="todo/:id/edit" component={TodosList} />

<Link to="todo.edit" params={{id: 123}}>Edit</Link>
```

## License

New BSD and MIT.

# react-router-named-routes

[![Build Status](https://travis-ci.org/adamziel/react-router-named-routes.svg?branch=master)](https://travis-ci.org/adamziel/react-router-named-routes)

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
var {FixNamedRoutesSupport} = require("react-router-named-routes");
FixNamedRoutesSupport(routes);
```

That's it, you may now use react-router just like in react-router 0.13:
```js
<Route name="todo.edit" path="todo/:id/edit" component={TodoEditForm} />

<Link to="todo.edit" params={{id: 123}}>Edit</Link>
```

## You don't like monkey-patching?

You may just use `<Link />` component provided by this package instead
of the one provided by `react-router`. This requires some refactoring but
not that much:

1. Define all your routes in a single module. You probably do it like this anyway.
1. Use this package before you `render()` anything:

```js
var routes = require("myproject/routes");
var {Link, NamedURLResolver} = require("react-router-named-routes");
NamedURLResolver.mergeRouteTree(routes, "/");

<Route name="todo.edit" path="todo/:id/edit" component={TodoEditForm} />
<Link to="todo.edit" params={{id: 123}}>Edit</Link>
```

## Caveats

This probably breaks the shiny new `async routes` feature introduced in ReactRouter `1.0.0`.
If you come straight from 0.13 you don't use it anyway.

## Contributing

A pull request or an issue report is always welcome. If this package saved you some
time, starring this repo is a nice way to say "thank you".

## Advanced stuff and implementation details

Named Routes are resolved by a simple class (60 lines of code) called `NamedURLResolverClass`.

If you want some custom logic involved in resolving your named routes, or routes in general,
you may extend the class `NamedURLResolverClass` from this package and replace the global resolver
like this:

```
var {NamedURLResolverClass, setNamedURLResolver} = require("react-router-named-routes");
class CustomURLResolver extends NamedURLResolverClass {
  resolve(name, params) {
    // ...do some fancy stuff
  }
}
setNamedURLResolver(new CustomURLResolver());
```

Also, a `<Link />` component will accept a `resolver` property if you don't want to use
a default one for any reason:

`<Link resolver={new CustomURLResolver()} />`

## License

New BSD and MIT.

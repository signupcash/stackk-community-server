# stackk-community-server
The community server for stackk

## Instalation

Main packages, which this project depends from:

* [koa2 HTTP framework](https://github.com/koajs) for all HTTP related operations
* [mongoose](https://mongoosejs.com/) for working with MongoDB database

```sh
yarn install
```

## Testing

Testing is implemented via [mocha](https://mochajs.org/) testing framework.
[chai](https://www.chaijs.com/) BDD / TDD assertion library is used in the tests.

```sh
yarn test
```

## Using

Default server settings:

* development env
* listening on port 5000

Server can be started in other environment via _KOE_ENV_ environment variable:

```sh
KOA_ENV=production yarn start
```

Port and moderator address can be set via _PORT_ and _MODERATOR_ environment
variables.

Other server settings (database etc.) can be changed for every environment in _config/env/_ directory.

```sh
yarn start
```

## TODO

* checking requests signatures agains bitcoincash blockchain
* documentation via asciidoc

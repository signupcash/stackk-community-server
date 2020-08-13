# stackk-community-server
The community server for stackk

## Instalation

Main packages, which this project depends from:

* [koa2 HTTP framework](https://github.com/koajs) for all HTTP related operations
* [mongoose](https://mongoosejs.com/) for working with MongoDB database
* [bch-js](https://github.com/christroutner/bch-js) for BCH signatures sign and verify

```sh
yarn install
```

## Testing

Testing is implemented via [mocha](https://mochajs.org/) testing framework.
[chai](https://www.chaijs.com/) BDD / TDD assertion library is used in the tests.

In order to test signing requests, a wallet with some addresses in it need to be created. The default is 10 addresses:

```sh
yarn test:wallet
```

This command will also create _.env.test_ file with the first address in the wallet as a moderator address for the tests.

To run all the tests:

```sh
yarn test
```

## Using

Default server settings:

* development env
* listening on port 5000

Server can be started in other environment via _`KOA_ENV`_ environment variable:

```sh
KOA_ENV=production yarn start
```

Port and moderator address can be set via _`STAKK_PORT`_ and _`STAKK_MODERATOR`_ environment variables.


Other server settings (database etc.) can be changed for every environment in _config/env/_ directory.

```sh
yarn start
```

## TODO

* checking *user* requests signatures (moderator requests checks are done)
* documentation via asciidoc

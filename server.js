require.paths.unshift(__dirname + "/vendor");

process.addListener('uncaughtException', function (err, stack) {
  console.log('------------------------');
  console.log('Exception: ' + err);
  console.log(err.stack);
  console.log('------------------------');
});

var NodeMap = require('./lib/nodemap');

new NodeMap({ port: 8600
            , amqp: { host: '127.0.0.1'
                    , port: 5672
                    , vhost: '/'
                    , login: 'guest'
                    , password: 'guest'
                    , ssl: false
                    , exchange: 'datastream_updates'
                    }
            });

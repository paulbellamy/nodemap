var http = require('http')
  , io   = require('socket.io')
  , amqp = require('amqp')
  , sys  = require('sys')

function NodeMap(options) {
  // Singleton
  if (! (this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }

  var self = this;

  self.settings = { port: options.port
                  , amqp: { host: options.amqp.host
                          , port: options.amqp.port || 5672
                          , vhost: options.amqp.vhost
                          , login: options.amqp.login
                          , password: options.amqp.password
                          , ssl: options.amqp.ssl || false
                          , exchange: options.amqp.exchange
                          }
                  };

  self.init();
};

NodeMap.prototype.init = function() {
  var self = this;

  self.amqpConnection = self.createAMQPConnection();
  sys.log('Connected to AMQP at: ' + self.settings.amqp.host + ':' + self.settings.amqp.port);

  /*
  self.httpServer = self.createHTTPServer();
  self.httpServer.listen(self.settings.port);
  sys.log('Server started on PORT ' + self.settings.port);
  */
};

NodeMap.prototype.createAMQPConnection = function() {
  var self = this;

  var connection = amqp.createConnection(self.settings.amqp);

  connection.addListener('ready', function() {
    var q = connection.queue('nodemap');

    q.bind(self.settings.amqp.exchange, 'feeds.*'); // Receive all feed messages

    q.subscribe(function (message) {
      // Print messages stdout
      sys.p(message.data.toString());
    });
  });
};

NodeMap.prototype.createHTTPServer = function() {
  var self = this;
};

module.exports = NodeMap;

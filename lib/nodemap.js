var http = require('http')
  , amqp = require('amqp')
  , sys  = require('sys')

function NodeMap(options) {
  // Always Initialize
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

  self.backlog = [];
  self.backlogMaxLength = 20;

  self.init();
};

NodeMap.prototype.init = function() {
  var self = this;

  self.httpServer = self.createHTTPServer();
  sys.log('Server started on PORT ' + self.settings.port);

  self.socketServer = self.createSocketServer();
  sys.log('Accepting Sockets on PORT ' + self.settings.port);

  self.amqpConnection = self.createAMQPConnection();
  sys.log('Connected to AMQP at: ' + self.settings.amqp.host + ':' + self.settings.amqp.port);
};

NodeMap.prototype.createAMQPConnection = function() {
  var self = this;

  var connection = amqp.createConnection(self.settings.amqp);

  connection.addListener('ready', function() {
    var q = connection.queue('nodemap');

    q.bind(self.settings.amqp.exchange, 'feeds.*'); // Receive all feed messages

    q.subscribe(function (message) {
      // Print messages stdout
      var str = message.data.toString();
      var parsed = JSON.parse(str);
      if (parsed.location != undefined) {
        if (parsed.location.lat != undefined && parsed.location.lon != undefined) {
          var message = { latitude: parsed.location.lat
                        , longitude: parsed.location.lon
                        , title: parsed.feed
                        , subtitle: parsed.datastreams[0].value
                        , isNew: true
                        };

          // Send the message to all clients
          io.of('/map').json.send(message);

          // Log the message
          sys.puts(JSON.stringify(message));

          // Save it for any other connecting clients
          message.isNew = false;
          self.backlog.push(message)
          if (self.backlog.length > self.backlogMaxLength) {
            self.backlog.shift();
          }
        }
      }
    });
  });

  return connection;
};

NodeMap.prototype.createHTTPServer = function() {
  var self = this;

  var server = http.createServer(function(req, res){ 
   // your normal server code 
   res.writeHead(200, {'Content-Type': 'text/html'}); 
   res.end('<h1>Hello world</h1>'); 
  });
  server.listen(self.settings.port);

  return server;
};

NodeMap.prototype.createSocketServer = function() {
  var self = this;

  // socket.io 
  io = require('socket.io').listen(self.httpServer);
  io.of('/map').on('connection', function(client){
    // new client is here!
    // Send them the backlog to pre-populate the map
    for (var i=0; i < self.backlog.length; i++) {
      client.json.send(self.backlog[i]);
    }
    /*
    client.on('message', function(){  }) 
    client.on('disconnect', function(){  }) 
    */
  });

  return io;
};

module.exports = NodeMap;

function NodeMapClient() {
  if (! (this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }

  var self = this;

  this.init = function() {
    self.drawMap();
    self.viewDidResize();
    self.setupSocketIO();
  };
  
  this.setupSocketIO = function() {
    self.socket = new io.Socket('nodemap.appdev.loc');
    self.socket.connect();
    self.socket.on('message', function(message) {
      //console.log("MESSAGE", message); // Logging for debugging
      self.drawMarker(message);
    });
  };

  this.viewDidResize = function () {
    var width = $('body').width(),
        windowHeight = $(window).height(),
        mapCanvasHeight = width * (369.0 / 567.0);
        
    self.map.setSize(width, mapCanvasHeight);
    $('#map').css({
      'margin-top': (windowHeight - mapCanvasHeight) / 2.0
    });
  }

  this.drawMap = function () {
    self.map = Raphael('map', 0, 0);
    self.map.canvas.setAttribute('viewBox', '0 0 567 369');

    self.map.path(mapPath).attr({
      stroke: 'black',
      fill: '#222'
    }).attr({
      'stroke-width': 0.7
    });
  }

  this.geoCoordsToMapCoords = function (latitude, longitude) {
    latitude = parseFloat(latitude);
    longitude = parseFloat(longitude);

    var mapWidth = 567,
      mapHeight = 369,
      x, y, mapOffsetX, mapOffsetY;

    x = (mapWidth * (180 + longitude) / 360) % mapWidth;

    latitude = latitude * Math.PI / 180;
    y = Math.log(Math.tan((latitude / 2) + (Math.PI / 4)));
    y = (mapHeight / 2) - (mapWidth * y / (2 * Math.PI));

    mapOffsetX = mapWidth * 0.026;
    mapOffsetY = mapHeight * 0.141;

    return {
      x: (x - mapOffsetX) * 0.97,
      y: (y + mapOffsetY + 15),
      xRaw: x,
      yRaw: y
    };
  }

  this.drawMarker = function (message) {
    var latitude = message.latitude,
        longitude = message.longitude,
        title = message.title || '',
        subtitle = message.subtitle || '',
        x, y;

    var mapCoords = this.geoCoordsToMapCoords(latitude, longitude);
    x = mapCoords.x;
    y = mapCoords.y;

    var indicator = self.map.circle(x, y, 6);

    indicator.attr({
      fill: 'r#fff-#fff',
      opacity: 0,
      stroke: 'transparent'
    });

    var title = self.map.text(x, y + 11, title);
    title.attr({
      fill: 'white',
      "font-size": 10,
      "font-family": "'Helvetica Neue', 'Helvetica', sans-serif",
      'font-weight': 'bold'
    });
    var subtitle = self.map.text(x, y + 21, subtitle);
    subtitle.attr({
      fill: '#999',
      "font-size": 7,
      "font-family": "'Helvetica Neue', 'Helvetica', sans-serif"
    });

    var hoverFunc = function () {
      indicator.animate({scale: '1, 1'}, 200);
      $(title.node).fadeIn(200);
      $(subtitle.node).fadeIn(200);
    };
    var hideFunc = function () {
      indicator.animate({scale: '0.5, 0.5'}, 600);
      $(title.node).fadeOut(600);
      $(subtitle.node).fadeOut(600);
    };
    $(indicator.node).hover(hoverFunc, hideFunc);

    indicator.animate({scale: '0.5, 0.5'}, 2000, 'elastic', function () {
      $(title.node).fadeOut(2000);
      $(subtitle.node).fadeOut(2000);
      //indicator.animate({'fill-opacity': 0}, 10000);
    });
  }
  
  this.init();
};

var nodeMapClient;
jQuery(function() {
  nodeMapClient = new NodeMapClient();
  
  $(window).resize(function() {
    nodeMapClient.viewDidResize();
  });
});

'use strict';

var path = require('path');
var fs = require('fs');
var open = require('open');
var swaggerUiDistPath = path.dirname(require.resolve('swagger-ui-dist'));
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var watch = require('node-watch');
var swaggerParser = require('swagger-parser');

app.get('/', function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.use(express.static(swaggerUiDistPath));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

io.on('connection', function(client) {  
    console.log('Client connected.');
});


function start(swaggerFile, targetDir, port, hostname, bundleTo) {

  watch(targetDir, {recursive: true}, function(eventType, name) {
    swaggerParser.bundle(swaggerFile, function(err, bundled) {
      if (err) {
        console.error(err);
        return;
      }
      console.log("File changed. Sent updated spec to the browser.");
      var bundleString = JSON.stringify(bundled, null, 2);
      io.sockets.emit('updateSpec', bundleString);
      if (typeof bundleTo === 'string') {
        fs.writeFile(bundleTo, bundleString, function(err) {
          if (err) {
            console.error(err);
            return;
          }

          console.log('Saved bundle file at ' + bundleTo);
        });
      }
    });  
  });

  app.get('/spec', function(req, res) {
    swaggerParser.bundle(swaggerFile, function(err, bundled) {
      if (err) {
        res.send(JSON.stringify(err));
        return;
      }
      res.send(JSON.stringify(bundled));
    });      
  });

  server.listen(port,hostname, function() {
    open('http://' + hostname + ':' + port);
  });
}

module.exports = {
  start: start
}
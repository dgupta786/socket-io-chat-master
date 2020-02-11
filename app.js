var express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server);
users = {};

var port = process.env.PORT || 4000;

server.listen(port,(data)=>{
  console.log(`Chat Service is runnimg on ${port}`);
});

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index');
});

io.sockets.on('connection', function (socket) {
  socket.on('new user', function (data, callback) {
    if (data in users) {
      callback(false);
    } else {
      callback(true);
      socket.nickname = data;
      users[socket.nickname] = socket;
      updateNicknames();
    }
  });

  function updateNicknames() {
  }

  socket.on('send message', function (data, callback) {
    var msg = data.trim();

    if (msg.substr(0, 1) === '@') {
      msg = msg.substr(1);
      var ind = msg.indexOf(' ');
      if (ind !== -1) {
        var name = msg.substring(0, ind);
        var msg = msg.substring(ind + 1);
        if (name in users) {
          users[name].emit('whisper', { msg: msg, nick: socket.nickname });
          socket.emit('private', { msg: msg, nick: name });
        } else {
          callback("Sorry, " + name + " is not online");
        }
      } else {
        callback("Looks like you forgot to write the message");
      }
    }

    else {
      io.sockets.emit('new message', { msg: msg, nick: socket.nickname });
    }
  });


  socket.on('disconnect', function (data) {
    if (!socket.nickname) return;
    delete users[socket.nickname];
    updateNicknames();
  });


});

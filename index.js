var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.render(__dirname + '/views/index.ejs');
});

app.get('/chat', function(req, res){
  res.render(__dirname + '/views/chat.ejs', {
          username: req.query.username
        });
});

app.use(express.static(__dirname + '/public'));

http.listen(3000, function(){
  console.log('listening on *:3000');
});
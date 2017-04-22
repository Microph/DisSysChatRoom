var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var redis = require('redis').createClient();
var port = process.env.PORT || 8080;
server.listen(port);

var messages=[];
var onlineUser=[];
var user=[];
/*app.get('/', function(req, res){
  res.render(__dirname + '/index.ejs');
});*/

//require('./config')(app, io);
require('./routes')(app, io);
console.log("Server has started on port " + port);


var storeMessage = function(name, data) {
    var message = JSON.stringify({
        name: name,
        data: data
    });

    redisClient.lpush("messages", message, function(err, response) {
        redisClient.ltrim("messages", 0, 10);
        console.log(response);
    });
};

var chatRoom = io.on('connection',function(socket){
	console.log('Client connected');

	socket.on('login',function(username){
		console.log('login success');
		socket.username = username;
		redis.sadd("users",username);

		redis.smembers('users', function(err,users) {
            console.log("users: " + users);
        });

		redis.smembers('groups_'+username, function(err,groups) {
            console.log("groups: " + groups);

     		console.log(groups.length);
            
            /*groups.forEach(function(group) {
                socket.emit('add group', group);
            });*/
        });
	});

	socket.on('join',function(socket){
		/*socket.broadcast.emit('message',socket.username +  "has joined the chat room");

		redisClient.smembers('chatters', function(err, names) {
            console.log("names: " + names);

            names.forEach(function(name) {
                socket.emit('add user', name);
            });
        });*/

		
	});

	socket.on('createGroup',function(groupID){

		/*redis.sismember('groups',groupID,function(err,reply){
			if(reply == 0){	
                redis.sadd('groups',groupID);
                socket.emit('add group', groupID);
			}

			else{
				socket.emit('error',"Duplicate group ID");
			} //emit-> alert

		});*/
		
	});

	socket.on('disconnect',function(socket){
		//remove from online set
	});

	socket.on('message',function(data){

	});
});
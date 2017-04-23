var app = require('express')();

var redis = require('redis').createClient();

var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = process.env.PORT || 8080;

server.listen(port);

require('./routes')(app, io);



var chatRoom = io.on('connection',function(socket){
	console.log('Client connected...');

	socket.on('login',function(clientid){
		console.log('Client name : '+clientid);
		socket.clientid = clientid;
		redis.sadd("clients",clientid);

		//for debug
		redis.smembers("clients", function(err,clients) {
            console.log("clients: " + clients);
        });

		var groupList_clientid = "group_" + clientid;

        redis.smembers(groupList_clientid, function(err,groupList_clientid) {
            console.log("groupList_clientid: " + groupList_clientid);
            groupList_clientid.forEach(function(groupid) {
                socket.emit('add group', groupid);
        	});
        });
		/*redis.smembers('groups'+clientid, function(err,groups) {
            console.log("groups: " + groups);

            groups.forEach(function(group) {
                socket.emit('add group', group);
            });
        });*/
	});

	socket.on('createGroup',function(groupid){

		var clientid = socket.clientid;
		//assume groupid not exist
		redis.sadd("groupList",groupid);
		redis.sadd("client_"+groupid,clientid);
		redis.sadd("group_"+clientid,groupid);
		socket.emit('add group', groupid);

		/*redis.sismember('groups',groupid,function(err,reply){
			if(reply == 0){	
                redis.sadd('groups',groupid);
                socket.emit('add group', groupid);
			}

			else{
				socket.emit('error',"Duplicate group ID");
			} //emit-> alert

		});*/
		
	});

	socket.on('join',function(socket){
		/*socket.broadcast.emit('message',socket.clientid +  "has joined the chat room");

		redisClient.smembers('chatters', function(err, names) {
            console.log("names: " + names);

            names.forEach(function(name) {
                socket.emit('add client', name);
            });
        });*/

		
	});


	socket.on('disconnect',function(socket){
		//remove from online set
	});

	socket.on('message',function(data){

	});
});



console.log("Server has started on http://localhost:" + port);

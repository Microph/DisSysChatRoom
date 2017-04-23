var app = require('express')();

var redis = require('redis').createClient();

var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = process.env.PORT || 8080;

server.listen(port);

require('./routes')(app, io);

var storeMessage = function(name, data, group_id) {
    var message = JSON.stringify({
        name: name,
        data: data
    });
    var message_group = group_id
    redis.lpush(message_group, message, function(err, response) {
        redis.ltrim("messages", 0, 10);
        console.log(response);
    });
};

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

	socket.on('joinGroup',function(groupid){
		/*socket.broadcast.emit('message',socket.clientid +  "has joined the chat room");
		
		redisClient.smembers('chatters', function(err, names) {
            console.log("names: " + names);

            names.forEach(function(name) {
                socket.emit('add client', name);
            });
        });*/
        var clientid = socket.clientid;
        socket.groupid = groupid;
        socket.join(groupid);
		console.log(clientid+' has joined group: '+groupid);
		socket.broadcast.to(groupid).emit("message", clientid + " joined the chat");

		var message_group = 'message_'+groupid;

		redis.lrange(message_group, 0, -1, function(err, groupMessage) {
           	groupMessage = groupMessage.reverse();
            console.log("messages from redis: " + groupMessage);
            console.log("error from redis: " + err);

            groupMessage.forEach(function(message) {
                message = JSON.parse(message);
                socket.emit("message", message.name + ": " + message.data);

                console.log("message from redis: " + message.name + ": " + message.data);
            });
        });

	});


	socket.on('disconnect',function(socket){
		//remove from online set
	});

	socket.on('message',function(msg){
		console.log('Server notice '+socket.clientid+' send a msg.');
		var clientid = socket.clientid;
		socket.broadcast.to(socket.groupid).emit("message",clientid+':'+msg);
		socket.emit("message",'me: ' + msg );
		var  message_group = "message_"+socket.groupid;
		storeMessage(clientid, msg,message_group);
	});
});



console.log("Server has started on http://localhost:" + port);
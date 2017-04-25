var app = require('express')();

var redis = require('redis').createClient();

var server = require('http').Server(app);
var io = require('socket.io')(server);
const moment = require('moment');

var port = process.env.PORT || 8080;

server.listen(port);

require('./routes')(app, io);

var storeMessage = function(name, data, time, messages_group) {
    var message = JSON.stringify({
        name: name,
        data: data,
        time: time
    });

    redis.lpush(messages_group, message, function(err, response) {
        redis.ltrim(messages_group, 0, 10);
        console.log(response);
    });
};


var chatRoom = io.on('connection',function(socket){
    //redis.flushall();
	console.log('Client connected...');

	socket.on('login',function(clientid){
		console.log('Client name : '+clientid);
		socket.clientid = clientid;
		socket.groupid = 'GlobalChat';
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
        redis.sismember("groupList", groupid, function(err, reply) {
            if (reply === 1) {
                socket.emit('modal-toggle', "The group ID \""+ groupid +"\" already exists!");
            } else {
                socket.emit('add group', groupid);
		        redis.sadd("groupList",groupid);
		        redis.sadd("client_"+groupid,clientid);
		        redis.sadd("group_"+clientid,groupid);
                socket.emit('create-success', groupid);
            }
        });

	});
	socket.on('joinGroup',function(groupid){
        redis.sismember("groupList", groupid, function(err, reply) {
            if (reply === 1) {
                var clientid = socket.clientid;
                socket.emit('join-success', groupid);
                socket.emit('add group', groupid);

                socket.leave(socket.groupid);
                /* redis remove stuff here */


		        socket.join(groupid);
                /* redis add stuff here */

		        socket.groupid = groupid;

                var messages_group = "messages_" + groupid;

                redis.lrange(messages_group, 0, -1, function(err, messages) {
                    messages = messages.reverse();
                    console.log("messages from redis: " + messages);
                    console.log("error from redis: " + err);

                    messages.forEach(function(message) {
                        message = JSON.parse(message);
                        var messagepack = 
                        {
                            message: message.name + ' : ' + message.data,
                            time: message.time
                        }
                        if(message.name == socket.clientid)
                            socket.emit("self_receive", messagepack);
                        else
                            socket.emit("receive", messagepack);

                        console.log("message from redis: " + message.name + " : " + message.data + " Time: " + message.time);
                    });
                });
                socket.emit('modal-toggle', "You are now joined in group ID \""+ groupid +"\"!");
                console.log(socket.clientid + " joined.");
            } else {
                socket.emit('modal-toggle', "The group ID \""+ groupid +"\" does not exist!");
            }
        });
	});

    /*socket.on('joinGroupNoModal',function(groupid){
        redis.sismember("groupList", groupid, function(err, reply) {
            if (reply === 1) {
                var clientid = socket.clientid;
                socket.emit('join-success', groupid);
                socket.emit('add group', groupid);

                socket.leave(socket.groupid);


		        socket.join(groupid);
                
		        socket.groupid = groupid;

                var messages_group = "messages_" + groupid;

                redis.lrange(messages_group, 0, -1, function(err, messages) {
                    messages = messages.reverse();
                    console.log("messages from redis: " + messages);
                    console.log("error from redis: " + err);

                    messages.forEach(function(message) {
                        message = JSON.parse(message);
                        var messagepack = 
                        {
                            message: message.name + ' : ' + message.data,
                            time: message.time
                        }
                        if(message.name == socket.clientid)
                            socket.emit("self_receive", messagepack);
                        else
                            socket.emit("receive", messagepack);

                        console.log("message from redis: " + message.name + " : " + message.data + " Time: " + message.time);
                    });
                });
                console.log(socket.clientid + " joined.");
            } else {
                socket.emit('modal-toggle', "The group ID \""+ groupid +"\" does not exist!");
            }
        });
	});*/

	socket.on('message',function(message){
        var clientid = socket.clientid;
        var groupid = socket.groupid;
        var messages_group = "messages_" + groupid;
        var time = moment().format('HH:mm:ss');
        
        var messagepack = 
                {
                     message: clientid + ' : ' + message,
                     time: time,
                     avatarName : clientid
                }
        //socket.broadcast.to(socket.groupid).emit('receive', clientid + ' : ' + message);
        socket.broadcast.to(groupid).emit('receive', messagepack);
        socket.emit('self_receive', messagepack);
        storeMessage(clientid, message, time, messages_group);
        console.log(clientid + " sent " + messagepack.messagePart + " Time: " + messagepack.time);
	});

	socket.on('disconnect',function(data){
		socket.leave(socket.groupid);
		//socket.leave(socket.groupid);
	});

	
});



console.log("Server has started on http://localhost:" + port);
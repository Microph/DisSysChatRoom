var app = require('express')();

var redis = require('redis').createClient();

var server = require('http').Server(app);
var io = require('socket.io')(server);
const moment = require('moment');

var port = process.env.PORT || 8080;

server.listen(port);

require('./routes')(app, io);

var storeMessage = function(name, data, time, type, messages_group) {
    var message = JSON.stringify({
        name: name,
        data: data,
        time: time,
        type: type
    });

    redis.lpush(messages_group, message, function(err, response) {
        /* limit stored message */
        //redis.ltrim(messages_group, 0, 100);
        //console.log(response);
    });
};


var chatRoom = io.on('connection',function(socket){
    //redis.flushall();
	console.log('Client connected...');

	socket.on('login',function(clientid){
		//console.log('Client name : '+clientid);
		socket.clientid = clientid;
		socket.groupid = 'GlobalChat';
		socket.join('GlobalChat');
        redis.sadd("clients",clientid);

		//for debug
		redis.smembers("clients", function(err,clients) {
            //console.log("clients: " + clients);
        });

		var groupList_clientid = "group_" + clientid;

        redis.smembers(groupList_clientid, function(err,groupList_clientid) {
            //console.log("groupList_clientid: " + groupList_clientid);
            groupList_clientid.forEach(function(groupid) {
                socket.emit('add-group-list', groupid);
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
		        redis.sadd("groupList",groupid);
		        redis.sadd("client_"+groupid,clientid);
		        redis.sadd("group_"+clientid,groupid);
                socket.emit('add-group-list', groupid);
                socket.emit('joinGroup', groupid);
            }
        });
	});

	socket.on('joinGroup',function(groupid){
        redis.sismember("groupList", groupid, function(err, reply) {
            if (reply === 1) {
                var clientid = socket.clientid;
                var messagepack =
                {
                    message: clientid + ' has left the chat temporally! ',
                    type: 'noti'
                }
                socket.broadcast.to(groupid).emit('noti-receive', messagepack);
                socket.leave(socket.groupid);

		        socket.join(groupid);
		        socket.groupid = groupid;

                var messages_group = "messages_" + groupid;
                var mesCount = 0;
                redis.get("last-read-"+groupid+clientid, function(err, value) {
                    if(isNaN(value))
                    {
                        var lastRead = 0;
                        redis.set("last-read-"+groupid+clientid, lastRead);
                    }
                    else
                        var lastRead = parseInt(value) + 1;
                    
                    if (err) {
                        console.error("error last read");
                    } else {
                        redis.lrange(messages_group, 0, -1, function(err, messages) {
                        messages = messages.reverse();
                        //console.log("messages from redis: " + messages);
                        //console.log("error from redis: " + err);

                        messages.forEach(function(message) {
                            message = JSON.parse(message);
                            //noti type, currently not used
                            if(message.type === 'noti')
                            {
                                var messagepack = 
                                {
                                    message: message.data,
                                    time: message.time,
                                    avatarName : message.name,
                                    type: message.type
                                }
                                socket.emit("noti-receive", messagepack);
                            }
                            //message type
                            else
                            {
                                //unread message noti
                                mesCount++;
                                console.log("mesCount "+ mesCount + " lastRead" + lastRead);
                                    
                                if(mesCount == lastRead)
                                {
                                    console.log("detect unRead of "+ clientid + lastRead);
                                    var messagepack = 
                                    {
                                        message: "unread messages below."
                                    }
                                    socket.emit("noti-receive", messagepack);
                                }

                                var messagepack = 
                                {
                                    message: message.name + ': ' + message.data,
                                    time: message.time,
                                    avatarName : message.name,
                                    type: message.type
                                }

                                if(message.name == socket.clientid)
                                    socket.emit("self_receive_no_update_unread", messagepack);
                                else
                                    socket.emit("receive_no_update_unread", messagepack);
                            }
                            redis.set("last-read-"+groupid+clientid, mesCount);
                            //console.log("message from redis: " + message.name + " : " + message.data + " Time: " + message.time);
                            });
                        });
                    }
                });

                //redis stuff here
                redis.sadd("groupList",groupid);
		        redis.sadd("client_"+groupid,clientid);
		        redis.sadd("group_"+clientid,groupid);
                socket.emit('add-group-list', groupid);
                socket.emit('join-success', groupid);
            } else {
                socket.emit('modal-toggle', "The group ID \""+ groupid +"\" does not exist!");
            }
        });
	});

	socket.on('message',function(message){
        var clientid = socket.clientid;
        var groupid = socket.groupid;
        var messages_group = "messages_" + groupid;
        var time = moment().format('HH:mm:ss');
        
        var messagepack = 
                {
                     message: clientid + ' : ' + message,
                     time: time,
                     avatarName : clientid,
                     type: 'message'
                }
        //socket.broadcast.to(socket.groupid).emit('receive', clientid + ' : ' + message);
        socket.broadcast.to(groupid).emit('receive', messagepack);
        socket.emit('self_receive', messagepack);
        storeMessage(clientid, message, time, 'message', messages_group);
	});

    socket.on('join-noti',function(){
        var clientid = socket.clientid;
        var groupid = socket.groupid;
        var messages_group = "messages_" + groupid;
        var time = moment().format('HH:mm:ss');
        
        var messagepack = 
                {
                     message: clientid + ' has joined the chat! ',
                     type: 'noti'
                }
        socket.broadcast.to(groupid).emit('noti-receive', messagepack);
        //socket.emit('noti-receive', messagepack);
        //not store noti messages
        //storeMessage(clientid, clientid + ' has joined the chat! ', time, 'noti', messages_group);
	});

    socket.on('leave-group',function(){
        var clientid = socket.clientid;
        var groupid = socket.groupid;
        var messages_group = "messages_" + groupid;
        var time = moment().format('HH:mm:ss');
        var messagepack =
        {
            message: clientid + ' has left the chat permanently! ',
                     type: 'noti'
        }
        socket.broadcast.to(groupid).emit('noti-receive', messagepack);
        //redis stuff
		redis.srem("client_"+groupid,clientid);
		redis.srem("group_"+clientid,groupid);
		socket.leave(socket.groupid);
        socket.join('GlobalChat');
        socket.groupid = 'GlobalChat';
	});

    socket.on('update-unread', function(value){
		redis.set("last-read-"+socket.groupid+socket.clientid, value);
        console.log("last read of" + socket.clientid + " " + value);
	});

	socket.on('disconnect',function(data){
		socket.leave(socket.groupid);
	});

	
});

console.log("Server has started on http://localhost:" + port);

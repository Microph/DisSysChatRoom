//const express = require('express');

//const router = express.Router();

module.exports = function(app,io){
	//var username = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

	app.get('/',function(request,response){
		response.render(__dirname + '/index.ejs');
	});

	app.get('/login',function(request,response){
		var username = request.query.username;
		response.redirect('/chat/'+username);
	});

	app.get('/chat/:username',function(request,response){
		response.render(__dirname + '/chat.ejs');
	});

	app.get('/loginRoom',function(request,response){
		var username = request.query.username;
		var id = request.query.room_name;
		response.redirect('/chat/'+username+'/'+id);
	});

	app.get('/chat/:username/:id',function(request,response){
		response.render(__dirname + '/chat.ejs');
	});

};








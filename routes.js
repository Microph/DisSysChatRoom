//const express = require('express');

//const router = express.Router();

module.exports = function(app,io){

	app.get('/',function(request,response){
		response.render(__dirname + '/index.ejs');
	});

	app.get('/login',function(request,response){
		var username = request.query.username;
		response.redirect('/'+username+'/chat');
	});

	app.get('/:username/chat',function(request,response){
		response.render(__dirname + '/chat.ejs');
	});

};








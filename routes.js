//const express = require('express');

//const router = express.Router();

module.exports = function(app,io){

	app.get('/',function(request,response){
		response.render(__dirname + '/index.ejs');
	});

	app.get('/login',function(request,response){
		response.redirect('/chat');
	});

	app.get('/chat',function(request,response){
		response.render(__dirname + '/chat.ejs');
	});

};








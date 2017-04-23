express = require('express');

//const router = express.Router();

module.exports = function(app,io){

	app.get('/',function(request,response){
		response.render(__dirname + '/index.ejs');
	});

	app.get('/login',function(request,response){
		var clientid = request.query.clientid;
		response.redirect('/'+clientid+'/chat');
	});

	app.get('/:clientid/chat',function(request,response){
		response.render(__dirname + '/chat.ejs');
	});

	app.get('/:clientid/chat/:groupid',function(request,response){
		response.render(__dirname + '/chat.ejs');
	});

	app.use(express.static(__dirname + '/public'));
};








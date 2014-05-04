var moloko = require('../index.js');
// NOTE: You should use require('moloko') instead in real project

var server = moloko.server({
	host: 'localhost',
	port: 4242
});

server.on('listening', function(socket)
{
	console.log('Server is started listening');
});

server.on('connection', function(socket)
{
	console.log('New connection is accepted: ' + socket);
});

server.on('error', function(err)
{
	console.log('Error occured during server socket creation');
	console.log(err);
});

server.on('close', function(socket)
{
	console.log('Client is disconnected: ' + socket);
});

server.on('message', function(socket, message)
{
	console.log('Message is received from client: ' + socket);
	console.log(message);
	
	// We can send echo response
	server.send(socket, message);
});
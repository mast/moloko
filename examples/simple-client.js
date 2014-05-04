var moloko = require('../index.js');
// NOTE: You should use require('moloko') instead in real project

var client = moloko.client({
	host: 'localhost',
	port: 4242,
	reconnect: true
});

client.on('connected', function()
{
	console.log('Client is connected to server');
	
	// Now we can send data
	client.send({
		body: 'Hail to the thief!'
	});
});

client.on('error', function(err)
{
	console.log('Client was not able to connect to server');
	console.log(err);
});

client.on('closed', function()
{
	console.log('Client is disconnected from server');
});

client.on('message', function(socket, message)
{
	console.log('Message is received from server: ' + socket);
	console.log(message);
});
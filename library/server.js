/**
 * Project: Moloko
 * Description: Moloko is a wrapper over TCP sockets, 
 *              that adds message-like way of data 
 *              transportation
 * URL: https://github.com/mast/moloko
 * Author: Maxim Stepanov <mast@imast.ru>
 * Date: January 2014
 */
 
/**
(The MIT License)

Copyright (c) 2014 Maxim Stepanov <mast@imast.ru>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
**/

var net = require('net');
var util = require('util');
var events = require('events');
var msgParser = require('./message.js');

/**
 * Socket events (the same as provided by net module srv sockets)
 *
 * connection - issued when new connection is received by server (sock as param)
 * listening - issued when server is started listening
 * error - issued in case of socket error
 * end - connection is closed by remote side (FIN)
 * close - socket is closed
 * message - issued when message arrives over socket
 */

module.exports = function MocketServer(options)
{
    var self = this;

    // Options
    var _port = options.port ? options.port : 0;
    var _host = options.host ? options.host : 'localhost';

    // Create server socket
    var _server = net.createServer();

	// Events on socket
    _server.on('connection', function(sock)
    {
        // Notify emitter about new connection
        self.emit('connection', sock);

        // Register event handlers for this socket
        sock.on('data', function(msg)
        {
            msgParser.parseSocketData(self, sock, msg);
        });

        sock.on('end', function(msg)
        {
            self.emit('end', sock);
        });

        sock.on('error', function(msg)
        {
            self.emit('error', sock);
        });

        sock.on('close', function(msg)
        {
            self.emit('close', sock);
        });
    });

    _server.on('error', function(err)
    {
        // Notify emitter about error
        self.emit('error', err);
    });

	// Start listening socket
    _server.listen(_port, _host, function()
    {
        // Notify emitter about listening
        self.emit('listening');
    });


	/**
	 * P U B L I C
	 */
	 
	/**
	 * Function to be used in order to send data to socket
	 */
    this.send = function(socket, data)
    {
        msgParser.sendJson(socket, data);
    }
};

util.inherits(module.exports, events.EventEmitter);

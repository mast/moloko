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

/**
 * Socket events
 *
 * connect - issued when socket is connect to server
 * drain - issued when all sent data was written to socket
 * timeout - issued when socket is inactive for a while
 * end - connection is closed by remote side (FIN)
 * closed - socket is closed
 * reconnecting - issued when socket is trying to reconnect to server
 */

var net = require('net');
var util = require('util');
var events = require('events');
var msgParser = require('./message.js');

module.exports = function MocketClient(options)
{
    var self = this;

    // Options
    var _port = options.port ? options.port : 0;
    var _host = options.host ? options.host : 'localhost';
    var _reconnect = (options.reconnect != undefined) ? options.reconnect : true;
    var _reconnectTimerValue = 1000;
    
    var _socket = null;

    // Create socket and connect to server
    createSocketAndConnect();

    /**
     * P U B L I C
     */

    this.send = function(data)
    {
        if (_socket)
        {
            msgParser.sendJson(_socket, data);
            return true;
        }

        return false;
    }

    /**
     * P R I V A T E
     */
    function createSocketAndConnect()
    {
        _socket = net.connect({
            port: _port,
            host: _host
        });

        // Default flag values
        _socket._smNumActualReceivedBytes = 0;
        _socket._smBufferedMessage = null;

        _socket.on('connect', function()
        {
            // Notify emitter about new connection
            self.emit('connected');
        });

        _socket.on('data', function(msg)
        {
            msgParser.parseSocketData(self, _socket, msg);
        });

        _socket.on('drain', function()
        {
            self.emit('drain');
        });

        _socket.on('timeout', function()
        {
            self.emit('timeout');
        });

        _socket.on('error', function(err)
        {
            self.emit('error', err);
        });

        _socket.on('end', function()
        {
            self.emit('end');
        });

        _socket.on('parse error', function()
        {
            // In case if parsing error happened in msg parser
            // close socket
            _socket.destroy();
            
            // I assume that 'close' event will be sent after that
        });

        _socket.on('close', function()
        {
            // Remove socket
            delete _socket;
            _socket = null;

            // Emit event
            self.emit('closed');

            if (_reconnect)
            {
                setTimeout(function()
                {
                    createSocketAndConnect();
                }, _reconnectTimerValue);
            }
        });
    }
};

util.inherits(module.exports, events.EventEmitter);

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
 * This is internal module that provides Moloko protocol
 */
module.exports.parseSocketData = function(emitter, sock, msg)
{
    // This function assumes existence of 2 socket variables
    // _smBufferedMessage - is a Buffer instance placeholder for message
    // _smNumActualReceivedBytes - is amount of data collected in _smBufferedMessage.

    // Message frame format is:
    // |-----------------------------------------------|
    // | 1 byte        | 4 bytes (LE) | Variable       |
    // |-----------------------------------------------|
    // | 0 (delimiter) | Length       | Data           |
    // |-----------------------------------------------|

    // Compose buffer to check
    var buffer = null;
    if (sock._smBufferedMessage)
    {
        buffer = new Buffer(sock._smBufferedMessage.length + msg.length);

        // Merge 2 messages to 1 buffer
        sock._smBufferedMessage.copy(buffer, 0, 0);
        msg.copy(buffer, sock._smBufferedMessage.length, 0);
    }
    else
    {
        // There is nothing to merge, since there is no remaining packaet from prev step
        buffer = msg;
    }

    // Not look into buffer to search for mocket messages
    while (1)
    {
        if (buffer.length < 5)
        {
            // It means there is too small amount of info, buffer it
            sock._smBufferedMessage = buffer;
            return;
        }

        var flag = buffer.readUInt8(0);
        var length = buffer.readUInt32LE(1);

        if (flag != 0)
        {
            // Wrong format of frame
            sock.emit('parse error');
            return;
        }

        // Check if this is complete frame
        if (length <= (buffer.length - 5))
        {
            // There is one complete frame, retrieve it
            var data = buffer.slice(5, length + 5);

            // Notify emitter about new message
            emitter.emit('message', sock, parseMessage(data));

            // Update buffer
            var newBufferSize = buffer.length - length - 5;

            if (newBufferSize > 0)
            {
                var newBuffer = new Buffer(newBufferSize);
                buffer.copy(newBuffer, 0, length + 5);

                // Reset head
                delete buffer;
                buffer = newBuffer;

                // Now continue, may be there are more message in buffer now
                continue;
            }
            else
            {
                // There are no remaining octets in buffer, break
                sock._smBufferedMessage = null;
                break;
            }
        }
        else
        {
            // Keep this for next recv event
            sock._smBufferedMessage = buffer;
            return;
        }
    }
};

/**
 * Function sends Moloko message to socket
 */
module.exports.sendJson = function(sock, data)
{
    var string = JSON.stringify(data);
    var buffer = new Buffer(string, 'utf8');
    var msg = new Buffer(buffer.length + 5);

    // Encode type and length
    msg.writeUInt8(0, 0);
    msg.writeUInt32LE(buffer.length, 1);
    buffer.copy(msg, 5, 0);

    // Send to socket
    sock.write(msg);

    // Free resources
    delete msg;
    delete buffer;
}

/**
 * Internal function that is used in order to prepare message to be passed to callback
 */
function parseMessage(msg)
{
    try
    {
        return JSON.parse(msg);
    }
    catch (ex)
    {
        return null;
    }

    return null;
}
require('dotenv').config()

const TYPE_FUNCTION = "TYPE_FUNCTION"
const TYPE_MESSAGE = "TYPE_MESSAGE"
const PRIVATE_ROOM = "-private-room"
const DISCONNECT = "-disconnect"
const JOIN_ROOM = "-join-room"

const listWebString = process.env.CONNECTION_WEB || "localhost"
const listWeb = listWebString.split(",")
const prefixConn = process.env.CONNECTION_PREFIX || "connection-with-"
const port = process.env.PORT || Math.floor(Math.random() * 50000)
const portHost = process.env.PORT_HOST || port

const path = require('path')
const http = require("http")
const url = require('url');

const { readFileSync } = require("fs")
const { getData, getToken, getRoomId } = require("./event/event-data")
const { generateId } = require("./utilities/helpers")
const sio = require('socket.io')

const filePathIndex = path.format({
    dir: __dirname + "/assets",
    base: 'index.html'
})

const htmlLocalhost = readFileSync(filePathIndex, { encoding: "utf-8" })
const server = http.createServer(
    function (req, res) {
        const params = url.parse(req.url, true).query;
        const room = params.room || null
        if (!room) {
            const locationRedirect = process.env.HOST + ":" + portHost + "?room=" + generateId(20)
            res.writeHead(302, {
                'Location': locationRedirect
            });
            res.end()
            return
        }

        res.writeHead(200, { "Content-Type": "text/html" })
        res.write(htmlLocalhost)
        res.end()
    })
const io = sio(server, {
    cors: {
        origin: '*',
    }
})

io.on("connect", client => {
    for (let i = 0; i < listWeb.length; i++) {
        let clientConn = prefixConn + listWeb[i]
        let joinRoom = clientConn + JOIN_ROOM
        let privateRoom = clientConn + PRIVATE_ROOM
        let disconnectRoom = clientConn + DISCONNECT
        client.on(joinRoom, message => {
            const token = getToken(message)
            let roomId = getRoomId(message)
            if (!roomId) {
                roomId = generateId(10)
            }

            client.join(roomId)
            io.to(roomId).emit(privateRoom, "token : " + token + " join in " + roomId)

            client.on("disconnect", _ => {
                console.log("disconnect from server", token)
                io.to(roomId).emit(disconnectRoom, JSON.stringify({ token }))
            })
        })
        client.on(privateRoom, message => {
            const data = getData(message)
            const roomId = getRoomId(message)
            if (data && (data.type || null)) {
                if (data.type == TYPE_FUNCTION) {
                    io.to(roomId).emit(data.name, JSON.stringify({ func: data.func, params: data.params }))
                } else if (data.type == TYPE_MESSAGE) {
                    io.to(roomId).emit(data.name, JSON.stringify(data))
                }
            }
        })
    }
})

server.listen(port)
console.log("listening to port :", port)




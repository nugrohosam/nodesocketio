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

const path = require('path')
const http = require("http")
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
        res.writeHead(200, { "Content-Type": "text/html" })
        res.write(htmlLocalhost)
        res.end()
    })
const io = sio(server)

io.on("connect", client => {

    function emitClientMessage(clientCall, name, message, roomId) {
    }

    function emitClientFunction(clientCall, name, dataFunc, roomId) {
    }

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
            emitClientMessage(joinRoom, roomId, token)
            client.on("disconnect", _ => {
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




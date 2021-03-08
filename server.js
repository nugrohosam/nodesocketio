
const TYPE_FUNCTION = "TYPE_FUNCTION"
const TYPE_MESSAGE = "TYPE_MESSAGE"
const PRIVATE_ROOM = "-private-room"
const DISCONNECT = "-disconnect"
const JOIN_ROOM = "-join-room"

const listWebString = process.env.CONNECTION_WEB || "localhost"
const listWeb = listWebString.split(",")
const prefixConn = process.env.CONNECTION_PREFIX || "connection-with-"
const filePathIndex = __dirname + "\\assets\\index.html";
const port = process.env.PORT || Math.floor(Math.random() * 50000)

const http = require("http")
const { readFileSync } = require("fs")
const { getData, getToken, getRoomId } = require("./event/event-data")
const { generateId } = require("./utilities/helpers")
const { setKeyRoom } = require("./utilities/room")
const sio = require("socket.io")
const redis = require("redis");

const redisClient = redis.createClient();
const htmlLocalhost = readFileSync(filePathIndex, { encoding: "utf-8" })
const server = http.createServer(
    function (req, res) {
        res.writeHead(200, { "Content-Type": "text/html" })
        res.write(htmlLocalhost)
        res.end()
    })
const io = sio(server)

function broadcastRoom(name, roomId) {
    io.to(roomId).emit(name, JSON.stringify({ room_id: roomId }))
}

function broadcastMessageToRoom(name, roomId, data) {
    io.to(roomId).emit(name, JSON.stringify(data))
}

io.on("connect", client => {

    function emitClientMessage(name, message, roomId = null) {
        if (roomId) {
            broadcastRoom(name, roomId, data)
        } else {
            client.emit(name, message)
        }
    }

    function emitClientFunction(name, dataFunc, roomId = null) {
        if (roomId) {
            broadcastMessageToRoom(name, roomId, dataFunc)
        } else {
            const callbackFunction = JSON.stringify(dataFunc)
            client.emit(name, callbackFunction)
        }
    }

    function creatingRoom(name, token) {
        roomId = generateId(10)
        client.join(roomId)
        const nameRoom = setKeyRoom(name, roomId)
        broadcastRoom(name, roomId)
    }

    function leaveRoom(name, roomId, token) {
        // const nameRoom = setKeyRoom(name, roomId)
    }

    for (let i = 0; i < listWeb.length; i++) {
        let clientConn = prefixConn + listWeb[i]
        let joinRoom = clientConn + JOIN_ROOM
        let disconnect = clientConn + DISCONNECT
        let privateRoom = clientConn + PRIVATE_ROOM

        client.on(joinRoom, message => {
            const token = getToken(message)
            const roomId = getRoomId(message)

            if (roomId) {
                client.join(roomId)
                broadcastRoom(joinRoom, roomId)
            } else {
                creatingRoom(clientConn + JOIN_ROOM, token)
            }
        })

        client.on(clientConn, message => {
            const data = getData(message)
            const type = data?.type || null

            if (type == TYPE_FUNCTION) {
                dataFunc = { func: data.func, params: data.params }
                emitClientFunction(data.name, dataFunc)
            } else if (type == TYPE_MESSAGE) {
                emitClientMessage(data.name, data.message)
            }
        })

        client.on(privateRoom, message => {
            const data = getData(message)
            const roomId = getRoomId(message)
            const type = data?.type || null

            if (type == TYPE_FUNCTION) {
                dataFunc = { func: data.func, params: data.params }
                emitClientFunction(data.name, dataFunc, roomId)
            } else if (type == TYPE_MESSAGE) {
                emitClientMessage(data.name, data.message, roomId)
            }
        })

        client.on(disconnect, message => {
            const roomId = getRoomId(message)
            const token = getToken(message)
            
            leaveRoom(privateRoom, roomId, token)
        })
    }

    client.on("disconnect", message => {
        console.log(client.id, "disconnected from socket")
    })

})

server.listen(port)
console.log("listening to port :", port)




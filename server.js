const http = require("http")
const { readFileSync } = require("fs")

const TYPE_FUNCTION = "TYPE_FUNCTION"
const TYPE_MESSAGE = "TYPE_MESSAGE"

const listWebString = process.env.CONNECTION_WEB || "localhost"
const listWeb = listWebString.split(",")
const prefixConn = process.env.CONNECTION_PREFIX || "connection-with-"

const filePathIndex = __dirname + "\\assets\\index.html";
let htmlLocalhost = readFileSync(filePathIndex, { encoding: 'utf-8' })

const server = http.createServer(
    function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.write(htmlLocalhost)
        res.end()
    })

const io = require("socket.io")(server)

io.on("connect", client => {

    function emitClientMessage(name, message) {
        client.emit(name, message)
    }

    function emitClientFunction(name, dataFunc) {
        const callbackFunction = JSON.stringify(dataFunc)
        client.emit(name, callbackFunction)
    }
    
    for (let i = 0; i < listWeb.length; i++) {
        let dataConn = prefixConn + listWeb[i]
        client.on(dataConn, message => {

            const { getData, getToken } = require('./event/event-data')
            const data = getData(message)
            const token = getToken(message)

            if (data.type == TYPE_FUNCTION) {
                dataFunc = { func: data.func, params: data.params }
                emitClientFunction(data.name, dataFunc)
            } else if (data.type == TYPE_MESSAGE) {
                emitClientMessage(data.name, data.message)
            } else {
                console.log(data)
            }
        })
    }

    client.on("disconnect", data => {
        console.log(data + " --> disconnected")
    })
})

const port = process.env.PORT || Math.floor(Math.random() * 50000)
server.listen(port)

console.log("listening in port :", port)



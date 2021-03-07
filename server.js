const http = require("http")
const { readFileSync } = require("fs")

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
const port = process.env.PORT || 3000

io.on("connect", client => {
    console.log(client.name)
    console.log(client.id)
    
    for (let i = 0; i < listWeb.length; i++) {
        let dataConn = prefixConn + listWeb[i]
        client.on(dataConn, data => {
            console.log(data + " --> connected")
        })
    }

    client.on("disconnect", data => {
        console.log(data + " --> disconnected")
    })
})
server.listen(port)

console.log("listening in port :", port)



exports.getData = function (data) {
    const dataParsed = JSON.parse(data)
    return dataParsed.data || null
}

exports.getToken = function (data) {
    const dataParsed = JSON.parse(data)
    return dataParsed.token || null
}

exports.getRoomId = function (data) {
    const dataParsed = JSON.parse(data)
    return dataParsed.room_id || null
}
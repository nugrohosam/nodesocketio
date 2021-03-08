function setValue(value) {
    return JSON.stringify([{
        data: value,
        createAt: Date.now()
    }])
}

function addValue(oldValue, value) {
    const oldvalueParsed = JSON.parse(oldValue)
    oldvalueParsed.push(setValue(value))

    return JSON.stringify(oldvalueParsed)
}

function removeValue(key, valueData, valueToremove) {
    const valueParsed = JSON.parse(valueData)
    let newValue = []
    for (let i = 0; i < valueParsed.length; i++) {
        if (valueParsed[i].data == valueToremove) {
            continue;
        }

        newValue.push(valueParsed[i])
    }

    return JSON.stringify(newValue)
}

exports.setRedisValue = (redisClient, key, addingValue) => {
    let valueData = null

    redisClient.get(key, (err, value) => {
        if (err) {
            valueData = null
        } else {
            valueData = value
        }
    });

    if (valueData) {
        redisClient.set(key, addValue(valueData, addingValue))
    } else {
        redisClient.set(key, setValue(addingValue))
    }
}

exports.removeRedisValue = (redisClient, key, valueToRemove) => {
    let valueData = null

    redisClient.get(key, (err, value) => {
        if (err) {
            valueData = null
        } else {
            valueData = value
        }
    });

    if (valueData) {
        const removedData = removeValue(key, valueData, valueToRemove)
        redisClient.set(key, removedData)
    }
}
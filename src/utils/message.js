const generateMessage = (text,username='Admin') => {
    return {
        text,
        username,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage
}
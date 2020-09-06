const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const express = require('express')
const hbs = require('hbs')
const {generateMessage} = require('./utils/message')
const {getUser,getUsersInRoom,removeUser,addUser} = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

// const viewspath = path.join(__dirname, './templates/views')
// const Partialspath = path.join(__dirname, './templates/partials')

const port = process.env.PORT || 3000
const publicDirectorypath = path.join(__dirname,'../public')

app.use(express.static(publicDirectorypath))

// app.set('view engine','hbs')
// app.set('views',viewspath)
// hbs.registerPartials(Partialspath)


io.on('connection',(socket) =>{
    console.log('new websocket connection!')
    socket.on('join',(option, callback)=>{
        const {error,user} = addUser({id: socket.id,...option})
        if(error){
            return callback(error)
        }
        const {username,room} = user
        socket.join(room)
        socket.emit('welcomeIntent',generateMessage(`Welcome! ${username}`))
        socket.broadcast.to(room).emit('welcomeIntent',generateMessage(`User ${username} has joined!`))
        io.to(room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        const {room,username} = user
        io.to(room).emit('welcomeIntent',generateMessage(message,username))
        callback()
    })

    socket.on('sendLocation',(location,callback)=>{
        const user = getUser(socket.id)
        const {room,username} = user
        const message = `https://google.com/maps?q=${location.latitude},${location.longitude}`
        io.to(room).emit('locationMessage',generateMessage(message,username))
        callback()
    })

    socket.on('disconnect',() =>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('welcomeIntent',generateMessage(`User ${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port,()=>{
    console.log(`server is up at ${port}!`)
})
const express=require('express');
const path=require('path');
const http = require('http');
const socketio=require('socket.io');
const Filter = require('bad-words');
const {generateMessage}=require('./utils/messages');
const {generateLocationMessage}=require('./utils/location-message');
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users');

const app=express();
const server = http.createServer(app);
const io = socketio(server);



const publicDirectoryPath=path.join(__dirname,'../public');
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(publicDirectoryPath));

io.on('connection',(socket ) => {

    console.log("new websocket connection");
    // const currentUser=getUser(socket.id);
    // currentUserName = currentUser?currentUser.username:'User 1';
    //To register user and chat room
    socket.on('join',({username,room},callback) =>{

       const {error,user} = addUser({id:socket.id,username,room});
        // currentUserName=username;
       if(error){
           return callback(error)
       }

        socket.join(room);
        //socket.emit , io.emit , socket.broadcast.emit
        //io.to.emit , socket.broadcast.to.emit

        //sends message only to the connected user
        socket.emit('message',generateMessage('Welcome!','Admin'));

        io.to(room).emit('roomData',{room,users:getUsersInRoom(room)});


        //to broadcast a message to all connected users except the one sending it
        socket.broadcast.to(room).emit('message',generateMessage(`${username} has joined!`));
        callback();
    });

    socket.on('sendMessage',(message,callback) =>{
        const filter=new Filter();

        if(filter.isProfane(message)){
           return callback('Profanity is not allowed');
        }
        //this sends a message to all connected users
        const user=getUser(socket.id);
        io.to(user.room).emit('message',generateMessage(message,user.username));
        callback();
    });

    socket.on('sendLocation',(location,callback) =>{
        const user=getUser(socket.id);
        io.to(user.room).emit('locationMessage',generateLocationMessage(location.latitude,location.longitude,user.username));
        callback('shared the location .')
    });

    //when a connection is closed, to notify all other connected users (this approcah instead of broadcast because socket is already closed)
    socket.on('disconnect',() =>{

        const user= getUser(socket.id);
        removeUser(socket.id);
        if(user){
            io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)});
        }


        if(user){
            io.to(user.room).emit('message',generateMessage(` ${user.username} has left!`,'Admin'));
        }

    });
});

server.listen(port,() =>{
    console.log("app listening on port ",port);
});

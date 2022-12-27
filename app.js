const express = require('express');
const http = require('http');
const soketio = require('socket.io');
// const redisAdapter = require('socket.io-redis');

// const NodeMediaServer = require('node-media-server');

const { ExpressPeerServer } = require('peer');

// const config = {
//     rtmp: {
//       port: 1935,
//       chunk_size: 60000,
//       gop_cache: true,
//       ping: 30,
//       ping_timeout: 60
//     },
//     http: {
//       port: 5000,
//       allow_origin: '*'
//     }
//   };
// var nms = new NodeMediaServer(config)


const app = express();

const server = http.createServer(app);
// const io = soketio(server).sockets;
var io = require('socket.io')(http, { cors: { origin: '*' } });



app.use(express.json());

const customGenerationFunction = () =>
    (Math.random().toString(36) + "000000000000000").substr(2, 16);


const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    generateClientId: customGenerationFunction,
});

app.use("/mypeer", peerServer);

io.on("connection", function (socket) {
    socket.setMaxListeners(10000)
    console.log("conneted");
    socket.on('join-room', ({ roomId, userId, myData }) => {
        // console.log("join-room call");
        console.log("roomId", roomId, userId, myData)
        socket.join(roomId);
        socket.to(roomId).broadcast.emit("user-connected", userId, socket.id, myData)

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit("user-disconnected", userId)
        });

        socket.on('send-myData', ({ remoteSocketId, myData }) => {
            socket.to(remoteSocketId).emit("receive-data", myData, remoteSocketId)
        })

        socket.on('audio', (status) => {
            console.log("audio_status", status)
            socket.to(roomId).broadcast.emit("audio_status", userId, status)
        });

        socket.on('raiseHand', (data) => {
            console.log("raiseHand_status", data)
            socket.to(roomId).broadcast.emit("raiseHand_status", userId, data)
        });

        socket.on('remove_member_moderator', (data) => {
            socket.to(roomId).emit('remove_member_moderator', userId, data)
        })

        socket.on('love', (data) => {
            console.log("love_status", data);
            socket.to(roomId).broadcast.emit("love_status", userId, data);
        });

        socket.on('video', (status) => {
            socket.to(roomId).broadcast.emit("video_status", userId, status)
        });

        socket.on('speaker', (status) => {
            // console.log('speaker', userId, status);
            socket.to(roomId).broadcast.emit("speaker_status", userId, status);
        });

        socket.on('grpchat', (data) => {
            console.log("grpchat", data);
            socket.to(roomId).broadcast.emit("getgrpchat", userId, data)
        });
        socket.on('leave_all', (data) => {
            console.log("leave_all", data);
            socket.to(roomId).broadcast.emit("leave_all_status", data)
        });
        socket.on('bye_bye', (data) => {
            console.log("bye_bye", data);
            console.log("leave0", socket.rooms, socket.sids)
            socket.leave(roomId);

            console.log("leave1", socket.rooms, socket.sids)

            socket.to(roomId).broadcast.emit("bye_bye_status", userId, data);
        });
        socket.on('make_speaker', (data) => {
            console.log("make_speaker", data);
            socket.to(roomId).broadcast.emit("make_speaker_status", userId, data)
        });

        socket.on('screen_share', (screenId) => {
            socket.to(roomId).broadcast.emit("start_screen_share", screenId)
        });

        socket.on('screen_share_stop', (screenId) => {
            socket.to(roomId).broadcast.emit("stop_screen_share", screenId)
        });
    });

    socket.on('event-room', ({ roomId, userId }) => {
        // console.log("join-room call");
        console.log("event roomId", roomId, userId)
        socket.join(roomId);
        socket.to(roomId).broadcast.emit("event-user-connected", userId)

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit("event-user-disconnected", userId)
        })

        socket.on('session_start', ({ status }) => {
            console.log("session_start_status", status)
            socket.to(roomId).broadcast.emit("session_start_status", status)
        });

        socket.on('session_end', (status) => {
            console.log("session_end_status", status)
            socket.to(roomId).broadcast.emit("session_end_status", userId, status)
        });

    });


});

const port = process.env.PORT || 5000;


server.listen(port, () =>
    console.log(`Server running at port ${port}`)
);
// nms.run();
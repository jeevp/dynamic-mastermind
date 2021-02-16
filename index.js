

// const express = require('express')
// const app = express()

// const http = require('http').Server(app);
// const io = require('socket.io')(http);


// const port = 3000

// app.use(express.static('public'))

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// })

// app.listen(port, () => {
//   console.log(`Example app listening at http://localhost:${port}`)
// })

// io.on('connection', (socket) => {
//     console.log('a user connected');
// });

const express = require('express')
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})


io.on('connection', socket => { 
    socket.on('create game', (name, game) => {
        let gameID = socket.id
        const player = {
            role: 'maker',
            name: name,
        }
        io.to(gameID).emit('new player', player);
        io.to(gameID).emit('game ready', gameID);
    });

    socket.on('join game', (gameID) => {
        socket.join(gameID)
        io.to(gameID).emit('retrieve game');
    })

    socket.on('add breaker', (gameID, name) => {
        const player = {
            role: 'breaker',
            name: name,
        }
        io.to(gameID).emit('new player', player);
    })

    socket.on('start game', (gameID) => {
        io.to(gameID).emit('game started');
    })

    socket.on('game object', (game) => {
        io.to(game.id).emit('game incoming', game);
    })

    socket.on('new code', (gameID, code) => {
        io.to(gameID).emit('code incoming', code);
    })
    socket.on('new guess', (gameID, guess) => {
        io.to(gameID).emit('guess incoming', guess);
    })

    // socket.on('send msg', gameID)


    socket.on('disconnect', () => {
        console.log('A user has disconnected.');
    })
});

// /**
//  * Connect the Player 2 to the room he requested. Show error if room full.
//  */
// io.on('joinGame', (data) => {
//     var room = io.nsps['/'].adapter.rooms[data.room];
//     if (room && room.length == 1){
//       io.join(data.room);
//       io.broadcast.to(data.room).emit('player1', {});
//       io.emit('player2', {name: data.name, room: data.room })
//     }
//     else {
//       io.emit('err', {message: 'Sorry, The room is full!'});
//     }
// });

// /**
//  * Handle the turn played by either player and notify the other. 
//  */
// io.on('playTurn', (data) => {
//     io.broadcast.to(data.room).emit('turnPlayed', {
//       tile: data.tile,
//       room: data.room
//     });
// });  

// /**
//  * Handle the turn played by either player and notify the other. 
//  */
// io.on('playTurn', function(data){
//     io.broadcast.to(data.room).emit('turnPlayed', {
//       tile: data.tile,
//       room: data.room
//     });
// });

// /**
//  * Notify the players about the victor.
//  */
// io.on('gameEnded', function(data){
//     io.broadcast.to(data.room).emit('gameEnd', data);
// });





server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
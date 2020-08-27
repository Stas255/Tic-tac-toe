var app = require('express')();
var http = require('http').createServer(app);
const session = require('express-session');
//app.use(expressStatusMonitor({ websocket: io, port: app.get('port') })); 
http.listen(3000, () => console.log("Server is running"));
var io = require('socket.io')(http);
var express = require('express');
var $ = require("jquery");

app.set("view engine", "hbs");

app.use(express.static('public'));
var Maps = new Map();

//var Maps = new Maps();

app.use(session({
    secret: 'ssshhhhh',
    saveUninitialized: true
}));

// load html 
app.get('/', function (req, res) {
    res.render("index");
});

app.get('/createServer', function (req, res) {
    var rand = Math.floor(Math.random() * 2).toString();
    if (!Maps.has(rand)) {
        Maps.set(rand, new GameMap());
    }
    res.redirect('/game/' + rand);
});

app.get('/game/:id', function (req, res) {
    var rand = req.params.id;
    if (Maps.has(rand)) {
        res.render("index2");
    } else {
        res.redirect('/');
    }
});

// POST GetSessionId
app.post('/GetSessionId', function (req, res) {
    res.json(req.session.id);
});

// socket connect 
io.on('connection', (socket) => {
    console.log("New user connected: " + socket.id);
    io.sockets.emit('message', "New user connected: " + socket.id);

    socket.on('new_user', (data) => {
        if (Maps.has(data.idGame)) {
            Maps.get(data.idGame).AddUser(data.idUser, socket.id);
            if (Maps.get(data.idGame).IsStart()) {
                var MapId = Maps.get(data.idGame);
                io.sockets.emit('start_Map_', { map: MapId });
            }
        }
    });

    socket.on('click', (data) => {
        if (Maps.has(data.idGame)) {
            var MapId = Maps.get(data.idGame);
            var userId = data.idUser;
            if (MapId.main == userId && MapId.CheckIsEmpty(data.idBlock)) {
                MapId.AddInBlock(data.idBlock, userId);
                if (MapId.CheckIsWin(data.idBlock)) {
                    MapId.winner = userId;
                    io.sockets.emit('finish_Map_', { map: MapId, idUser: userId });
                } else {
                    io.sockets.emit('update_Map_', { map: MapId });
                }
            }
        }
    });

    socket.on('disconnect', function (e) {
        var url = socket.handshake.headers.referer;
        if (/game/.test(url)) {
            var urlSplit = url.split('/');
            var idGame = urlSplit[urlSplit.length - 1];
            Maps.get(idGame).Disconect(socket.id);
            if (Maps.get(idGame).IsDisconect()) {
                Maps.delete(idGame);
                console.log("Game: " + idGame + " is delete");
                io.sockets.emit('message', "Game: " + idGame + " is delete");
            }
            console.log("user disconnect: " + socket.id);
            io.sockets.emit('message', "user disconnect: " + socket.id);
        }
    });

});

class GameMap {
    constructor(id) {
        this.id = id;
        this.blocks = new Array(4);
        for (var i = 0; i < 4; i++) {
            this.blocks[i] = new Array(4);
        }
        for (var i = 1; i <= 3; i++) {
            for (var j = 1; j <= 3; j++) {
                this.blocks[i][j] = 0;
            }
        }
    }

    IsDisconect() {
        return (this.user1SocketConnect == false || this.user1SocketConnect == undefined)
            && (this.user2SocketConnect == false || this.user2SocketConnect == undefined);
    }

    Disconect(socketId) {
        if (this.user1Socket == socketId) {
            this.user1SocketConnect = false;
        }
        if (this.user2Socket == socketId) {
            this.user2SocketConnect = false;
        }
    }

    IsUser(socketId) {
        return this.user1Socket == socketId || this.user2Socket == socketId;
    }

    AddUser(userId, socketId) {

        if (!this.user1) {
            this.user1 = userId;
            this.user1Name = "X";
            this.user1Socket = socketId;
            this.user1SocketConnect = true;
        } else if (!this.user2 && userId != this.user1) {
            this.user2 = userId;
            this.user2Name = "O";
            this.user2Socket = socketId;
            this.user2SocketConnect = true;
            this.Start();
        }
    }

    Start() {
        this.main = this.user1;
        this.step = 0;
    }

    IsStart() {
        return this.main !== undefined;
    }

    AddInBlock(idBlock, IdUser) {
        this.blocks[idBlock[0]][idBlock[1]] = IdUser;
        this.main = (this.main == this.user1) ? this.user2 : this.user1;
        this.step++;
    }

    CheckIsEmpty(idBlock) {
        return this.blocks[idBlock[0]][idBlock[1]] == 0;
    }

    CheckIsWin(idBlock) {
        var t = 1;
        for (var i = 0; i <= 1; i++) {
            var test1 = this.Line([-1, -i], idBlock) + this.Line([1, i], idBlock);
            var test2 = this.Line([-i, 1], idBlock) + this.Line([i, -1], idBlock);
            if (test1 == 2 || test2 == 2) {
                return true;
            }
        }
        return false;
    }

    Line(number, idBlock) {
        var newNumber = [number[0] + idBlock[0], number[1] + idBlock[1]];
        if (this.CheckIsMapBlock(newNumber[0]) && this.CheckIsMapBlock(newNumber[1]) && this.blocks[idBlock[0]][idBlock[1]] == this.blocks[newNumber[0]][newNumber[1]]) {
            return 1 + this.Line(number, newNumber);
        }
        return 0;
    }

    CheckIsMapBlock(number) {
        return number <= 3 && number >= 1;
    }
}


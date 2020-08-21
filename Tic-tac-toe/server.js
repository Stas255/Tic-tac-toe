var app = require('express')();
var http = require('http').createServer(app);
const session = require('express-session');
var io = require('socket.io')(http);
var express = require('express');

app.set("view engine", "hbs");

app.use(express.static('public'));

var Maps = [];

app.use(session({
    secret: 'ssshhhhh',
    saveUninitialized: true
}));

// load html 
app.get('/', function (req, res) {
    res.render("index");
});

app.get('/createServer', function (req, res) {
    var rand = Math.floor(Math.random() * 101);
    if (!Maps[rand]) {
        Maps[rand] = new Map(rand);
        Maps[rand].AddUser(req.session.id);
    }
    res.redirect('/game/' + rand);
});

app.get('/game/:id', function (req, res) {
    var rand = req.params.id;
    if (Maps[rand]) {
        console.log("connect ok");
        Maps[rand].AddUser(req.session.id);
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
    console.log("New user connected");

    socket.on('click', (data) => {
        if (Maps[data.idGame]) {
            var MapId = Maps[data.idGame];
            var userId = data.idUser;
            if (MapId.main == userId && MapId.CheckIsEmpty(data.idBlock)) {
                MapId.AddInBlock(data.idBlock, userId);
                if (MapId.CheckIsWin(data.idBlock)) {
                    io.sockets.emit('finish_Map_' + data.idGame, { map: MapId, idUser: userId });
                } else {
                    io.sockets.emit('update_Map_' + data.idGame, { map: MapId });
                }
            }
        }
    });

    /*socket.on('gameIsStart', (data) => {
        if (Maps[data.idGame].IsStart()) {
            var MapId = Maps[data.idGame];
            io.sockets.emit('start_Map_' + data.idGame, { map: MapId });
        }
    });*/

    socket.on('disconnect', function (e) {
        console.log(e);
    });
});

class Map {
    main;
    blocks = new Array(4);
    step;
    winner;
    constructor(id) {
        this.id = id;
        for (var i = 0; i < 4; i++) {
            this.blocks[i] = new Array(4);
        }
        for (var i = 1; i <= 3; i++) {
            for (var j = 1; j <= 3; j++) {
                this.blocks[i][j] = 0;
            }
        }
    }

    AddUser(userId) {
        if (!this.user1) {
            this.user1 = userId;
            this.user1Name = "X";
        } else if (!this.user2 && userId != this.user1) {
            this.user2 = userId;
            this.user2Name = "O";
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

var server = http.listen("3000", () => console.log("Server is running"));

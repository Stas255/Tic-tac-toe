$(function () {

    paper.install(window);
    paper.setup("myCanvas");

    //var socket = io('ws://odz.tolstonozhenko.com.ua:3000', { transports: ['websocket'] });
    var socket = io();
    socket.on('connect', function () {
        console.log('connected!');
    });

    var urlSplit = window.location.href.split('/');
    var idGame = urlSplit[urlSplit.length - 1];
    var idUser, time;

    var blockSize = paper.view.size.width/ 3;
    var pointsArray = [];
    var lines = new Group({
        visible: false
    });

    //loading screen
    var loading = new Raster({
        source: 'https://www.clipartmax.com/png/full/328-3285005_big-image-pill.png',
        position: view.center
    });

    loading.scale(0.05); //circle
    $('#loading').css('top', view.center.y - 90); //text

    view.onFrame = function (event) {
        loading.rotate(1.2);
    }

    var ClickRectangle = function (e) {
        Message("User Click", null);
        var number = this.data.number;
        let request = new XMLHttpRequest();
        request.open("POST", "/GetSessionId", true);
        request.setRequestHeader("Content-Type", "application/json");
        var result;
        setTimeout(request.addEventListener("load", function () {
            result = JSON.parse(request.response);
            idUser = (idUser == undefined)? result: idUser;
            let data = {
                idGame: idGame,
                idUser: result,
                idBlock: number
            };   
            socket.emit('click', data);
            Message("Socket Emit Click", data);
        }), 5000);
        request.send();
    }

    var halfBlockSize = blockSize/2;
    var ix = 1, jy = 1;
    for (var i = 0; i < blockSize * 3; i = (ix++) * blockSize) {
        jy = 1;
        for (var j = 0; j < blockSize * 3; j = (jy++) * blockSize) {
            var rectangle = new Path.Rectangle(j, i, blockSize, blockSize);
            rectangle.data.number = [ix,jy];
            rectangle.onClick = ClickRectangle;
            lines.addChild(rectangle);
            pointsArray.push(new Point(j + halfBlockSize, i + halfBlockSize));
        }
    }

        //socket
        
        socket.on('update_Map_', data => {
            whichMove(data.map);
            UpdateMap(data);
            Message("Socket Answer update_Map_", data.map);
            if (data.map.step == 9) {
                $('.message').html("No one has won");
                NewGame(data);
            }
        });

        socket.on('start_Map_', data => {
                UpdateMap(data);
                lines.visible = true; //grid
                loading.remove(); //circle
                Message("Socket Answer start_Map_", data.map);
                if (data.map.winner) {
                    NewGame(data);
                } else {
                    $('#loading').css('visibility', 'hidden'); //text
                    $('.message').html("Game is started");
                    setTimeout(whichMove, 1000, data.map);
                }
            });

        socket.on('finish_Map_', data => {
            UpdateMap(data);
            NewGame(data);
            Message("Socket Answer finish_Map_", data.map);
        });

    function UpdateMap(data) {
        Message("User Update Map", data.map);
        for (var i = 1; i <= 3; i++) {
            for (var j = 1; j <= 3; j++) {
                if (data.map.blocks[i][j] == data.map.user1)
                    show(i - 1, j - 1, "X");
                else if (data.map.blocks[i][j] == data.map.user2)
                    show(i - 1, j - 1, "O");
            }
        }
    }

    function whichMove(data) {
        if (idUser) {
            if (idUser == data.main) {
                $('.message').html("It's your move now");
            } else {
                $('.message').html('Wait for enemy move');
            }
        } else {
            if (data.user1 == data.main) {
                $('.message').html('"X" move now');
            } else {
                $('.message').html('"O" move now');
            }
        }
    }

    //show figure
    function show(i, j, name) {
        var position = i * 3 + j;
        if (name == 'X') {
            var cross = new Group([new Path([100, 120], [100, 180]), new Path([70, 150], [130, 150])]);
            cross.position = pointsArray[position];
            cross.scale(blockSize / 70, pointsArray[position])
            cross.rotate(45);
            cross.style = {
                strokeColor: '#CDAE65',
                strokeWidth: 2
            };
        }
        if (name == 'O') {
            var circle = new Path.Circle(pointsArray[position], new Size(blockSize / 3, blockSize / 3));
            circle.style = {
                strokeColor: '#705619',
                strokeWidth: 2
            };
        }
    };

    if (!idUser) StartGame();

    function StartGame() {
        let request = new XMLHttpRequest();
        request.open("POST", "/GetSessionId", true);
        request.setRequestHeader("Content-Type", "application/json");
        setTimeout(request.addEventListener("load", function () {
            idUser = JSON.parse(request.response);
            socket.emit('gameIsStart', { idGame: idGame });
            Message("Socket Emit gameIsStart", {idUser, idGame});
        }), 5000);
        request.send();
    }

    function NewGame(data) {
        Message("User New Game", data.map);
        if (data.map.winner == idUser) {
            $('.message').html("You win");
        } else {
            $('.message').html("You lose");
        }
        for (var i = 0; i < 9; i++) {
            lines.children[i].onClick = null;
        }
        $('#loading').css('visibility', 'visible');
        $('#loading').html(
            'Do you want to start a new game or exit? <br>' +
            '<form action="/createServer" method="get">' +
            '<input type = "submit" value = "New Game" />' +
            '</form >' +
            '<form action="/" method="get">' +
            '<input type = "submit" value = "Exit"/>' +
            '</form >'
        );
    }

    lines.style = {
        strokeColor: 'black',
        fillColor: '#F3F0D1',
        strokeWidth: 1
    };

        function GetTime() {
            var date = new Date();
            var h = addZero(date.getHours(), 2);
            var m = addZero(date.getMinutes(), 2);
            var s = addZero(date.getSeconds(), 2);
            var ms = addZero(date.getMilliseconds(), 3);
            time = h + ":" + m + ":" + s + ":" + ms;
        }
        function addZero(x, n) {
            while (x.toString().length < n) {
                x = "0" + x;
            }
            return x;
        }

        function Message(text, data) {
            GetTime();
            console.log({ text, time, data });        
        }
});



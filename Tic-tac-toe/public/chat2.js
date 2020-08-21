$(function () {
    var socket = io.connect();

    var urlSplit = window.location.href.split('/');
    var idGame = urlSplit[urlSplit.length - 1];
    var GameInfo, idUser;

    function StartGame() {
        let request = new XMLHttpRequest();
        request.open("POST", "/GetSessionId", true);
        request.setRequestHeader("Content-Type", "application/json");
        setTimeout(request.addEventListener("load", function () {
            idUser = JSON.parse(request.response);
            socket.emit('gameIsStart', { idGame: idGame });
        }), 5000);
        request.send();
    }

    if (!idUser) StartGame();

    paper.install(window);
    paper.setup("myCanvas");

    var blockSize = paper.view.size.width/ 3;
    var blockWidth = blockSize;
    var blockHeight = blockSize;
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
        loading.rotate(1);
    }

    var ClickRectangle = function (e) {
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

    lines.style = {
        strokeColor: 'black',
        fillColor: '#F3F0D1',
        strokeWidth: 1
    };

    //socket
    socket.on('update_Map_', data => {
        GameInfo = data.map;
        whichMove(data.map);
        UpdateMap(data);
        if (data.map.step == 9) {
            $('.message').html("No one has won");
            NewGame(data);
        }
    });

    socket.on('start_Map_', data => {
        GameInfo = data.map;
        UpdateMap(data);
        lines.visible = true; //grid
        loading.visible = false; //circle
        if (data.map.winner) {
            NewGame(data);
        } else {
            $('#loading').css('visibility', 'hidden'); //text
            $('.message').html("Game is started");
            setTimeout(whichMove, 1000, data.map);
        }
    });

    socket.on('finish_Map_', data => {
        GameInfo = data.map;
        UpdateMap(data);
        NewGame(data);
    });

    function NewGame(data) {
        console.log(data.map.winner);
        console.log(idUser);
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

    function UpdateMap(data) {
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
            cross.scale(blockWidth / 70, pointsArray[position])
            cross.rotate(45);
            cross.style = {
                strokeColor: '#CDAE65',
                strokeWidth: 2
            };
        }
        if (name == 'O') {
            var circle = new Path.Circle(pointsArray[position], new Size(blockWidth / 3, blockHeight / 3));
            circle.style = {
                strokeColor: '#705619',
                strokeWidth: 2
            };
        }
    };
});
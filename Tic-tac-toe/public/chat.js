$(function () {
	var socket = io.connect('http://localhost:3000');

	var send_mess = $("#messBut");
	var mess = $("#mess");
	var messangers = $("#messangers");

	console.log($("#hdnSession").data('value'));

	send_mess.click(function () {
		socket.emit('new_mess', { mess: mess.val()});
	});

	socket.on('add_mess', data => {
		messangers.append(data.mess);
	})

	$("#connectServer").click( function () {
	   $('.hidden').removeClass('hidden')
	});

	$('#input').keypress(function (e) {
	    if (e.keyCode === 13) {
	        window.location.href = '/game/' + $('#input').val();
	        return false;
	    }

	});
});
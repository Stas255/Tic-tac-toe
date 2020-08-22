$(function () {
	var socket = io.connect('http://localhost:3000');

	socket.on('clientMessage', message => {
		console.log(message);
	});

	$("#connectServer").click( function () {
	   $('.hidden').removeClass('hidden')
	});

	$('#input').keypress(function (e) {
	    if (e.keyCode === 13) {
	        window.location.href = '/game/' + $('#input').val();
	        return false;
		}
		return true;
	});
});
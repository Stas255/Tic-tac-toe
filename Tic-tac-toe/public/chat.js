$(function () {

	//var socket = io('ws://odz.tolstonozhenko.com.ua:3000', { transports: ['websocket'] });
	var socket = io();
	socket.on('connect', function () {
		console.log('connected!');
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
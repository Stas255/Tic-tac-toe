$(function () {
	var socket = io('ws://odz.tolstonozhenko.com.ua', { transports: ['websocket'] };

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
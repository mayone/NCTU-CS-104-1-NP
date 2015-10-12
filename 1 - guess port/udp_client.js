var host = process.argv[2] || '127.0.0.1';
var port = process.argv[3] || 5566;

var min_port = 3000;
var max_port = 60000;
var port_guess = (min_port + max_port) / 2;
var num_guesses = 0

var client = require('dgram').createSocket('udp4');
var request = {"guess" : port_guess};
var message = JSON.stringify(request);
var response = null;

client.bind(1111, '0.0.0.0');

client.on('listening', function () {
    var address = this.address();
    //console.log(address);
    console.log('#set up');
    console.log('UDP Client listening on ' + address.address + ":" + address.port);
});

client.send(message, 0, message.length, port, host, function(err) {
	console.log("#%d", ++num_guesses);
	console.log("send %s", message);
});

client.on('message', function (message, remote) {
	console.log("receive %s", message);
	response = JSON.parse(message).result;
	if (response == "larger") {
		min_port = port_guess + 1;
		port_guess = Math.floor((min_port + max_port) / 2);
		request = {"guess" : port_guess};
		message = JSON.stringify(request);

		client.send(message, 0, message.length, port, host, function (err) {
			console.log("#%d", ++num_guesses);
			console.log("send %s", message);
		});
	}
	else if (response == "smaller") {
		max_port = port_guess - 1;
		port_guess = Math.floor((min_port + max_port) / 2);
		request = {"guess" : port_guess};
		message = JSON.stringify(request);

		client.send(message, 0, message.length, port, host, function (err) {
			console.log("#%d", ++num_guesses);
			console.log("send %s", message);
		});
	}
	else if (response == "bingo!") {
		request = {"student_id" : "0116209"};
		message = JSON.stringify(request);

		client.send(message, 0, message.length, port_guess, host, function (err) {
			console.log("#%d", ++num_guesses);
			console.log("send %s", message);
		});
	}
	else {
		client.close();
	}
});
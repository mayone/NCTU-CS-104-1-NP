var host = process.argv[2] || '127.0.0.1';
var port = process.argv[3] || 5566;
var net = require('net');

var connected = false;
var gaming = false;
var displayBoard = false;
var displayMessage = false;
var completed = true;

var request = null;
var message = null;
var response = null;
var tileList = null;

var client = new net.Socket();

console.log('Welcome to Game 2048!');
console.log('enter \'help\' to get more information\n');

process.stdout.write('>');
process.stdin.on('data', function(input) {
	var command = input.toString().slice(0, -1);
	if (command == 'help') {
		console.log('Enter keyboard:\
					\n\'connect\' - connect to game server\
					\n\'disconnect\' - disconnect from game server\
					\n\'new\' - new a game round\
					\n\'end\' - close the game\
					\n\'w\' - move bricks up\
					\n\'s\' - move bricks down\
					\n\'a\' - move bricks left\
					\n\'d\' - move bricks right\
					\n\'u\' - undo the last move');
	}
	else if (connected) {
		if (command == 'disconnect') {
			console.log('disconnect from game server');
			client.destroy();
			connected = false;
			gaming = false;
		}
		else if (gaming) {
			if (command == 'new') {
				console.log('Have already in a game round');
			}
			else if (command == 'end') {
				console.log('The game has closed');
				request = {"action" : "End"};
				message = JSON.stringify(request);
				client.write(message);
				gaming = false;
			}
			else if (command == 'w') {
				request = {"action" : "moveUp"};
				message = JSON.stringify(request);
				client.write(message);
				displayBoard = true;
			}
			else if (command == 's') {
				request = {"action" : "moveDown"};
				message = JSON.stringify(request);
				client.write(message);
				displayBoard = true;
			}
			else if (command == 'a') {
				request = {"action" : "moveLeft"};
				message = JSON.stringify(request);
				client.write(message);
				displayBoard = true;
			}
			else if (command == 'd') {
				request = {"action" : "moveRight"};
				message = JSON.stringify(request);
				client.write(message);
				displayBoard = true;
			}
			else if (command == 'u') {
				request = {"action" : "unDo"};
				message = JSON.stringify(request);
				client.write(message);
				displayBoard = true;
			}
			else if (command == 'whosyourdaddy') {
				request = {"action" : "whosyourdaddy"};
				message = JSON.stringify(request);
				client.write(message);
				displayBoard = true;
			}
			else {
				console.log('wrong command');
			}
		}
		else {
			if (command == 'connect') {
				console.log('Have already connected to server');
			}
			else if (command == 'new') {
				request = {"action" : "New"};
				message = JSON.stringify(request);
				client.write(message);
				displayBoard = true;
				gaming = true;
			}
			else if (command == 'w' || command == 's' ||
					command == 'a' || command == 'd' || 
					command == 'u' || command == 'end')
			{
				console.log('Please new a game round first');
			}
			else {
				console.log('wrong command');
			}
		}
	}
	else {
		if (command == 'connect') {
			console.log('connect to game server');
			client.connect(port, host, function(err) {
				if (err) throw err;
			});
			connected = true;
		}
		else {
			console.log('Please connect to server first');
		}
	}

	if (!displayBoard) {
		if (gaming)
			process.stdout.write('move>');
		else
			process.stdout.write('>');
	}
});

process.stdin.on('end', function() {
	process.stdout.write('end');
});

client.on('data', function(message) {
	response = JSON.parse(message);
	if (response.status) {
		if (displayBoard) {
			tileList = response.message.split(',');
			console.log('---------------------');
			console.log('|%s|%s|%s|%s|', fixLen4(tileList[0]), fixLen4(tileList[1]), fixLen4(tileList[2]), fixLen4(tileList[3]));
			console.log('---------------------');
			console.log('|%s|%s|%s|%s|', fixLen4(tileList[4]), fixLen4(tileList[5]), fixLen4(tileList[6]), fixLen4(tileList[7]));
			console.log('---------------------');
			console.log('|%s|%s|%s|%s|', fixLen4(tileList[8]), fixLen4(tileList[9]), fixLen4(tileList[10]), fixLen4(tileList[11]));
			console.log('---------------------');
			console.log('|%s|%s|%s|%s|', fixLen4(tileList[12]), fixLen4(tileList[13]), fixLen4(tileList[14]), fixLen4(tileList[15]));
			console.log('---------------------');
			for(i = 0; i < tileList.length; i++) {
				if (parseInt(tileList[i]) == 2048) {
					console.log('Congrats! You win the game!');
					console.log('The game has closed');
					request = {"action" : "End"};
					message = JSON.stringify(request);
					client.write(message);
					gaming = false;
					break;
				}
			}
			if (gaming)
				process.stdout.write('move>');
			else
				process.stdout.write('>');
			displayBoard = false;
		}
	}
	else  {
		if (displayBoard) {
			console.log('not change');
			process.stdout.write('move>');
			displayBoard = false;
		}
		else {
			console.log(response.message);
		}
	}
});

var fixLen4 = function(str) {
	if (str == '0')
		return '    ';
	if (str.length == 4)
		return str;
	var indent = ' ';
	for(i = 1; i < 4-str.length; i++) {
		indent += ' ';
	}
	return indent + str;
}
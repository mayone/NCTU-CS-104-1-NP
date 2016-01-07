var host = process.argv[2] || '127.0.0.1';
var port = process.argv[3] || 5566;
var net = require('net');

var server = net.createServer();
var clients = [];

server.listen(port, host);
console.log("TCP server listening on " + host + ":" +port);

server.on('connection',  function(socket) {
	console.log("connect " + socket.remoteAddress + ":" + socket.remotePort + " " + Date());
	var client = {
		"registered" : false,
		"account_name" : "",
		"mail_address" : "",
		"mails" : []
	}
	clients.push(client);
	// catch data
	socket.on('data', function(message){
		// response object
		var response;
		try {
			// input error_check
			var message = message.toString().replace(/\'/g,'"').replace(/\;/g,' ').replace(/\0/g,' ');
			console.log("server receive: " + message.toString());
			
			// input parse
			var request = parse(message);
	
			// do action
			response = processCommand(client, request);
		}
		catch(e) {
			if (e == "exit") {
				response = "exit\n";
			}
			else {	
				console.log(e);
				response = e;
			}
		}
		// send response back
		socket.write(response);
	});
	//disconnection
	socket.on('end', function() {
		console.log("disconnect " + socket.remoteAddress + ":" + socket.remotePort + " " + Date());
	});
});

function processCommand(client, request) {
	var response = "";
	var command = request[0];

	// exit
	if (command == "exit") {
		var client_id = clients.indexOf(client);
		clients.splice(client_id, 1);	// args: index, howmany
		throw("exit");
	}
	// init
	else if (command == "init") {
		if (request[1] && request[1] == "-u") {
			if (request[2] && !request[3]) {
				var account_name = removeQuote(request[2]);
				if (!legalName(account_name)) {
					console.log(account_name);
					throw("args error\n");
				}
				if (!duplicateName(account_name)) {
					if (client.registered) {
						throw("args error\n");
					}
					client.registered = true;
					client.account_name = request[2];
					client.mail_address = account_name + "@nctu.edu.tw";
					response = client.mail_address + "\n";
				}
				else {
					response = "This account has been registered\n";
				}
			}
			else {
				throw("args error\n");
			}
		}
		else {
			throw("option error\n");
		}
	}
	// ls
	else if (command == "ls") {
		if (request[1] == "-u") {
			if (request[2]) {
				throw("args error\n");
			}
			var noAccount = true;
			response = "";
			for(var i = 0; i < clients.length; i++) {
				if (clients[i].registered == true) {
					response += clients[i].mail_address + "\n";
					noAccount = false;
				}
			}
			if (noAccount) {
				response = "no accounts\n";
			}
		}
		else if (request[1] == "-l") {
			if (request[2]) {
				throw("args error\n");
			}
			if (client.registered) {
				if (client.mails.length > 0) {
					response = "";
					for(var i = 0; i < client.mails.length; i++) {
						response += (i+1) + ". " + client.mails[i].title;
						if (!client.mails[i].read) {
							response += "(new)";
						}
						response += "\n";
					}
				}
				else {
					response = "no mail\n";
				}
			}
			else {
				response = "init first\n";
			}
		}
		else if (request[1] == "-a") {
			if (request[2]) {
				throw("args error\n");
			}
			if (client.registered) {
				response = "";
				response += "Account: " + client.account_name + "\n";
				response += "Mail address: " + client.mail_address + "\n";
				response += "Number of mails: " + client.mails.length + "\n";
			}
			else {
				response = "init first\n";
			}
		}
		else {
			throw("option error\n");
		}
	}
	// rm
	else if (command == "rm") {
		if (client.registered) {
			if (request[1] == "-d") {	// delete mail by index
				if (request[2] && isIndex(request[2])) {
					var id = parseInt(request[2])-1;
					if (id >= 0 && id < client.mails.length) {
						client.mails.splice(id, 1);
						response = "done\n";
					}
					else {
						throw("args error\n");
					}
				}
				else {
					throw("args error\n");
				}
			}
			else if (request[1] == "-D") {	// delete all mails
				while(client.mails.length > 0) {
					client.mails.pop();
				}
				response = "done\n";
			}
			else {
				throw("option error\n");
			}
		}
		else {
			response = "init first\n";
		}
	}
	// rd
	else if (command == "rd") {
		if (client.registered) {
			if (request[1] == "-r") {	// read mail by index
				if (request[2] && isIndex(request[2])) {
					var id = parseInt(request[2])-1;
					if (id >= 0 && id < client.mails.length) {
						var mail = client.mails[id];
						mail.read = true;
						response = "";
						response += "From: " + mail.sender + "\n";
						response += "To: " + mail.receiver + "\n";
						response += "Date: " + mail.date + "\n";
						response += "Title: " + mail.title + "\n";
						response += "Content: " + mail.content + "\n";
					}
					else {
						throw("args error\n");
					}
				}
				else {
					throw("args error\n");
				}
			}
			else {
				throw("option error\n");
			}
		}
		else {
			response = "init first\n";
		}
	}
	// wt
	else if (command == "wt") {
		if (client.registered) {
			var i = 1;
			var mail = {
				"sender" : client.mail_address,
				"receiver" : "",
				"date" : DateUTC(),
				"title" : "",
				"content" : "",
				"read" : false
			};
			var hasReceiver = false;
			var hasTitle = false;
			var hasContent = false;
			while(request[i]) {
				// check option
				var option = request[i++];
				if (option != '-d' && option != '-t' && option != '-c') {
					throw("option error\n");
				}
				// check argument
				if (!request[i]) {
					throw("args error\n");
				}
				var info = removeQuote(request[i++]);
				if (!legalMailInfo(info)) {
					throw("args error\n");
				}
				// add info to mail
				if (option == "-d" && !hasReceiver) {
					mail.receiver = info;
					hasReceiver = true;
				}
				else if (option == "-t" && !hasTitle) {
					mail.title = info;
					hasTitle = true;
				}
				else if (option == "-c" && !hasContent) {
					mail.content = info;
					hasContent = true;
				}
				else {	// redundant option
					throw("option error\n");
				}
			}
			if (hasReceiver && hasTitle && hasContent) {	// send mail
				var receiver_id = findReceiver(mail.receiver);
				if (receiver_id >= 0) {
					clients[receiver_id].mails.push(mail);
					response = "done\n";
				}
				else {
					throw("args error\n");
				}
			}
			else {
				throw("option error\n");
			}
		}
		else {
			response = "init first\n";
		}
	}
	// re
	else if (command == "re") {
		if (client.registered) {
			var i = 1;
			var mail = {
				"sender" : client.mail_address,
				"receiver" : "",
				"date" : DateUTC(),
				"title" : "",
				"content" : "",
				"read" : false
			};
			var mail_id;
			var hasContent = false;
			var hasMailIndex = false;
			while(request[i] && request[i+1]) {
				var option = request[i++];
				if (option == "-c" && !hasContent) {
					var content = removeQuote(request[i++]);
					if (!legalMailInfo(content)) {
						throw("args error\n");
					}
					mail.content = content;
					hasContent = true;
				}
				else if (option == "-n" && !hasMailIndex) {
					if (!isIndex(request[i])) {
						throw("args error\n");
					}
					mail_id = parseInt(request[i++])-1;
					if (mail_id > client.mails.length) {
						throw("args error\n");
					}
					hasMailIndex = true;
				}
				else {
					throw("option error\n");
				}
			}
			if (hasContent && hasMailIndex) {	// reply mail
				mail.receiver = client.mails[mail_id].sender;
				mail.content += "\n----\n";
				mail.content += "From: " + client.mails[mail_id].sender + "\n";
				mail.content += "To: " + client.mails[mail_id].receiver + "\n";
				mail.content += "Date: " + client.mails[mail_id].date + "\n";
				mail.content += "Title: " + client.mails[mail_id].title + "\n";
				mail.content += "Content: " + client.mails[mail_id].content;
				var receiver_id = findReceiver(mail.receiver);
				if (receiver_id >= 0) {

					mail.title = "re:" + client.mails[mail_id].title.replace("re:", '').replace("fwd:", '');
					clients[receiver_id].mails.push(mail);
					response = "done\n";
				}
				else {
					throw("args error\n");
				}
			}
			else {
				throw("option error\n");
			}
		}
		else {
			response = "init first\n";
		}
	}
	// fwd
	else if (command == "fwd") {
		if (client.registered) {
			var i = 1;
			var mail = {
				"sender" : client.mail_address,
				"receiver" : "",
				"date" : DateUTC(),
				"title" : "",
				"content" : "",
				"read" : false
			};
			var mail_id;
			var hasReceiver = false;
			var hasContent = false;
			var hasMailIndex = false;
			while(request[i] && request[i+1]) {
				var option = request[i++];
				if (option == "-d" && !hasReceiver) {
					var receiver = removeQuote(request[i++]);
					if (!legalMailInfo(receiver)) {
						throw("args error\n");
					}
					mail.receiver = receiver;
					hasReceiver = true;
				}
				else if (option == "-c" && !hasContent) {
					var content = removeQuote(request[i++]);
					if (!legalMailInfo(content)) {
						throw("args error\n");
					}
					mail.content = content;
					hasContent = true;
				}
				else if (option == "-n" && !hasMailIndex) {
					if (!isIndex(request[i])) {
						throw("args error\n");
					}
					mail_id = parseInt(request[i++])-1;
					if (mail_id > client.mails.length) {
						throw("args error\n");
					}
					hasMailIndex = true;
				}
				else {
					throw("option error\n");
				}
			}
			if (hasReceiver && hasContent && hasMailIndex) {	// send mail
				var receiver_id = findReceiver(mail.receiver);
				if (receiver_id >= 0) {
					mail.title = "fwd:" + client.mails[mail_id].title.replace("re:", '').replace("fwd:", '');
					mail.content += "\n----\n";
					mail.content += "From: " + client.mails[mail_id].sender + "\n";
					mail.content += "To: " + client.mails[mail_id].receiver + "\n";
					mail.content += "Date: " + client.mails[mail_id].date + "\n";
					mail.content += "Title: " + client.mails[mail_id].title + "\n";
					mail.content += "Content: " + client.mails[mail_id].content;
					clients[receiver_id].mails.push(mail);
					response = "done\n";
				}
				else {
					throw("args error\n");
				}
			}
			else {
				throw("option error\n");
			}
		}
		else {
			response = "init first\n";
		}
	}
	else {
		throw("command error\n")
	}

	return response;
}

// parse request into tokens
function parse(str) {
	trimmed = str.trim();						// remove whitespaces from both sides
	compact = trimmed.replace(/\s+/g, ' ');		// compact multiple whitespaces to one
	tokens = compact.split(' ');				// split into array of tokens

	for(var i = 0; i < tokens.length; i++) {	// join tokens with double quotation
		if (tokens[i][0] == '\"' && tokens[i][tokens[i].length-1] != '\"') {
			while(i+1 < tokens.length) {
				tokens[i] += " "+tokens[i+1];
				tokens.splice(i+1, 1);
				if (tokens[i][tokens[i].length-1] == '\"') {
					break;
				}
			}
		}
	}

	return tokens;
}

// check is the account name legal or not
function legalName(name) {
	var expected = name.match(/([a-zA-Z]|[0-9]|_|-)+/);
	return (expected[0].length == name.length);
}

// check is the account name duplicate or not
function duplicateName(name) {
	var duplicate = false;
	for(var i = 0; i < clients.length; i++) {
		if (clients[i].registered &&
			clients[i].account_name == name)
		{
			duplicate = true;
			break;
		}
	}

	return duplicate;
}

// remove double quotation of string
function removeQuote(str) {
	return str.replace(/\"/g, '');
}

// check can the string be an index or not
function isIndex(str) {
	var expected = str.match(/[0-9]+/);
	return (expected[0].length == str.length);
}

function legalMailInfo(info) {
	var expected = info.match(/([a-zA-Z]|[0-9]|_|-|:|.|@)+/);
	return (expected[0].length == info.length);
}

function findReceiver(mail_addr) {
	for(var i = 0; i < clients.length; i++) {
		if (clients[i].registered && clients[i].mail_address == mail_addr) {
			return i;
		}
	}

	return -1;	// receiver not found
}

function DateUTC() {
	return new Date().toISOString().
		replace(/T/, ' ').		// replace T with a space
		replace(/\..+/, '');	// delete the dot and everything after
}
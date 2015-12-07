var host = process.argv[2] || '127.0.0.1';
var port = process.argv[3] || 5566;
var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var accounts = [];
var cmd_buf = [];

server.bind(port, host);

server.on('listening', function () {
    var address = this.address();
    console.log('server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {
	//console.log(remote.address + ":" + remote.port +" "+Date());
	// process delayed commands
	cmd_buf.sort(function(a, b){return a.cycles-b.cycles});
	for(var i = 0; i < cmd_buf.length; i++) {
		console.log(cmd_buf[i]);
		if (--cmd_buf[i].cycles == 0) {
			if (cmd_buf[i].type == "add") {
				cmd_buf[i].dst_account.money += cmd_buf[i].money;
			}
			else if (cmd_buf[i].type == "clear") {
				for(var j = 0; j < accounts.length; j++) {
					accounts[j].money = 0;
				}
			}
		}
	}
	// pop executed commands
	while((cmd_buf.length > 0) && (cmd_buf[0].cycles == 0)) {
		cmd_buf.shift();
	}

	var response = {"message" : null};
	try {
		// input error_check
		var message = message.toString().replace(/\'/g,'"').replace(/\;/g,' ').replace(/\0/g,' ');
		console.log("server receive: "+message);
		// input parse
		var request = JSON.parse(message);
		// action
		if (request.action == "init") {
			var id_registered = false;
			for(var i = 0; i < accounts.length; i++) {
				if (accounts[i].account_id == request.account_id) {
					id_registered = true;
					break;
				}
			}
			if (id_registered)
				response.message = "account_id has been registered";
			else {
				accounts.push({
					"account_name" : request.account_name,
					"account_id" : request.account_id,
					"client_port" : remote.port,
					"money" : 0
				});
				response.message = "ok";
			}
		}
		else if (request.action == "save") {
			var save_success = false;
			for(var i = 0; i < accounts.length; i++) {
				if (accounts[i].client_port == remote.port) {
					if (request.money >= 0) {
						cmd_buf.push({
							"type" : "add",
							"cycles" : 2,
							"dst_account" : accounts[i],
							"money" : request.money
						});
						save_success = true;
					}
					break;
				}
			}
			if (save_success)
				response.message = "ok";
			else
				response.message = "invalid transaction";
		}
		else if (request.action == "withdraw") {
			var withdraw_success = false;
			for(var i = 0; i < accounts.length; i++) {
				if (accounts[i].client_port == remote.port) {
					if (accounts[i].money >= request.money) {
						accounts[i].money -= request.money;
						withdraw_success = true;
					}
					break;
				}
			}
			if (withdraw_success)
				response.message = "ok";
			else
				response.message = "invalid transaction";
		}
		else if (request.action == "remit") {
			var remit_success = false;
			for(var i = 0; i < accounts.length; i++) {
				if (accounts[i].client_port == remote.port) {						// sender found
					for(var j = 0; j < accounts.length; j++) {
						if (accounts[j].account_name == request.destination_name) {	// receiver found
							if (accounts[i].account_id != accounts[j].account_id) {	// not himself
								if (accounts[i].money >= request.money) {			// enough money
									accounts[i].money -= request.money;
									cmd_buf.push({
										"type" : "add",
										"cycles" : 3,
										"dst_account" : accounts[j],
										"money" : request.money
									});
									remit_success = true;
								}
							}
							break;
						}
					}
					break;
				}
			}
			if (remit_success)
				response.message = "ok";
			else
				response.message = "invalid transaction";
		}
		else if (request.action == "show") {
			var account_found = false;
			for(var i = 0; i < accounts.length; i++) {
				if (accounts[i].client_port == remote.port) {
					response.message = accounts[i].money;
					account_found = true;
					break;
				}
			}
			if (!account_found)
				response.message = "account not found";
		}
		else if (request.action == "bomb") {
			cmd_buf.push({
				"type" : "clear",
				"cycles" : 5,
			});
			response.message = "ok";
		}
		else if (request.action == "end") {
			accounts.splice(0, accounts.length)
			response.message = "end";
		}
	}
	catch(e) {
		console.log(e);
		response.message = "parse_error: "+e;
	}
	// send response
	message = JSON.stringify(response);
	console.log("server send back: "+message);
	this.send(message, 0, message.length, remote.port, remote.address, function(err) {
		if (err) throw err;
	});	
});
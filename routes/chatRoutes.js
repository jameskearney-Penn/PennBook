var chat_db = require('../models/chatsDatabase.js');
var user_db = require('../models/userDatabase.js');

/////////////////////////////////////////
///////// CHAT FUNCTIONS ////////////////
/////////////////////////////////////////

//get chat sends user to specifc chat. Will link to socket with roomId
var getChat = function(req, res) {
	var username = req.session.secret;
	var roomId = req.session.chat_id;
	var gname = req.session.gname;
	var chats = req.session.prev_chats || [];
	res.render('chat.ejs', {'user': username, 'room_id': roomId, 'groupName': gname, 'chats': chats});
};

//this route loads all current chat invites for a specific user
var chatInvite = function(req, res) {
	var username = req.session.secret;
	chat_db.get_invites(username, function(err, data){
		if (err) {
			var errorMessage = "Sorry, looks like we ran into an error loading chat invites.";
			//not sure where to redirect too....
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			console.log(data);
			res.render('chatInvite.ejs',  {'ongoing': data.ongoing_chats, 'user': username, 'invites': data.chat_invites, error: null});
		}
	});
}
// invite user to a new chat. This route will take current user to chat page, and send an invitation to the user being invited
var invite = function(req, res) {
	var username = req.session.secret;
	var invite = req.body.invite;
	user_db.username_lookup(invite, function(err, data){
		//console.log(data)
		if(err || data.Items.length == 0 || username == invite){
			chat_db.get_invites(username, function(err, data){
				var errorMessage = "Sorry, the username you inputted is invalid.";
				if (err) {
					res.render('mainpage.ejs', {'error': errorMessage});
				} else {
					res.render('chatInvite.ejs',  {'ongoing': data.ongoing_chats, 'user': username, 'invites': data.chat_invites, 'error': errorMessage});
				}
			});
		} else {
			chat_db.new_chat(username, invite, function(err, data){
				if (err || data.error) {
					chat_db.get_invites(username, function(err, data){
						var errorMessage = "Sorry, looks like we ran into an error creating your chat.";
						if (err) {
							res.render('mainpage.ejs', {'error': errorMessage});
						} else {
							res.render('chatInvite.ejs',  {'ongoing': data.ongoing_chats, 'user': username, 'invites': data.chat_invites, 'error': errorMessage});
						}
					});
				} else {
					req.session.prev_chats = [];
					req.session.chat_id = data.room_id;
					res.redirect('/chat');
				}
			});
		}
	});
}
//when leaving a chat, set room id to 0 in user table. Also send message saying user has left, 
//and remove from list of users in chats table
var leaveChat = function(req, res) {
	var username = req.session.secret;
	chat_db.leave_chat(username, function(err){
		if (err) {
			var errorMessage = "Sorry, looks like we ran into an error when leaving your chat.";
			//not sure where to redirect too....
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			req.session.chat_id = 0;
			chat_db.get_invites(username, function(err, data){
				if (err) {
					var errorMessage = "Sorry, looks like we ran into an error loading chat invites.";
					//not sure where to redirect too....
					res.render('mainpage.ejs', {'error': errorMessage});
				} else {
					console.log(data);
					res.render('chatInvite.ejs',  {'ongoing': data.ongoing_chats, 'user': username, 'invites': data.chat_invites, error: null});
				}
			});
		}
	});
}

var addChatMessage = function(req, res) {
	var content = req.body.content;
	var date = req.body.date;
	var room_id = req.session.chat_id;
	var username = req.session.secret;
	chat_db.add_chat_message(room_id, username, date, content, function(err) {
		if (err) {
			var errorMessage = "Sorry, looks like we ran into an error when adding your message.";
			//not sure where to redirect too....
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			console.log("added-chat: " + content + " by: " + username + " to room: " + room_id);
			res.redirect('/chat');
		}
	});
}


// join pre-existing chat
var joinChat = function(req, res) {
	var username = req.session.secret;
	var roomId = req.body.room_id;
	var gname = req.session.gname;
	chat_db.join_chat(username, roomId, function(err, data){
		if (err) {
			chat_db.get_invites(username, function(err, data){
				var errorMessage = "Sorry, looks like we ran into an error joining the chat.";
				if (err) {
					res.render('mainpage.ejs', {'error': errorMessage});
				} else {
					res.render('chatInvite.ejs',  {'ongoing': data.ongoing_chats, 'user': username, 'invites': data.chat_invites, 'error': errorMessage});
				}
			});
		} else {
			var chats = [];
			chat_db.get_chat_messages(roomId, function(err, data){
				if (err) {
					var errorMessage = "Error getting chat messages";
					res.render('mainpage.ejs', {'error': errorMessage});
				} else {
					JSON.parse(data.messages).Item.messages.L.forEach(function(chat){
						chat.M.Timestamp = Date.parse(chat.M.Timestamp.S)
						chat.M.Content = chat.M.Content.S
						chat.M.Creator = chat.M.Creator.S
						chats.push(chat.M);
					});
					req.session.chat_id = roomId;
					req.session.prev_chats = chats;
					res.redirect('/chat');
				}
			});
		}
	});
}

var addMember = function(req, res) {
	var username = req.session.secret;
	var id = req.session.chat_id;
	var invite = req.body.invite;
	var name = req.body.gname;
	console.log(name);
	user_db.username_lookup(invite, function(err, data){
		//console.log(data)
		if(err || data.Items.length == 0 || username == invite){
			chat_db.get_invites(username, function(err, data){
				var errorMessage = "Sorry, there was an error!.";
				if (err) {
					res.render('mainpage.ejs', {'error': errorMessage});
				} else {
					var chats = [];
					chat_db.get_chat_messages(id, function(err, data){
						if (err) {
							var errorMessage = "Error getting chat messages!";
							res.render('mainpage.ejs', {'error': errorMessage});
						} else {
							JSON.parse(data.messages).Item.messages.L.forEach(function(chat){
								chat.M.Timestamp = Date.parse(chat.M.Timestamp.S)
								chat.M.Content = chat.M.Content.S
								chat.M.Creator = chat.M.Creator.S
								chats.push(chat.M);
							});
							req.session.chat_id = id;
							req.session.prev_chats = chats;
							res.redirect('/chat');
						}
					});
				}
			});
		} else {
			chat_db.add_member(id, invite, function(err){
				if (err) {
					var errorMessage = "Error adding group member.";
					res.render('mainpage.ejs', {'error': errorMessage});
				} else {
					var chats = [];
					chat_db.get_chat_messages(id, function(err, data){
						if (err) {
							var errorMessage = "Error getting chat messages";
							res.render('mainpage.ejs', {'error': errorMessage});
						} else {
							JSON.parse(data.messages).Item.messages.L.forEach(function(chat){
								chat.M.Timestamp = Date.parse(chat.M.Timestamp.S)
								chat.M.Content = chat.M.Content.S
								chat.M.Creator = chat.M.Creator.S
								chats.push(chat.M);
							});
							req.session.chat_id = id;
							req.session.prev_chats = chats;
							res.redirect('/chat');
						}
					});
				}
			});
		}
	});
}

var rejectInvite = function(req, res) {
	var username = req.session.secret;
	var room_id = req.body.room_id
	chat_db.reject_invite(username, room_id, function(err){
		if (err) {
			var errorMessage = "Error rejecting invite.";
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			chat_db.get_invites(username, function(err, data){
				if (err) {
					var errorMessage = "Sorry, looks like we ran into an error rejecting chat invites.";
					//not sure where to redirect too....
					res.render('mainpage.ejs', {'error': errorMessage});
				} else {
					console.log(data);
					res.render('chatInvite.ejs',  {'ongoing': data.ongoing_chats, 'user': username, 'invites': data.chat_invites, error: null});
				}
			});
			
		}
	});
}

var removeChat = function(req, res) {
	var username = req.session.secret;
	var room_id = req.body.room_id
	chat_db.remove_chat(username, room_id, function(err){
		if (err) {
			var errorMessage = "Error removing from chat.";
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			chat_db.get_invites(username, function(err, data){
				if (err) {
					var errorMessage = "Sorry, looks like we ran into an error removing chat invites.";
					//not sure where to redirect too....
					res.render('mainpage.ejs', {'error': errorMessage});
				} else {
					console.log(data);
					res.render('chatInvite.ejs',  {'ongoing': data.ongoing_chats, 'user': username, 'invites': data.chat_invites, error: null});
				}
			});
			
		}
	});
}


var routes = { 
  get_chat: getChat, 
  chat_invite: chatInvite,
  invite: invite,
  leave_chat: leaveChat,
  add_chat_message: addChatMessage,
  join_chat: joinChat,
  add_member: addMember,
  reject_invite: rejectInvite,
  remove_chat: removeChat, 
};

module.exports = routes;



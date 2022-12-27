var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var db = new AWS.DynamoDB();
var crypto = require('crypto');
/////////////////////////////////////////
/////////CHAT FUNCTIONS/////////////////
/////////////////////////////////////////

//create a new chat between user and invite from view friends page
var newChat = function(username, invite, callback){
	//console.log("creating new chat with host: " + username);
	//console.log("inviting: " + invite);
	
	//get count for chat id/ room id
	var params1 = {
      	Key: {'room_id': {N: "0"}},
      	TableName: "chats",
	};
	//get count to get new chat id value
	db.getItem(params1, function(err, data) {
		//if error getting count value, callbck(err)
	    if (err || data.Item == null) {
			console.log("Error getting count value in chats table, getItem: " + err);	
			callback(err, {'error': true});
	    //else, add chat id to chat table using count value + 1
	    } else {
			var count = parseInt(data.Item.countVal.N) + 1;
			var countString = count.toString();
	      	var params = {
				Item: {
					'users': {SS: [username, invite, 'pennBook']},
					'messages': {L: []},
					'room_id': {N: countString} ,
			  	},
			  	TableName: "chats",
	 		};
	 		//Add chat to chat table, if successful update chat count, if not successful callback error
		  	db.putItem(params, function(err, data) {
				//if error putting post into table, callback(err)
		    	if (err) {
			  		//log error if it occurs
			  		console.log("Error adding chat to chat table in putItem: " + err);
		      		callback(err, {'error': true});
		      	//else, update count row value
		    	} else {
					var params2 = {
						Item: {
							'room_id': {N: "0"} ,
							"countVal": {N: countString}
				  		},
				  			TableName: "chats",
						
					};
					//add new count row value, if successful add room_id to invitee chat invite list
					db.putItem(params2, function(err, data){
						//if error callback(err)
						if (err) {
							console.log("Error updating chat count value in putItem: " + err);
							callback(err, {});
						//else, add room_id to invite list
						} else {
							var params3 = {
								TableName: "users", 
								Key: {"username": {'S':invite}}, 
							}
							db.getItem(params3, function(err, data){
								if (err || data.Item == undefined) {
									console.log("Error getting invite list value in getItem users: " + err);
									callback(err, {'error': true});
								} else {
									if (data.Item.userStatus.N == 0) {
										callback(err, {'error': true, 'message': "Error: Cannot add inactive user to chat."});
									} else {
										var inviteL = (data.Item.chat_invites.NS)
										var newList = []
										inviteL.forEach(function(num){
											newList.push(num);
										});
										newList.push(countString);
										
										var params4 = {
											TableName: "users", 
											Item: {
												"username": {'S': invite}, 
												"affiliation": data.Item.affiliation, 
												"birthday": data.Item.birthday, 
												"email_address": data.Item.email_address, 
												"first_name": data.Item.first_name, 
												"friends": data.Item.friends, 
												"last_name": data.Item.last_name, 
												"news_interests": data.Item.news_interests, 
												"password": data.Item.password, 
												"wall": data.Item.wall, 
												"ongoing_chats": data.Item.ongoing_chats,
												"chat_invites": {'NS': newList}, 
												"room_id": data.Item.room_id,
												'userStatus': data.Item.userStatus,
											}
										}
										//add chat invite to list, if successful add chat id to user room id
										db.putItem(params4, function(err, data){
											if (err) {
												console.log("Error updating chat invite list value in putItem users: " + err);
												callback(err, {'error': true});
											} else {
												var params6 = {
													TableName: "users", 
													Key: {"username": {'S':username}}, 
												}
												//add chat id to user room id and add chat id to invite list
												db.getItem(params6, function(err, data){
													if (err) {
														console.log("Error updating chat room id value in getItem users: " + err);
														callback(err, {'error': true});
													} else {
														console.log(data.Item)
														var inviteL = (data.Item.ongoing_chats.NS)
														var newList = []
														inviteL.forEach(function(num){
															newList.push(num);
														})
														newList.push(countString);
														console.log(username);
														console.log(newList);
														var params5 = {
															TableName: "users", 
															Item: {
																"username": {'S': username}, 
																"affiliation": data.Item.affiliation, 
																"birthday": data.Item.birthday, 
																"email_address": data.Item.email_address, 
																"first_name": data.Item.first_name, 
																"friends": data.Item.friends, 
																"last_name": data.Item.last_name, 
																"news_interests": data.Item.news_interests, 
																"password": data.Item.password, 
																"wall": data.Item.wall, 
																"ongoing_chats": {'NS': newList},
																"chat_invites": data.Item.chat_invites, 
																"room_id": {'N': countString},
																'userStatus': data.Item.userStatus,
															}
														
														}
														db.putItem(params5, function(err, data){
															if (err) {
																console.log("Error changing room id for user in user table" + err);
																callback(err, {'error': true});
															} else {
																console.log("Success! New chat created!!");
																callback(err, {'room_id': countString, 'error': false});
															}
														})
													}
												});
												
											}
										});
										
									}
									
								}
							});
						}
					});
		    	}
		  	});
		}
	 });
}

// TODO I think we can remove this, the same thing is in userDB.js
var changeStatus = function(username, newStatus, callback) {
  	console.log('Changing ' + username + '\'s status'); 

	var newStatusVal;
	if (newStatus === "inactive") {
		newStatusVal = "0";
	} else {
		//newStatusVal = "1";
		newStatusVal = new Date();
    	newStatusVal = newStatusVal.toISOString();
	} 
	
      
	// update the database for the user's status
  	const eparams = {
		TableName : "users", 
		Key: {
			"username": {"S" : username} 
		},
		ExpressionAttributeNames: {"#currStatus" : "userStatus"},
		UpdateExpression: "SET #currStatus = :newStat", // set the status to active
		ExpressionAttributeValues: {
			":newStat": {"S": newStatusVal},
		},
	}; 
	db.updateItem(eparams, function(err, data) {
	    if (err) {
			//log error if it occurs
			console.log("Ran into an error checking status" + err);
		    callback(err, {});
		} else {
			console.log("Updated status successfully");
			callback(err, data); 
		}
	});	 
}  

//get all chat invites for a specific user
var getInvites = function(username, callback){
	var params = {
		TableName: 'users', 
		Key: {"username": {"S" : username}},
	};
	//get chat ids
	db.getItem(params, function(err, data){
		if(err) {
			console.log("Error retrieving chat invite ids: " +  err);
			callback(err, {});
		} else {
			//console.log(data);
			callback(err, {'chat_invites': data.Item.chat_invites.NS, 'gname': null, 'ongoing_chats': data.Item.ongoing_chats.NS});
		}
	});
}
//get all ongoing chats
var getChats = function(username, callback){
	var params = {
		TableName: 'users', 
		Key: {"username": {"S" : username}},
	};
	//get chat ids
	db.getItem(params, function(err, data){
		if(err) {
			console.log("Error retrieving chat invite ids: " +  err);
			callback(err, {});
		} else {
			//console.log(data);
			callback(err, {'chat_invites': data.Item.chat_invites.NS, 'ongoing_chats': data.Item.ongoing_chats.NS, 'gname': null});
		}
	});
}
//when user logs out or signs invites should be set to default.
var resetInvite = function(username, callback) {
	var params = {
		TableName: 'users', 
		Key: {'username': {"S" : username}},
	}
	//get user in user table, if successful, reset chat invite set
	db.getItem(params, function(err, data){
		if (err) {
			console.log("Error fetching user information in user table to reset chat invites: " + err);
			callback(err);
		} else {
			var params2 = {
				TableName: "users", 
				Item: {
					"username": {'S': username}, 
					"affiliation": data.Item.affiliation, 
					"birthday": data.Item.birthday, 
					"email_address": data.Item.email_address, 
					"first_name": data.Item.first_name, 
					"friends": data.Item.friends, 
					"last_name": data.Item.last_name, 
					"news_interests": data.Item.news_interests, 
					"password": data.Item.password, 
					"wall": data.Item.wall,
					"ongoing_chats": data.Item.ongoing_chats,
					"chat_invites": {'NS':['0']}, 
					"room_id": {'N': '0'},
					'userStatus': data.Item.userStatus,
				}
			}
			db.putItem(params2, function(err, data){
				if (err) {
					console.log("Error reseting chat invites in putItem: " + err);
					callback(err);
				} else {
					callback(err);
				}
			})
		}
	});
}

//when user leaves chat, room_id should be set to 0 and should be removed from list of group members
var leaveChat = function(username, callback) {
	var params = {
		TableName: 'users', 
		Key: {'username': {"S" : username}},
	}
	//get user in user table, if successful, reset room id 
	db.getItem(params, function(err, data){
		if (err) {
			console.log("Error fetching user information in user table to leave chat: " + err);
			callback(err);
		} else {
			var room_id = data.Item.room_id.N;
			var params2 = {
				TableName: "users", 
				Item: {
					"username": {'S': username}, 
					"affiliation": data.Item.affiliation, 
					"birthday": data.Item.birthday, 
					"email_address": data.Item.email_address, 
					"first_name": data.Item.first_name, 
					"friends": data.Item.friends, 
					"last_name": data.Item.last_name, 
					"news_interests": data.Item.news_interests, 
					"password": data.Item.password, 
					"wall": data.Item.wall,
					"ongoing_chats": data.Item.ongoing_chats,
					"chat_invites": data.Item.chat_invites, 
					"room_id": {'N': '0'},
					'userStatus': data.Item.userStatus,
				}
			}
			db.putItem(params2, function(err, data){
				if (err) {
					console.log("Error reseting room id in putItem: " + err);
					callback(err);
				} else {
					//delete user from users in chat table
					var params1 = {
				      	Key: {'room_id': {N: room_id}},
				      	TableName: "chats",
					};
					//get row of room_id in chat table
					db.getItem(params1, function(err, data) {
						//if error getting count value, callbck(err)
					    if (err || data.Item == null) {
							console.log("Error getting chat in chats table, getItem: " + err);	
							callback(err);
					    //else, delete user from users in chat
					    } else {
							
							var users = data.Item.users.SS;
							var newList = [];
							users.forEach(function(u){
								if(u != username) {
									newList.push(u);
								}
							});
							
					      	var params3 = {
								Item: {
									'users': {SS: newList},
									'messages': data.Item.messages,
									'room_id': data.Item.room_id,
									'room_name': data.Item.room_name,
							  	},
							  	TableName: "chats",
					 		};
					 		db.putItem(params3, function(err){
								if(err) {
									console.log("Error reseting users in chat in chats table, putItem: " + err);	
									callback(err);
								} else {
									callback(err);
								}
							});
					 		
						}
					});
				}	
			});
		}
	});
}
//when a user leaves a chat, chat persists into ongoing_chats
var removeFromChat = function(username, room_id, callback) {
	var params1 = {
		Key: {'room_id': {N: room_id}},
		TableName: "chats",
	};
	db.getItem(params1, function(err, data) {
		//if error getting count value, callback(err)
		if (err || data == null || data.Item ==null) {
			//console.log(data.Item)
			console.log("Error getting chat in chats table, getItem: " + err);	
			callback(err);
			//else, delete user from users in chat
		} else {
			var users = data.Item.users.SS;
			var newList = [];
			users.forEach(function(u){
				if(u != username) {
					newList.push(u);
				}
			});
			var params3 = {
				Item: {
					'users': {SS: newList},
					'messages': data.Item.messages,
					'room_id': data.Item.room_id,
					'room_name': data.Item.room_name,
				},
				TableName: "chats",
			};
			var roomId = data.Item.room_id;
			db.putItem(params3, function(err){
				if(err) {
					console.log("Error reseting users in chat in chats table, putItem: " + err);	
					callback(err);
				} else {
					var params4 = {
						Key:{'username': {S: username}}, 
						TableName: 'users'
					}
					//get user data to redo ongoing chat
					db.getItem(params4, function(err, data){
						if (err) {
							console.log("ERRROR " + err );
							callback(err)
						} else {
							var ids = data.Item.ongoing_chats.NS;
							var newList = [];
							var seen = false;
							ids.forEach(function(u){
								if (u == roomId.N) {
									seen = true
								}
								newList.push(u);
							});
							if (!seen) {
								newList.push(roomId.N);
							}
							
							var params2 = {
								TableName: "users", 
								Item: {
									"username": data.Item.username, 
									"affiliation": data.Item.affiliation, 
									"birthday": data.Item.birthday, 
									"email_address": data.Item.email_address, 
									"first_name": data.Item.first_name, 
									"friends": data.Item.friends, 
									"last_name": data.Item.last_name, 
									"news_interests": data.Item.news_interests, 
									"password": data.Item.password, 
									"wall": data.Item.wall,
									"chat_invites": data.Item.chat_invites, 
									"room_id": {'N': '0'},
									'userStatus': data.Item.userStatus,
									'ongoing_chats': {'NS': newList}
								}
							}
							
						}
						db.putItem(params2, function(err){
							if (err) {
								console.log("Error resetting room id and ongoing chats in user db: " + err);
								callback(err);
							} else {
								callback(err);
							}
						});
					});
				
				}
			});
					 		
		}
	});
}
//when users join a chat, room_id in users table should be changed
// and they should be added to the set of users in chats table
var joinChat = function(username, room_id, callback) {
	var params = {
		TableName: 'users', 
		Key: {'username': {"S" : username}},
	}
	//get user in user table, if successful, reset room id 
	db.getItem(params, function(err, data){
		if (err) {
			console.log("Error fetching user information in user table to join chat: " + err);
			callback(err, {});
		} else {
			var inviteL = (data.Item.chat_invites.NS);
			var newList = [];
			inviteL.forEach(function(num){
				if (num != room_id) {
					newList.push(num);
				}
				
			});
			var id = (data.Item.ongoing_chats.NS);
			var ongoingList = [];
			id.forEach(function(num){
				if (num != room_id) {
					ongoingList.push(num);
				}
			});
			ongoingList.push(room_id);
			
			
			var params2 = {
				TableName: "users", 
				Item: {
					"username": {'S': username}, 
					"affiliation": data.Item.affiliation, 
					"birthday": data.Item.birthday, 
					"email_address": data.Item.email_address, 
					"first_name": data.Item.first_name, 
					"friends": data.Item.friends, 
					"last_name": data.Item.last_name, 
					"news_interests": data.Item.news_interests, 
					"password": data.Item.password, 
					"wall": data.Item.wall,
					"chat_invites": {'NS': newList},
					"ongoing_chats": {'NS': ongoingList},
					"room_id": {'N': room_id},
					'userStatus': data.Item.userStatus,
				}
			}
			db.putItem(params2, function(err){
				if (err) {
					console.log("Error updating room id in putItem: " + err);
					callback(err, {});
				} else {
					//add user from users in chat table
					var params1 = {
				      	Key: {'room_id': {N: room_id}},
				      	TableName: "chats",
					};
					//get row of room_id in chat table
					db.getItem(params1, function(err, data) {
						//if error getting count value, callbck(err)
					    if (err || data.Item == null) {
							console.log("Error getting chat in chats table, getItem: " + err);	
							callback(err, {});
					    //else, add user from users in chat
					    } else {
							var users = data.Item.users.SS;
							var newList = [];
							users.forEach(function(u){
								if(u != username) {
									newList.push(u);
								}
							})
							newList.push(username);
					      	var params3 = {
								Item: {
									'users': {SS: newList},
									'messages': data.Item.messages,
									'room_id': data.Item.room_id,
									'room_name': data.Item.room_name,
							  	},
							  	TableName: "chats",
					 		};
					 		db.putItem(params3, function(err){
								if(err) {
									console.log("Error adding user in chat in chats table, putItem: " + err);	
									callback(err, {});
								} else {
									callback(err, {room_name: data.Item.room_name});
								}
							});
					 		
						}
					});
				}	
			});
		}
	});
}
//inivte member to join pre-existing chat
var addMember = function(id, invite, callback){
	var params = {
		TableName: 'users', 
		Key: {'username': {"S" : invite}},
	}
	//get user
	db.getItem(params, function(err, data){
		if (err) {
			console.log("Error inviting friend to chat: " + err);
			callback(err);
		} else {
			var userStatus = data.Item.userStatus.N
			if (userStatus == 0) {
				console.log("Error: user is not online.");
				callback(err)
			} else {
				var inviteL = (data.Item.chat_invites.NS);
				var newList = [];
				var seen = false;
				inviteL.forEach(function(num){
					if (num == id) {
						seen = true;
					}
					newList.push(num);
				})
				if (!seen) {
					newList.push(id);
				}		
				var params2 = {
					TableName: "users", 
					Item: {
						"username": {'S': invite}, 
						"affiliation": data.Item.affiliation, 
						"birthday": data.Item.birthday, 
						"email_address": data.Item.email_address, 
						"first_name": data.Item.first_name, 
						"friends": data.Item.friends, 
						"last_name": data.Item.last_name, 
						"news_interests": data.Item.news_interests, 
						"password": data.Item.password, 
						"wall": data.Item.wall,
						"ongoing_chats": data.Item.ongoing_chats,
						"chat_invites": {'NS': newList}, 
						"room_id": data.Item.room_id,
						'userStatus': data.Item.userStatus,
					}
				}
				db.putItem(params2, function(err){
					if (err) {
						console.log("Error, updating invite list for invited user");
						callback(err);
					} else {
						callback(err);
					}
				});
				
			}
		}
	})
}


var changeName = function(id, name, callback) {
	console.log("change name:")
	console.log(name);
	var params = {
		Key: {'room_id': {N: id}},
		TableName: "chats",
	}
	db.getItem(params, function(err, data){
		if (err) {
			console.log("Error getting chat from chat table");
			callback(err)
		} else {
			var params2 = {
				Item: {
					'users': data.Item.users,
					'messages': data.Item.messages,
					'room_id': data.Item.room_id,
					'room_name': {S: name},
				},
				TableName: "chats",
			}
			db.putItem(params2, function(err){
				if (err) {
					console.log("Error putting chat into chat table");
					callback(err);
				} else {
					callback(err);
				}
			})
		}
	});
}

var addChatMessage = function(room_id, username, date, content, callback) {
	console.log("Add message to room: " + room_id);
	var params = {
		Key: {'room_id': {N: room_id}},
		TableName: "chats",
	}
	db.getItem(params, function(err, data){
		if (err) {
			console.log("Error getting chat from chat table");
			callback(err)
		} else {;
			var newMessages = data.Item.messages;
			
			newMessages.L.push({'M': {'Timestamp':{'S': date}, 'Content':{'S': content}, 'Creator':{'S': username}}});
			var params2 = {
				Item: {
					'users': data.Item.users,
					'messages': newMessages,
					'room_id': data.Item.room_id,
					'room_name': data.Item.room_name,
				},
				TableName: "chats",
			}
			db.putItem(params2, function(err){
				if (err) {
					console.log("Error putting chat message into chat table");
					console.log(err);
					callback(err);
				} else {
					callback(err);
				}
			})
		}
	});
}

var getChatMessages = function(room_id, callback) {
	console.log("Add message to room: " + room_id);
	var params = {
		Key: {'room_id': {N: room_id}},
		TableName: "chats",
	}
	db.getItem(params, function(err, data){
		if (err) {
			console.log("Error getting messages from chat table");
			callback(err)
		} else {
			console.log('here')
			console.log(data)
			callback(err, {'messages': JSON.stringify(data)});
		}
	});
}
//rejects invite
var rejectInvite = function(username, room_id, callback) {
	console.log("username: " + username)
	console.log("room_id: " + room_id)
	var params = {
		Key: {'username': {'S': username}}, 
		TableName: 'users'
	}
	db.getItem(params, function(err, data){
		if (err) {
			console.log("Error rejecting invite: "+ err);
		} else {
			var newList = [];
			var ids = data.Item.chat_invites.NS;
			ids.forEach(function(num){
				if (num != room_id) {
					newList.push(num);
				}
			});
			var params2 = {
				TableName: "users", 
				Item: {
					"username": {'S': username}, 
					"affiliation": data.Item.affiliation, 
					"birthday": data.Item.birthday, 
					"email_address": data.Item.email_address, 
					"first_name": data.Item.first_name, 
					"friends": data.Item.friends, 
					"last_name": data.Item.last_name, 
					"news_interests": data.Item.news_interests, 
					"password": data.Item.password, 
					"wall": data.Item.wall,
					"chat_invites": {'NS': newList},
					"ongoing_chats": data.Item.ongoing_chats,
					"room_id": data.Item.room_id,
					'userStatus': data.Item.userStatus,
				}
			}
			db.putItem(params2, function(err){
				if (err) {
					console.log("Error rejecting invite databases: " + err);
					callback(err);
				} else {
					console.log("Successfully rejected invite");
					callback(err);
				}
			});
		}
	})
}
//remove user from a chat perminantly
var removeChat = function(username, room_id, callback) {
	console.log("username: " + username)
	console.log("room_id: " + room_id)
	var params = {
		Key: {'username': {'S': username}}, 
		TableName: 'users'
	}
	db.getItem(params, function(err, data){
		if (err) {
			console.log("Error rejecting invite: "+ err);
		} else {
			var newList = [];
			var ids = data.Item.ongoing_chats.NS;
			ids.forEach(function(num){
				if (num != room_id) {
					newList.push(num);
				}
			});
			var params2 = {
				TableName: "users", 
				Item: {
					"username": {'S': username}, 
					"affiliation": data.Item.affiliation, 
					"birthday": data.Item.birthday, 
					"email_address": data.Item.email_address, 
					"first_name": data.Item.first_name, 
					"friends": data.Item.friends, 
					"last_name": data.Item.last_name, 
					"news_interests": data.Item.news_interests, 
					"password": data.Item.password, 
					"wall": data.Item.wall,
					"chat_invites": data.Item.chat_invites,
					"ongoing_chats": {'NS': newList},
					"room_id": data.Item.room_id,
					'userStatus': data.Item.userStatus,
				}
			}
			db.putItem(params2, function(err){
				if (err) {
					console.log("Error removing chat databases: " + err);
					callback(err);
				} else {
					console.log("Successfully removed from chat");
					callback(err);
				}
			});
		}
	})
}



var database = { 
    user_status_change: changeStatus,
    new_chat: newChat,
    add_chat_message: addChatMessage,
	get_chat_messages: getChatMessages,
    get_invites: getInvites,
    reset_invite: resetInvite,
    leave_chat: leaveChat,
    join_chat: joinChat,
    force_remove: removeFromChat,
    add_member: addMember,
    get_chats: getChats,
    reject_invite: rejectInvite, 
    leave_chat: leaveChat,
    remove_chat: removeChat,
    
};

module.exports = database;
                            
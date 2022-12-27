var user_db = require('../models/userDatabase.js');
var chat_db = require('../models/chatsDatabase.js');
var post_db = require('../models/postDatabase.js');
var crypto = require('crypto');

var getMain = function(req, res) {
    var currUser = req.session.secret;
    if (currUser != null && currUser != 'null') {
		user_db.get_main(currUser, function(err, data) {
			//If err or lookup error send error back to main
			if(err || currUser == undefined) {
				//redirect back to main with an error
				var errorMessage = "Looks like we had an issue loading in your newsfeed";
				res.render('userprofile.ejs', {'error': errorMessage});
			} else {
				user_db.user_status_change(currUser, "active", function(err, data2) {
					//If err or lookup error send error back to main
					if(err) {
						var errorMessage = "Looks like we ran into an error updating your status, you may be logged out soon";
						res.render('/', {'error': errorMessage});
					} else {
						//console.log(newsRec);
						var newsArr = [];
						for (y in data) {
							for (let x = 0; x < data[y].Items.length; x++) {
								newsArr.push(data[y].Items[x]);
							}
						}
						newsArr.sort(function(a, b) {
							return b.date.S - a.date.S;
						});
						
						console.log("HERS I THE DATA NOW: **** " + data);
						res.render('homepage.ejs', {'user': currUser, 'results': newsArr, 'error': null});
					}
				});
			}
		});
	    
    } else {
	    res.render('mainpage.ejs', {'error': null});
    }
};

/////////////////////////////////////////
///////////USER FUNCTIONS////////////////
/////////////////////////////////////////

//My functions from HW4. Keep them or delete them if you want - Jake 
var checkLogin = function(req, res) {
	//get username and password from frontend
	var username = req.body.username;
	var password = crypto.createHash('sha256').update(req.body.password).digest('hex');
	//var password = req.body.password;
	//Check the table for the username using user_db function 
	user_db.username_lookup(username, function(err, data) {
		//If err or lookup error send error back to main
		if(err || data.Items[0] === undefined || username === undefined || password === undefined) {
			//redirect back to main with an error
			var errorMessage = "Looks like we had an issue accessing the database.";
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			//Otherwise Check password and send user to restaruants page
			if(data.Items[0].password.S === password) {
				req.session.secret = data.Items[0].username.S;
				user_db.user_status_change(req.session.secret, "active", function(err, data) {
					//If err or lookup error send error back to main
					if(err) {
						//redirect back to main with an error
						var errorMessage = "Sorry, looks like we ran into an error logging you in, try again";
						res.render('mainpage.ejs', {'error': errorMessage});
					} else {
						res.redirect('/'); // success!
					}
				});
			} else {
				//If incorrect password send error to main
				var errorMessage = "Sorry, you entered the incorrect password.";
				res.render('mainpage.ejs', {'error': errorMessage});
			}
		}
	});
};

var signUp = function(req, res) {
	//Routes to signup page
	res.render('signup.ejs', {'error': null});
};

var logout = function(req, res) {
	var username = req.session.secret;
	var id = req.session.chat_id;
	//Routes to main page and removes the user from the session secret and resets chat invites and room id to default.
	chat_db.user_status_change(req.session.secret, "inactive", function(err, data) {
		//If err or lookup error send error back to main
		if(err) {
			//redirect back to main with an error
			var errorMessage = "Sorry, looks like we ran into an error logging you out, try again";
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			req.session.secret = 'null';
			if (id != 0) {
				console.log('HERE force removing')
				chat_db.force_remove(username, id, function(err){
					if(err){
						console.log("erreor force removing")
						var errorMessage = "Sorry, looks like we ran into an error resetting the chat function.";
						//not sure where to redirect too....
						res.render('mainpage.ejs', {'error': errorMessage});
					} else {
						console.log("no error force removing")
						req.session.chat_id = 0;
						req.session.secret = 'null';
						res.redirect('/');
					}
				});
			} else {
				res.redirect('/');
			}
		}
	});
};

var createAccount = function(req, res) {
	//get username and password from frontend
	var first = req.body.first_name;
	var last = req.body.last_name;
	var username = req.body.username;
	var password = req.body.password;
	var affiliation = req.body.affiliation; 
	var birthday = req.body.birthday; 
	var email = req.body.email_address;
	var politics = req.body.politics_check;
	var travel = req.body.travel_check;
	var business = req.body.business_check;
	var sports = req.body.sports_check;
	var entertainment = req.body.entertainment_check;
	var wellness = req.body.wellness_check;
	var news_arr = [politics, travel, business, sports, entertainment, wellness];
	var news = [];
	//var friends = [{"S":"pennbook"}]; // automatically friends with app's account, adding if list
	//var news = [{"S":"Sports"}, {"S":"travel"}]; 
	var friends = ["pennbook"]; // automatically friends with app's account, adding if list
	for (let i = 0; i < news_arr.length; i++) {
		if (news_arr[i] != undefined) {
			news.push(news_arr[i]);
		}
	}
	
	var wall = ['1'];// sets default first post to Welcome to Pennbook
	var chatInvites = ['0'];
	var ongoingChat = ['0'];
	
	if (news.length < 2) { // check that at least two interests were selected
		var errorMessage = "You must select at least 2 interests to sign up!";
		res.render('signup.ejs', {'error': errorMessage});
	}
	
	//console.log("here is news array: " + news);
	
	//Check the table for the username using user_db function 
	user_db.add_user(news_arr, first, last, username, password, affiliation, birthday, email, friends, wall, chatInvites, ongoingChat, function(err, data) {
		//If err or lookup error send error back to main
		if(err || username === undefined || password === undefined) {
			var errorMessage = "Sorry, looks like we ran into an error.";
			res.render('signup.ejs', {'error': errorMessage});
		} else {
			//Otherwise save username to session and route to restaruants
			req.session.secret = username;
			res.redirect('/userprofile');
		}
	});
};

// Page to view user profile
var userProfile = function(req, res) {
	var username = req.session.secret;
	
	user_db.user_status_change(username, "active", function(err, data2) {
		//If err or lookup error send error back to main
		if(err) {
			var errorMessage = "Looks like we ran into an error updating your status, you may be logged out soon";
			res.render('/', {'error': errorMessage});
		} else {	
			user_db.username_lookup(username, function(err, data) {
				//If err or lookup error send error back to main
				if(err || data.Items[0] === undefined || username === undefined) {
					//redirect back to main with an error
					var errorMessage = "Looks like we had an issue accessing the database.";
					res.render('mainpage.ejs', {'error': errorMessage});
				} else {
					//console.log("TESTING DATA ITEMS: " + data.Items[0].username.S);
					res.render('userprofile.ejs', {'userdata': data.Items[0], 'error': null});
				}
			});
		}
	});
};


// Page to view friends
var viewFriends = function(req, res) {
	var username = req.session.secret;
	user_db.user_status_change(username, "active", function(err, data2) {
		//If err or lookup error send error back to main
		if(err) {
			var errorMessage = "Looks like we ran into an error updating your status, you may be logged out soon";
			res.render('/', {'error': errorMessage});
		} else {
			//Check the table for the username using user_db function 
			user_db.get_friends(username, function(err, data) {
				//If err or lookup error send error back to main
				if(err || username == undefined) {
					//redirect back to main with an error
					var errorMessage = "Sorry, looks like we ran into an error";
					res.render('viewfriends.ejs', {'listUsers': null, 'error': errorMessage});
				} else {
					console.log("here is the new batch data: " + data.users[0].username.S);
					res.render('viewfriends.ejs', {'listUsers': data.users, 'error': errorMessage});
				}
			});
			//res.render('viewfriends.ejs', {'listUsers': friendList, 'error': null});
		}
	});
};


var updateFriends = function(req, res) {
	var username = req.session.secret;
		//If err or lookup error send error back to main
		//Check the table for the username using user_db function 
		user_db.get_friends(username, function(err, data) {
			//If err or lookup error send error back to main
			if(err || username == undefined) {
				//redirect back to main with an error
				var errorMessage = "Sorry, looks like we ran into an error";
				res.send({'newData': null, 'error': errorMessage});
			} else {
				console.log("here is the new update data: " + data.users[0].username.S);
				res.send({'newData': data.users});
			}
		});
};


// Add friend to user 
var addFriend = function(req, res) {
	var username = req.session.secret; 
	var friend = req.body.friend_name;
	console.log("FRIEND IS: " + friend);  
	user_db.add_friend(username, friend, function(err, data) {
		if(err || username === undefined || friend === undefined) {
			var errorMessage = "Sorry, make sure you enter valid friend name";
			console.log("ERROR ADDING FRIEND" + err); 
			res.redirect('/userprofile'); 
		} else {
			//Otherwise save username to session and route to restaruants
			req.session.secret = username;
			res.redirect('/viewfriends');
		}
	})
}; 

// Delete friend from use
var deleteFriend = function(req, res) {
	var username = req.session.secret; 
	var friend = req.body.friend_name;
	console.log("FRIEND IS: " + friend);  
	user_db.delete_friend(username, friend, function(err, data) {
		if(err || username === undefined || friend === undefined) {
			var errorMessage = "Sorry, make sure you enter valid friend name";
			console.log("ERROR DELETING FRIEND" + err); 
			res.redirect('/userprofile'); 
		} else {
			//Otherwise save username to session and route to restaruants
			req.session.secret = username;
			res.redirect('/viewfriends');
		}
	})
}; 
// Switch user's news interests
// Switch user's affiliation
// Change user's email or password
var editProfile = function(req, res) {
	var username = req.session.secret;
	var password = req.body.password;
	var affiliation = req.body.affiliation; 
	var email = req.body.email_address;
	var politics = req.body.politics_check;
	var travel = req.body.travel_check;
	var business = req.body.business_check;
	var sports = req.body.sports_check;
	var entertainment = req.body.entertainment_check;
	var wellness = req.body.wellness_check;
	var news_arr = [politics, travel, business, sports, entertainment, wellness];
	var news = [];
	
		
	user_db.edit_profile(news_arr, username, password, affiliation, email, function(err, data) {
		//If err or lookup error send error back to main
		if(err || username === undefined || password === undefined) {
			var errorMessage = "Sorry, looks like we ran into an error.";
			res.render('userprofile.ejs', {'userdata': data.Items[0], 'error': null});
		} else {
			//Otherwise save username to session and route to restaruants
			req.session.secret = username;
			//res.redirect('/userprofile');
			res.render('userprofile.ejs', {'userdata': data.Items[0], 'error': null});
		}
	});
};
var getVisual = function(req, res) {
	res.render('friendvisualizer.ejs');
}; 

var visualInitial = function(req, res) {
	username = req.session.secret; 
	user_db.get_friends(username, function(err, data) {
		//If err or lookup error send error back to main
		if(err || username == undefined) {
			//redirect back to main with an error
			console.log("Sorry, looks like we ran into an error");
		} else {
			console.log(data);
			console.log("USER" +  username);
			let children = "";
			console.log("data length" + data.users.length);
			
			var json = {
				"id": username, 
				"name": username, 
				"children": [], 
				"data": []
		    };
		    
			for (var x = 0; x < data.users.length; x++) {
				json.children.push({
					"id": data.users[x].username.S,
					"name": data.users[x].username.S, 
					"data": {}, 
					"children": []
				});
			}
		    res.send(json);
		}
	});
	
};

var visualFriends = function(req, res) {
	username = req.params.user;
    console.log("CLICKED HERE THIS IS WHO" + req.params.user);
    user_db.get_friends(username, function(err, data) {
		//If err or lookup error send error back to main
		if(err || username == undefined) {
			//redirect back to main with an error
			console.log("Sorry, looks like we ran into an error");
		} else {
			console.log(data);
			console.log("USER" +  username);
			let children = "";
			console.log("data length" + data.users.length);
			
			var json = {
				"id": username, 
				"name": username, 
				"children": [], 
				"data": []
		    };
		    var org_friends = []; 
			for (var x = 0; x < data.users.length; x++) {
				org_friends.push(data.users[x].username.S); 
				json.children.push({
					"id": data.users[x].username.S,
					"name": data.users[x].username.S, 
					"data": {}, 
					"children": []
				});
			}
			
			user_db.username_lookup(req.session.secret, function(err1, user_details) {
				console.log("MAKING IT HERE"); 
				if (err1) {
					console.log("Error getting user during visualizer"); 
				} else {
					var signed_friends = []; 
					for (var i = 0; i < user_details.Items[0].friends.SS.length; i++) {
						signed_friends.push(user_details.Items[0].friends.SS[i]); 
						console.log("friend #" + i + " -- " + user_details.Items[0].friends.SS[i]); 
					}
					console.log("USER's AFFILIATION: " + user_details.Items[0].affiliation.S); 
				user_db.search_affiliation(user_details.Items[0].affiliation.S, function(err2, affiliated) {
					if (err2) {
						console.log("Error getting users with same affiliation"); 
					} else {
						console.log("GOT THE AFF USERS " + affiliated.length); 
		    			var json1 = {
							"id": req.session.secret, 
							"name": req.session.secret, 
							"children": [], 
							"data": []
					    };
					    
					    if (signed_friends.includes(username)) {
							json1.children.push(json); 
						} else {
							var json2 = {
								"id": "pennbook", 
								"name": "pennbook", 
								"children": [], 
								"data": []
							}
							json2.children.push(json); 
							json1.children.push(json2); 
						}
						
					    //json1.children.push(json);
						for (var j = 0; j < affiliated.length; j++) { 
							console.log("CURR USER: " + affiliated[j].username.S); 
							console.log("HAS IT" + org_friends.includes(affiliated[j].username.S)); 
							if (org_friends.includes(affiliated[j].username.S)) {
								json1.children.push({
									"id": affiliated[j].username.S,
									"name": affiliated[j].username.S, 
									"data": {}, 
									"children": []
								});
							}
							
						}
						
		    			res.send(json1);
					}
				})
				
				}
			})
			
		}
	});
};

var allUsers = function(req, res) {
	var username = req.session.secret;
	//var theSearch = req.body.newSearchTerm;
	
	user_db.display_all_users(function(err, data){
		if (err || username == undefined) {
			var errorMessage = "Sorry, looks like we ran into an error deleting your comment.";
			//not sure where to redirect too....
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			res.render('allusers.ejs', {'listUsers': data, error: null}); 
		}
	});
};

var searchUsers = function(req, res) {
	var theSearch = req.body.newSearchTerm;
	var username = req.session.secret;
	console.log("Looking for: " + theSearch);
	
	user_db.search_users(theSearch, function(err, data) {
		if (err || theSearch == undefined || username == undefined) {
			var errorMessage = "Looks like we ran into a problem processing your search.";
			//not sure where to redirect too....
			res.render('allusers.ejs', {'listUsers': null, 'error': errorMessage});
		} else {
			res.send({'searchRes': data}); 
		}
	});
};

var likeArticle = function(req, res) {
	var username = req.session.secret; 
	var id = req.body.article_id;
	var cat = req.body.article_cat; 
	console.log("ARTICLE IS: " + id);  
	user_db.like_article(username, id, cat, function(err, data) {
		if(err || username === undefined || id === undefined) {
			var errorMessage = "Sorry, make sure you enter valid friend name";
			console.log("ERROR LIKING ARTICLE" + err); 
			res.redirect('/logout'); 
		} else {
			console.log("SUCCESS LIKED"); 
			req.session.secret = username;
			res.redirect('/');
		}
	})
};

var searchNews = function(req, res) {
	var username = req.session.secret; 
	var searchTerms = req.body.searchTerms; 
	console.log("SearchedFor: " + searchTerms);  //check if undefined??
	user_db.search_news(searchTerms, username, function(err, data) {
		if(err) {
			var errorMessage = "Please enter a valid search term.";
			console.log("ERROR searching terms" + err); 
			res.redirect('/'); 
		} else {
			console.log("Successful search: " + searchTerms);
			res.render('homepage.ejs', {'user': username, 'results': data, 'error': null});
		}
	})
};


var routes = { 
    get_main: getMain,
    check_login: checkLogin,
    sign_up: signUp,
    create_account: createAccount,
    logout: logout,
    user_profile: userProfile,
    view_friends: viewFriends,
    add_friend: addFriend, 
    delete_friend: deleteFriend,
    edit_profile: editProfile,
    update_friends: updateFriends,
    all_users: allUsers,
    get_visual: getVisual, 
    visual_initial: visualInitial, 
    visual_friends: visualFriends,
    search_users: searchUsers,
    
    like_article: likeArticle, 
    //news_load: newsLoad,
    search_news: searchNews, 
};
  
module.exports = routes;
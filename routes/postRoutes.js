var post_db = require('../models/postDatabase.js');
var user_db = require('../models/userDatabase.js');
const querystring = require('querystring');
/////////////////////////////////////////
/////////POST FUNCTIONS//////////////
/////////////////////////////////////////

//Function to get wall (input is username and will display the user's wall) 
var getWall = function(req, res) {
	//get username and password from frontend
	var username = req.session.secret;
	post_db.get_wall(username, function(err, data) {
		//If err or lookup error send error back to main
		if(err || username == undefined) {
			//redirect back to main with an error
			var errorMessage = "Sorry, looks like we ran into an error";
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			// sorts the data
			var dataSorted = data.sort(function(a, b) {
				return b.inxid.N - a.inxid.N;
			});
			res.render('wall.ejs', {'results': dataSorted, 'user': username});
		}
	});
}

//Function to get wall (input is username and will display the user's wall) 
var getFeed = function(req, res) {
	//get username and password from frontend
	var username = req.session.secret;
	var users = [];
	user_db.get_friends(username, function(err, data) {
        if(err || !username) {
            //log error if it occurs
            console.log(err);
            var errorMessage = "Sorry, looks like we ran into an error";
			res.render('mainpage.ejs', {'error': errorMessage});
        } else {
			users.push({"username": {S: username}});
			data.users.forEach(function(user) {
				users.push({"username": {S: user.username.S}});
			});
			//Check the table for the username using post_db function 
			post_db.get_feed(users, function(err, data) {
				//If err or lookup error send error back to main
				if(err || username == undefined) {
				//redirect back to main with an error
					var errorMessage = "Sorry, looks like we ran into an error";
					res.render('mainpage.ejs', {'error': errorMessage});
				} else {
					// sorts the data
					var dataSorted = data.sort(function(a, b) {
						return b.inxid.N - a.inxid.N;
					});
					//console.log(dataSorted);
					console.log(username);
					res.render('feed.ejs', {'results': dataSorted, 'user': username});
				}
			});
        }
    });
	
};

//TODO Need to implement to addPost to Post table and User List
var addPost = function(req, res) {
	var username = req.session.secret;
	var content = req.body.content;
	
	//add content to post table and user list
	post_db.add_post(username, content, function(err) {
		//if err in adding or username is undefined send error
		if(err || username == undefined) {
			var errorMessage = "Sorry, looks like we ran into an error adding your post.";
			console.log("error in addPost: " + err);
			//not sure where to redirect too....
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			res.redirect("/wall");
		}
	});
	
};

//TODO Need to implement to addPost to Post table and User List
var addPostToOtherWall = function(req, res) {
	var author_username = req.session.secret;
	var wall_username = req.body.wall_username;
	var content = req.body.content;
	//add content to post table and user list
	post_db.add_post_to_other_wall(author_username, wall_username, content, function(err) {
		//if err in adding or username is undefined send error
		if(err || author_username == undefined || wall_username == undefined) {
			var errorMessage = "Sorry, looks like we ran into an error adding your post.";
			console.log("error in addPost: " + err);
			//not sure where to redirect too....
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			const query = querystring.stringify({
				"user": wall_username,
			});
			res.redirect('/friendsProfiles?' + query);
		}
	});
	
};

//TODO Need to implement to addPost to Post table and User List
var getAddPost = function(req, res) {
	res.render('addPostPage.ejs', {});
};

//TODO Need to implement to addPost to Post table and User List
var getAddPostToOtherWall = function(req, res) {
	username = req.query.wall_username;
	res.render('addPostToWall.ejs', {'wall_username': username});
};

// Page to view friend profile
var friendsProfile = function(req, res) {
	var user = req.session.secret;
	var username = req.query.user;
	console.log("FRIENDS PROFILE: " + user);
	user_db.user_status_change(user, "active", function(err, data2) {
		//If err or lookup error send error back to main
		if(err) {
			var errorMessage = "Looks like we ran into an error updating your status, you may be logged out soon";
			res.render('/', {'error': errorMessage});
		} else {	
			user_db.username_lookup(username, function(err, data) {
				//If err or lookup error send error back to main
				if(err || data.Items[0] === undefined || username === undefined) {
					console.log("error accessing database in  username lookup");
					//redirect back to main with an error
					var errorMessage = "Looks like we had an issue accessing the database.";
					res.render('mainpage.ejs', {'error': errorMessage});
				} else {
					
					//console.log("TESTING DATA ITEMS: " + data.Items[0].username.S);
					post_db.get_wall(username, function(err, data2) {
						if (err || user === undefined) {
							console.log(data2.Items);
							console.log(username);
							console.log("error accessing database get wall");
							//redirect back to main with an error
							var errorMessage = "Looks like we had an issue accessing the database.";
							res.render('mainpage.ejs', {'error': errorMessage});
						}
						else {
							var dataSorted = data2.sort(function(a, b) {
								return b.inxid.N - a.inxid.N;
							});
							res.render('friendsProfile.ejs', {'userdata': data.Items[0],'results': dataSorted, 'error': null, 'user': user});
						}
					})
				}
			});
		}
	});
};

//TODO Need to implement to deletePost to delete from Post table and User List
var deletePost = function(req, res) {
	var id = req.body.deleteBtn;
	var username = req.session.secret;
	post_db.delete_post(username, id, function(err){
		if(err || username == undefined) {
			var errorMessage = "Sorry, looks like we ran into an error deleting your post.";
			//console.log("error in deletePost: " + err);
			//not sure where to redirect too....
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			res.redirect(req.get('referer'));
		}
	});
};

//TODO Need to implement to addComment to Post list 
var addComment = function(req, res) {
	var username = req.session.secret;
	var content = req.body.text;
	var id = req.body.inxid;
	
	post_db.add_comment(username, content, id, function(err){
		if (err || username == undefined) {
			var errorMessage = "Sorry, looks like we ran into an error adding your comment.";
			//not sure where to redirect too....
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			res.redirect(req.get('referer'));
		}
	});
};
//TODO Need to implement to deleteComment from Post list
var deleteComment = function(req, res) {
	var username = req.session.secret;
	var comment = req.body.delCom;
	var id = req.body.id;
	post_db.delete_comment(username, comment, id, function(err){
		if (err || username == undefined) {
			var errorMessage = "Sorry, looks like we ran into an error deleting your comment.";
			//not sure where to redirect too....
			res.render('mainpage.ejs', {'error': errorMessage});
		} else {
			res.redirect(req.get('referer'));
		}
	});
};

var routes = { 
    get_wall: getWall,
	get_feed: getFeed,
	add_post_to_other_wall: addPostToOtherWall,
    add_post: addPost,
    delete_post: deletePost,
    add_comment: addComment,
    delete_comment: deleteComment,
    get_add_post: getAddPost,
	get_add_post_to_other_wall: getAddPostToOtherWall,
	friends_profile: friendsProfile,
};
  
module.exports = routes;
var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var db = new AWS.DynamoDB();
var crypto = require('crypto');
var post_db = require('../models/postDatabase.js');
const stemmer = require('porter-stemmer');

const fs = require('fs');

/////////////////////////////////////////
///////////USER FUNCTIONS////////////////
/////////////////////////////////////////

// Functions from my HW4. Use them or delete them if you want - Jake
var usernameLookup = function(searchName, callback) {
    console.log('Looking for: ' + searchName); 

    //Create parameters to search table for username
    var params = {
        ExpressionAttributeValues: {
		    ':u': {S: searchName}
	    },
	    KeyConditionExpression: 'username = :u',
        TableName: "users"
    };

    //Query the table and return data if found
    db.query(params, function(err, data) {
        if (err) {
	        //log error if it occurs
	        console.log(err);
            callback(err, {});
        } else {
            callback(err, data);
        }
    });
}

var addUser = function(interests, first, last, username, password, affiliation, birthday, email, friends,  wall, chatInvites, ongoingChats, callback) {
    console.log('Adding: ' + username); 
	news = []
	if (interests[0] != undefined) {
		news.push("Politics"); 
	}
	if (interests[1] != undefined) {
		news.push("Travel"); 
	}
	if (interests[2] != undefined) {
		news.push("Business"); 
	}
	if (interests[3] != undefined) {
		news.push("Sports"); 
	}
	if (interests[4] != undefined) {
		news.push("Entertainment"); 
	} 
	if (interests[5] != undefined) {
		news.push("Wellness"); 
	} 
    var enc_pwd = crypto.createHash('sha256').update(password).digest('hex');
    //Create parameters to add item to table
    var currDateTime = new Date();
    currDateTime = currDateTime.toISOString();
    var params = {
	    Item: {
		    'username': {S: username},
		    'first_name': {S: first},
		    'last_name': {S: last},
		    'password': {S: enc_pwd}, 
		    'affiliation': {S: affiliation}, 
		    'birthday': {S: birthday}, 
		    'email_address': {S: email}, 
		    'friends': {SS: friends}, 
		    'news_interests': {SS: news}, 
		    'wall': {NS: wall},
		    'userStatus': {S: currDateTime},
		    "chat_invites": {NS: chatInvites},
		    "ongoing_chats": {NS: ongoingChats},
		    'room_id': {N: "0"},
	    },
        TableName: "users"
    };

    //Add item to the table and return nothing if successful
    db.putItem(params, function(err, data) {
        if (err) {
	        //log error if it occurs
	        console.log(err);
            callback(err, {});
        } else {
            callback(err, {});
        }
    });
}



// add friend 
var addFriend = function(user, friend, callback) {
	console.log(user + '\'s is friending ' + friend); 
	// check if friend exists
	var check_params = {
	  	ExpressionAttributeValues: {
		    ':u': {S: friend}
	    },
	    KeyConditionExpression: 'username = :u',
	  	TableName: "users"
	};
	
	//Query the table to see if friend exists
	db.query(check_params, function(err, data) {
	    if (err || data.Items.length == 0) {
		    console.log("friend does not exist"); 
		    callback(err, {}); 
	    } else { // if friend exists then will add to list 
	        console.log(friend + " exists!");
	        friendExists = true; 
	        var eparams = {
			    TableName : "users", 
			    Key: {
				    "username": {"S" : user} 
			    },
			    UpdateExpression: "ADD friends :newFriends", // string set handles duplicates
			    ExpressionAttributeValues: {
				    ":newFriends": {SS: [friend]}
			    }, 
		    }; 
		    db.updateItem(eparams, function(err, data) {
		        if (err) {
			        //log error if it occurs
			        console.log("error with add friend" + err);
		        } else {
			        console.log("add friend success"); 
		        }
	        });
	        var friend_params = {
			    TableName : "users", 
			    Key: {
				    "username": {"S" : friend} 
			    },
			    UpdateExpression: "ADD friends :newFriends", // string set handles duplicates
			    ExpressionAttributeValues: {
				    ":newFriends": {SS: [user]}
			    }, 
		    }; 
		    db.updateItem(friend_params, function(err, data) {
		        if (err) {
			        //log error if it occurs
			        console.log("error with add friend" + err);
		            callback(err, {});
		        } else {
			        console.log("add friend success"); 
			        callback(err, {}); 
		        }
	        });
	        	 
	    }
	});
}; 

// delete friend 
var deleteFriend = function(user, friend, callback) {
	console.log(user + '\'s is UNfriending ' + friend); 
	// check if friend exists
	var check_params = {
	  	ExpressionAttributeValues: {
		    ':u': {S: friend}
	    },
	    KeyConditionExpression: 'username = :u',
        TableName: "users"
  	};
  	
	db.query(check_params, function(err, data) {
	    if (err) {
		  //log error if it occurs
		  console.log("ERRRRRROR" + err);
	      //callback(err, {});
	    } else {
		  console.log("WORKED"); 
	      console.log(data.Items[0].friends.SS); 
	      //callback(data.Items[0].friends.SS); 
	    }
    });
    
    
    //Query the table to see if friend exists
	db.query(check_params, function(err, data) {
	    if (err || data.Items.length == 0) {
		    console.log("friend does not exist"); 
		    callback(err, {}); 
	    } else { // if friend exists then will add to list 
	        console.log(friend + " exists!");
	        var eparams = {
			    TableName : "users", 
			    Key: {
				    "username": {"S" : user} 
			    },
			    UpdateExpression: "DELETE friends :newFriends", // string set handles duplicates
			    ExpressionAttributeValues: {
				    ":newFriends": {SS: [friend]}
			    }, 
		    }; 
		    db.updateItem(eparams, function(err, data) {
		        if (err) {
			        //log error if it occurs
			        console.log("error with delete friend" + err);
		        } else {
			        console.log("delete friend success"); 
		        }
	        });	 
	        
	        var friend_params = {
			    TableName : "users", 
			    Key: {
				    "username": {"S" : friend} 
			    },
			    UpdateExpression: "DELETE friends :newFriends", // string set handles duplicates
			    ExpressionAttributeValues: {
				    ":newFriends": {SS: [user]}
			    }, 
		    }; 
		    db.updateItem(friend_params, function(err, data) {
		        if (err) {
			        //log error if it occurs
			        console.log("error with delete friend" + err);
		            callback(err, {});
		        } else {
			        console.log("delete friend success"); 
			        callback(err, {}); 
		        }
	        });	
	    }
	});
}; 

// switch affiliation, interests
// update password and email
var editProfile = function(interests, username, password, affiliation, email, callback) {
	news = [];
	var postContent = "";
	if (interests[0] != undefined) {
		news.push("Politics"); 
	}
	if (interests[1] != undefined) {
		news.push("Travel"); 
	}
	if (interests[2] != undefined) {
		news.push("Business"); 
	}
	if (interests[3] != undefined) {
		news.push("Sports"); 
	}
	if (interests[4] != undefined) {
		news.push("Entertainment"); 
	} 
	if (interests[5] != undefined) {
		news.push("Wellness"); 
	}
	console.log("interests: " + news); 
	console.log('affiliation: ' + affiliation); 
	console.log("email: " +  email); 
	
	//var news_arr = [politics, travel, business, sports, entertainment, wellness];
	
	var initParams = {
		ExpressionAttributeValues: {
			':u': {S: username}
	    },
		KeyConditionExpression: 'username = :u',
		TableName: "users",
		ProjectionExpression: "password, affiliation, email_address, news_interests"
	};
			
	//Query the table and return data if found
	db.query(initParams, function(err, initdata) {
		if (err) {
			//log error if it occurs
			console.log(err);
			//callback(err, {});
		} else {
			//for (x in initdata.Items[0]) {
				//console.log("successfully looked up init data: " + x);
			//}
			console.log("here is aff: " + initdata.Items[0].affiliation.S);
			
			// checks if the affiliation was changed
			if (initdata.Items[0].affiliation.S != affiliation) {
				postContent = (username + " updated their affiliation to " + affiliation);
				post_db.add_post(username, postContent, function(err) {
				    if (err) {
					  //log error if it occurs
					  console.log("error making post: " + err);
				    } else {
					  console.log("post successful"); 
				    }
			    });
			}
			
			var changedTravel = (initdata.Items[0].news_interests.SS.includes("Travel") != news.includes("Travel"));
			var changedPolitics = (initdata.Items[0].news_interests.SS.includes("Politics") != news.includes("Politics"));
			var changedSports = (initdata.Items[0].news_interests.SS.includes("Sports") != news.includes("Sports"));
			var changedBusiness = (initdata.Items[0].news_interests.SS.includes("Business") != news.includes("Business"));
			var changedEntertainment = (initdata.Items[0].news_interests.SS.includes("Entertainment") != news.includes("Entertainment"));
			var changedWellness = (initdata.Items[0].news_interests.SS.includes("Wellness") != news.includes("Wellness"));
			
			// checks if the news interests were changed
			if (changedTravel || changedPolitics || changedSports || changedBusiness || changedEntertainment || changedWellness) {
				if (changedTravel) {
					if (initdata.Items[0].news_interests.SS.includes("Travel")) {
						postContent = username + " is no longer interested in Travel.";
					} else {
						postContent = username + " is now interested in Travel!";
					}
					var newPost = post_db.add_post(username, postContent, function(err) {
					    if (err) {
						    //log error if it occurs
						    console.log("error making post: " + err);
					    } else {
						    console.log("post successful"); 
					    }
			   	 	});
				}
				if (changedPolitics) {
					if (initdata.Items[0].news_interests.SS.includes("Politics")) {
						postContent = username + " is no longer interested in Politics.";
					} else {
						postContent = username + " is now interested in Politics!";
					}
					var newPost = post_db.add_post(username, postContent, function(err) {
					    if (err) {
						    //log error if it occurs
						    console.log("error making post: " + err);
					    } else {
						    console.log("post successful"); 
					    }
			   	 	});
				}
				if (changedSports) {
					if (initdata.Items[0].news_interests.SS.includes("Sports")) {
						postContent = username + " is no longer interested in Sports.";
					} else {
						postContent = username + " is now interested in Sports!";
					}
					var newPost = post_db.add_post(username, postContent, function(err) {
					    if (err) {
						    //log error if it occurs
						    console.log("error making post: " + err);
					    } else {
						    console.log("post successful"); 
					    }
			   	 	});
				}
				if (changedBusiness) {
					if (initdata.Items[0].news_interests.SS.includes("Business")) {
						postContent = username + " is no longer interested in Business.";
					} else {
						postContent = username + " is now interested in Business!";
					}
					var newPost = post_db.add_post(username, postContent, function(err) {
					    if (err) {
						    //log error if it occurs
						    console.log("error making post: " + err);
					    } else {
						    console.log("post successful"); 
					    }
			   	 	});
				}
				if (changedEntertainment) {
					if (initdata.Items[0].news_interests.SS.includes("Entertainment")) {
						postContent = username + " is no longer interested in Entertainment.";
					} else {
						postContent = username + " is now interested in Entertainment!";
					}
					var newPost = post_db.add_post(username, postContent, function(err) {
					    if (err) {
						    //log error if it occurs
						    console.log("error making post: " + err);
					    } else {
						    console.log("post successful"); 
					    }
			   	 	});
				}
				if (changedWellness) {
					if (initdata.Items[0].news_interests.SS.includes("Wellness")) {
						postContent = username + " is no longer interested in Wellness.";
					} else {
						postContent = username + " is now interested in Wellness!";
					}
					var newPost = post_db.add_post(username, postContent, function(err) {
					    if (err) {
						  //log error if it occurs
						  console.log("error making post: " + err);
					    } else {
						  console.log("post successful"); 
					    }
			   	 	});
				}
				//console.log("updated news interests " + postContent);
				//console.log("here are new interests: " + news);
				//console.log("here are old interests: " + initdata.Items[0].news_interests.SS + "\n");
			}
			
			var enc_pwd; 
			
			if (password == "") {
				enc_pwd = initdata.Items[0].password.S;
			} else {
				enc_pwd = crypto.createHash('sha256').update(password).digest('hex');
			}
			var eparams = {
				TableName : "users", 
				Key: {
					"username": {"S" : username} 
				},
				UpdateExpression: "SET news_interests = :n, email_address = :e, affiliation = :a, password = :p", // string set handles duplicates
				ExpressionAttributeValues: {
					":n": {SS: news}, 
					":e": {S: email}, 
					":a": {S: affiliation}, 
					":p": {S: enc_pwd}
				}, 
				//ReturnValues: "UPDATED_OLD",
			}; 
			
			db.updateItem(eparams, function(err, data) {
				if (err) {
					 //log error if it occurs
			    	console.log("error with updating profile \n" + err);
				} else {
					console.log("update profile success"); 
					var params = {
				        ExpressionAttributeValues: {
						    ':u': {S: username}
					    },
					    KeyConditionExpression: 'username = :u',
				        TableName: "users"
					};
					
					//Query the table and return data if found
					db.query(params, function(err, querydata) {
					    if (err) {
						    //log error if it occurs
						    console.log(err);
					        callback(err, {});
					    } else {
					        callback(err, querydata);
					    }
					}); 
				}
			});	
		}
	});
}; 


var displayAllUsers = function(callback) {
    console.log('Displaying all users'); 
  
    //Create parameters to search table for username
    var params = {
        TableName: "users"
    };
  
    //Query the table and return data if found
    db.scan(params, function(err, data) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else {
            callback(err, data.Items);
        }
    });
}
  
var searchUsers = function(searchTerm, callback) {
    console.log('Looking for: ' + searchTerm); 
  
    //Create parameters to search table for username
    var params = {
        ScanFilter: {
          "username" : {
              AttributeValueList: [{S: searchTerm}],
              ComparisonOperator: "CONTAINS"
          } 
        },
        TableName: "users"
    };
   
    //Query the table and return data if found
    db.scan(params, function(err, data) {
        if (err) {
            //log error if it occurs
            console.log(err);
            callback(err, {});
        } else {
            console.log("here are the results: " + data.Items);
            for (x in data.Items) {
                console.log(data.Items[x].username.S);
            }
            console.log("end data");
            callback(err, data.Items);
        }
    });
}
  
var getFriends = function(searchName, callback) {
    console.log('Looking for: ' + searchName + '\'s friends list'); 
  	
  	var today = new Date();
	var todaysDate = (today.getFullYear() - 5) + "" + String(today.getMonth() + 1).padStart(2, '0') + "" + String(today.getDate()).padStart(2, '0');
     //Create parameters to search table for username
    var params = {
        ExpressionAttributeValues: {
            ':u': {S: searchName}
        },
        KeyConditionExpression: 'username = :u',
        TableName: "users"
    };
  
      // query the database for the friends list
    db.query(params, function(err, data) {
        if (err || !searchName) {
            //log error if it occurs
            console.log(err);
            callback(err, []);
        } else {
            //For each post in the user table add it tot he post_ids list
            //console.log((data.Items[0].wall.NS));
            console.log("HERE IS FREINDS: " + data.Items[0].friends.SS);
            var statMap = new Map();
            //TODO -Cassie - modify so that batchGetItem will work for if they have more than 100 friends
            console.log("length: " + data.Items[0].friends.SS.length);
            var keyList = [];
            for (let x = 0; x < data.Items[0].friends.SS.length; x++) {
                keyList.push(
                    {"username": {"S": data.Items[0].friends.SS[x]}}
                );
            //statMap.set(data.Items[0].friends.SS[x], friendStat);
            }
        
            for (let i = 0; i < keyList.length; i++) {
                console.log("here is keylist: " + keyList[i].username.S);
            }
        
            var batchParams = {
                RequestItems: {
                    "users": {
                        Keys: keyList,
                        AttributesToGet : ["username", "userStatus"],
                    }
                }
            };
        
            db.batchGetItem(batchParams, function(err, batchData) {
                if (err) {
                    console.log("batch error: " + err);
                    //callback(err, null);
                } else {
                    callback(err, batchData.Responses);
                }
            });
        }
    });
} 

var changeStatus = function(username, newStatus, callback) {
    console.log('Changing ' + username + '\'s status'); 
    
    var newStatusVal;
    
    if (newStatus === "inactive") {
        newStatusVal = "0";
    } else {
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
					"chat_invites": {'NS':['0']},
					"ongoing_chats": data.Item.ongoing_chats, 
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

var getMain = function(username, callback) {
	var params = {
		TableName: 'users', 
		Key: {'username': {"S" : username}},
		AttributesToGet: ['news_interests'],
	}
	//get user in user table, if successful, reset chat invite set
	db.getItem(params, function(err, data){
		if (err) {
			console.log("Error fetching user information: " + err);
			callback(err);
		} else {
			// get 5 articles from each category of interest... TODO add more
			var today = new Date();
			var todaysDate = (today.getFullYear() - 5) + "" + String(today.getMonth() + 1).padStart(2, '0') + "" + String(today.getDate()).padStart(2, '0');
			
			const query_news_table = function(category_to_search) {
				return new Promise((resolve, reject) => {
					var news_params = { // sets up query params for table
						ExpressionAttributeValues: {
							":this_id": {N: "0"},
							":category" : {S: category_to_search},
							":thedate" : {S: todaysDate},
						},
						ExpressionAttributeNames: {
							"#datecol": "date",
						},
						KeyConditionExpression: "inxid > :this_id AND category = :category",
						FilterExpression: "#datecol <= :thedate",
						TableName: "news_dataset", // querying news table
					};
					var query_result = db.query(news_params).promise(); // result of query is promise
					resolve(query_result);   // return the query result when the promise is resolved
				});
			}
			
			
			let promise_arr_news_int = [];
			for (let i = 0; i < data.Item.news_interests.SS.length; i++) { // create a query for each keyword
				promise_arr_news_int.push(query_news_table(data.Item.news_interests.SS[i].toUpperCase())); // create an array of promises
			}
			
			Promise.all(promise_arr_news_int).then( // first table query returns the results of the first table query
				query_result => {
					var ret_vals = []; // store the results in an array
					//W3console.log("HERE IS THE LNEGHT: " + query_result.length);
					return query_result;  // return the talk_dds from the first table query
				} 
			).then(
				rendering_data => {
					callback(null, rendering_data);
				}
			);
		}
	});
}
var likeArticle = function(username, id, cat, callback) {
	console.log(username + '\'s is liking post ' + id); 
	// check if artcile exists
	var check_params = {
	  	ExpressionAttributeValues: {
		    ':u': {N: id}, 
		    ':c': {S: cat}
	    },
	    KeyConditionExpression: 'inxid = :u AND category = :c',
	  	TableName: "news_dataset"
	};
	
	//Query the table to see if article exists
	db.query(check_params, function(err, data) {
	    if (err || data.Items.length == 0) {
		    console.log("article does not exist"); 
		    callback(err, {}); 
	    } else { // if article exists then will like it
	        console.log(id + " exists!");
	        friendExists = true; 
	        var eparams = {
			    TableName : "users", 
			    Key: {
				    "username": {"S" : username} 
			    },
			    UpdateExpression: "ADD articles_liked :newArticles", // string set handles duplicates
			    ExpressionAttributeValues: {
				    ":newArticles": {NS: [id]}
			    }, 
		    }; 
		    db.updateItem(eparams, function(err, data) {
		        if (err) {
			        //log error if it occurs
			        console.log("error with adding liked articles" + err);
		        } else {
			        console.log("adding article success"); 
		        }
	        });
	        var article_params = {
			    TableName : "news_dataset", 
			    Key: {
				    "inxid": {"N" : id}, 
				    "category": {"S": cat} 
			    },
			    UpdateExpression: "ADD users_liked :newUsers", // string set handles duplicates
			    ExpressionAttributeValues: {
				    ":newUsers": {SS: [username]}
			    }, 
		    }; 
		    db.updateItem(article_params, function(err, data) {
		        if (err) {
			        //log error if it occurs
			        console.log("error with add friend" + err);
		            callback(err, {});
		        } else {
			        console.log("add friend success"); 
			        callback(err, {}); 
		        }
	        });
	        	 
	    }
	});
}; 


var searchNews = function(searchTerms, username, callback) {
	console.log("Searching for " + searchTerms); 
	
	var news_interests;
	
	var itemparams = {
		TableName: 'users', 
		Key: {'username': {"S" : username}},
		AttributesToGet: ['news_interests'],
	}
	//get user in user table, if successful, reset chat invite set
	db.getItem(itemparams, function(err, data){
		if (err) {
			console.log("Error fetching user information: " + err);
			//callback(err, null);
		} else {
			news_interests = data.Item.news_interests.SS;
			console.log("HERE IS THE RESULT: " + news_interests);
			var today = new Date();
			var todaysDate = (today.getFullYear() - 5) + "" + String(today.getMonth() + 1).padStart(2, '0') + "" + String(today.getDate()).padStart(2, '0');
			// Looks up the corresponding information for the talk id. 
			// create the query parameters to check for the given keyword in the table.
			var keywords = searchTerms.split(" ");
			for (let x = 0; x < keywords.length; x++) {
				keywords[x] = stemmer.stemmer(keywords[x].toLowerCase());
			}
			console.log(keywords);
				// takes in a keyword, and returns a promise for the table query for given keyword
			const query_keyword_table = function(this_keyword) {
				return new Promise((resolve, reject) => { 
					var keyword_params = {  // sets up query params for table
					  ExpressionAttributeValues: {
					  	":key": {S: this_keyword},
					  },
					  KeyConditionExpression: "keyword = :key",
					  TableName: "inverted", // querying inverted table for word from talk
				    };
					
					var query_result = db.query(keyword_params).promise(); // result of query is promise
					resolve(query_result); // return the query result when the promise is resolved
				});
			}
		//	var theIntDate = parseInt(todaysDate);
			// takes in a talk id, and returns a promise for the table query for given talk id
			const query_news_table = function(news_art_id, category_to_search) {
				return new Promise((resolve, reject) => {
					var news_params = { // sets up query params for table
						ExpressionAttributeValues: {
							":this_id": {N: news_art_id},
							":category" : {S: category_to_search},
							":thedate" : {S: todaysDate},
						},
						ExpressionAttributeNames: {
							"#datecol": "date",
						},
						KeyConditionExpression: "inxid = :this_id AND category = :category",
						FilterExpression: "#datecol <= :thedate",
						TableName: "news_dataset", // querying news table
					};
					var query_result = db.query(news_params).promise(); // result of query is promise
					resolve(query_result);   // return the query result when the promise is resolved
				});
			}
		
			promise_arr_keyword_query = []; // array of promises from the first table (to query for keywords)
			for (let i = 0; i < keywords.length; i++) { // create a query for each keyword
				promise_arr_keyword_query.push(query_keyword_table(keywords[i])); // create an array of promises
			}
			
			// begin with querying all of the keywords to the first table from the above array
			Promise.all(promise_arr_keyword_query).then( // first table query returns the results of the first table query
				query_result => {
					var news_id_res = []; // store the results in an array
					for (let x = 0; x < query_result.length; x++) { // iterates through each word's set of talk ids
						for (let i = 0; i < query_result[x].Items.length; i++) { // iterates through each talk id in each set // && news_id_res.length < 15 and below
							if (!news_id_res.includes(query_result[x].Items[i].inxid)) { // checks that the talk id is not already being queried, and that there are less than 15 objects
								news_id_res.push(query_result[x].Items[i].inxid.N); // adds the talk id to an array.
							}
						}
					}
					return news_id_res;  // return the talk_dds from the first table query
				} 
			).then(
				news_id_arr => { // the talk ids array from the previous promise
					var results_news_arr = []; 
					for (let x = 0; x < news_id_arr.length; x++) { // loops through each talk id
						for (let y = 0; y < news_interests.length; y++) {
							results_news_arr.push(query_news_table(news_id_arr[x], news_interests[y].toUpperCase()));
						}
						 // for each talk id, create a query to the second table
					}
					return Promise.all(results_news_arr); // return the results here as a promise
				}
			).then(
				results_promise_arr => {
					var new_results_arr = [];
					for (let i = 0; i < results_promise_arr.length; i++) {
						var orig_obj = results_promise_arr[i].Items;
						if (orig_obj[0] != undefined) {
							new_results_arr.push(orig_obj[0]); // add the results to the array to be returned
						}
					}
					return new_results_arr;
				}
			).then(
				rendering_data => {
					callback(null, rendering_data);
				}
			);
		}
	});
	//Query the table to see if article exists
}; 

var searchAffiliation = function(searchTerm, callback) {
    console.log('Looking for: ' + searchTerm); 
  
    //Create parameters to search table for username
    var params = {
        ScanFilter: {
          "affiliation" : {
              AttributeValueList: [{S: searchTerm}],
              ComparisonOperator: "EQ"
          } 
        },
        TableName: "users"
    };
   
    //Query the table and return data if found
    db.scan(params, function(err, data) {
        if (err) {
            //log error if it occurs
            console.log(err);
            callback(err, {});
        } else {
            console.log("here are the results of affiliation: " + data.Items);
            for (x in data.Items) {
                console.log(data.Items[x].username.S + " and their affiliated with " + data.Items[x].affiliation.S);
            }
            console.log("end data of AFFILIATIONS");
            callback(err, data.Items);
        }
    });
}

var database = { 
    username_lookup: usernameLookup,
    add_user: addUser,
    add_friend: addFriend,
    delete_friend: deleteFriend,
    edit_profile: editProfile, 
    display_all_users: displayAllUsers,
    user_status_change: changeStatus,
    get_friends: getFriends,
    search_users: searchUsers,
    reset_invite: resetInvite,
    get_main: getMain,
    like_article: likeArticle,
    search_news: searchNews,
    search_affiliation : searchAffiliation,
};

module.exports = database;
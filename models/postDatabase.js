var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var db = new AWS.DynamoDB();
var crypto = require('crypto');

/////////////////////////////////////////
/////////POST FUNCTIONS//////////////
/////////////////////////////////////////

var getFeed = function(searchNames, callback) {
    console.log('Looking for: ' + searchNames[0] + '\'s feed'); 
    var post_ids = [];
    var seenPosts = [];

    var postIndexParams = {
        RequestItems: {
            'users': {
                Keys: searchNames,
                AttributesToGet : ["wall"],
            }
        }
    };

    //Get users from database (user + friends)
    db.batchGetItem(postIndexParams, function (err, data) {
        if (err) {
            //log error if it occurs
            console.log(err);
            callback(err, []);
        } else {
            //Get posts from returned data
            data.Responses.users.forEach(function(userWall) {
                userWall.wall.NS.forEach(function(post) {
                    let post_id = post;
                    //To make sure there are no duplicates
                    if(!seenPosts.includes(post_id)) {
                        post_ids.push({'inxid': {'N': post_id}});
                        seenPosts.push(post_id);
                    }
                });
            });
  
            //Create parameters for batchGetItem
            //https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#batchGetItem-property
            //https://stackoverflow.com/questions/53129094/dynamodb-get-all-items-by-an-array-of-ids 
            var postParams = {RequestItems: {}};
            postParams.RequestItems['posts'] = {
                Keys: post_ids,
                //define fields
                ProjectionExpression: 'inxid, content, creator_username, wall_username, comments'
            };
        
            //Query table to get the posts from post table
            db.batchGetItem(postParams, function (err, data) {
                if (err) {
                    //log error if it occurs
                    console.log(err);
                    callback(err, []);
                } else {
                    callback(err, data.Responses.posts);
                }
            });
        }
    });
}  
  
//TODO implement functions 
var addPost = function(username, content, callback) {
    console.log("adding post from " + username);
    //Create params to get count from table
    var params1 = {
        Key: {'inxid': {N: "0"}},
        TableName: "posts",
    };
    
    //get count to get indix value
    db.getItem(params1, function(err, data) {
        //if error getting count value, callbck(err)
        if (err || data.Item == null) {
            console.log("Error getting count value in table, getItem: " + err);	
            callback(err)
        //else, add post to table using count value + 1
        } else {
            var count = parseInt(data.Item.countVal.N) + 1;
            var countString = count.toString();
            var params = {
                Item: {
                    'creator_username': {S: username},
                    'wall_username': {S: username},
                    'content': {S: content},
                    'comments': {L: [{L: []}]},
                    'inxid': {N: countString} ,
                },
                TableName: "posts",
            };
             //Add post to the table, if successful update count row, if not successful callback error
            db.putItem(params, function(err, data) {
                //if error putting post into table, callback(err)
                if (err) {
                    //log error if it occurs
                    console.log("Error adding post to table in putItem: " + err);
                    callback(err);
                //else, update count row value
                } else {
                    var params2 = {
                        Item: {
                            'inxid': {N: "0"} ,
                            "countVal": {N: countString}
                        },
                        TableName: "posts",
                    };
                    db.putItem(params2, function(err, data){
                        //if error callback(err)
                        if (err) {
                            console.log("Error updating count value in putItem: " + err);
                            callback(err);
                        //else, add inxid to user wall list
                        } else {
                            var params3 = {
                                TableName: "users", 
                                Key: {"username": {'S':username}}, 
                            }
                            db.getItem(params3, function(err, data){
                                if (err || data == undefined) {
                                    console.log("Error getting wall value in getItem users: " + err);
                                    callback(err);
                                } else {
                                    var wallL = (data.Item.wall.NS);
                                    var newList = [];
                                    wallL.forEach(function(num){
                                        newList.push(num);
                                    });
                                    newList.push(countString);
                                    var params4 = {
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
                                            "wall": {'NS': newList},
                                            "chat_invites": data.Item.chat_invites,
                                            "ongoing_chats": data.Item.ongoing_chats, 
                                            "room_id": data.Item.room_id,
                                            'userStatus': data.Item.userStatus,
                                        }
                                    }
                                    db.putItem(params4, function(err, data){
                                        if (err) {
                                            console.log("Error updating wall value in putItem users: " + err);
                                            callback(err);
                                        } else {
                                            console.log("Successfully added post");
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
    });
}

//TODO implement functions 
var addPostToOtherWall = function(authorUsername, wallUsername, content, callback) {
    console.log("adding post from " + authorUsername + " to " + wallUsername);
    //Create params to get count from table
    var params1 = {
        Key: {'inxid': {N: "0"}},
        TableName: "posts",
    };
    
    //get count to get indix value
    db.getItem(params1, function(err, data) {
        //if error getting count value, callbck(err)
        if (err || data.Item == null) {
            console.log("Error getting count value in table, getItem: " + err);	
            callback(err)
        //else, add post to table using count value + 1
        } else {
            var count = parseInt(data.Item.countVal.N) + 1;
            var countString = count.toString();
            var params = {
                Item: {
                    'creator_username': {S: authorUsername},
                    'wall_username': {S: wallUsername},
                    'content': {S: content},
                    'comments': {L: [{L: []}]},
                    'inxid': {N: countString} ,
                },
                TableName: "posts",
            };
             //Add post to the table, if successful update count row, if not successful callback error
            db.putItem(params, function(err, data) {
                //if error putting post into table, callback(err)
                if (err) {
                    //log error if it occurs
                    console.log("Error adding post to table in putItem: " + err);
                    callback(err);
                //else, update count row value
                } else {
                    var params2 = {
                        Item: {
                            'inxid': {N: "0"} ,
                            "countVal": {N: countString}
                        },
                        TableName: "posts",
                    };
                    db.putItem(params2, function(err, data){
                        //if error callback(err)
                        if (err) {
                            console.log("Error updating count value in putItem: " + err);
                            callback(err);
                        //else, add inxid to user wall list
                        } else {
                            var params3 = {
                                TableName: "users", 
                                Key: {"username": {'S':wallUsername}}, 
                            }
                            db.getItem(params3, function(err, data){
                                if (err || data == undefined) {
                                    console.log("Error getting wall value in getItem users: " + err);
                                    callback(err);
                                } else {
                                    var wallL = (data.Item.wall.NS);
                                    var newList = [];
                                    wallL.forEach(function(num){
                                        newList.push(num);
                                    });
                                    newList.push(countString);
                                    var params4 = {
                                        TableName: "users", 
                                        Item: {
                                            "username": {'S': wallUsername}, 
                                            "affiliation": data.Item.affiliation, 
                                            "birthday": data.Item.birthday, 
                                            "email_address": data.Item.email_address, 
                                            "first_name": data.Item.first_name, 
                                            "friends": data.Item.friends, 
                                            "last_name": data.Item.last_name, 
                                            "news_interests": data.Item.news_interests, 
                                            "password": data.Item.password, 
                                            "wall": {'NS': newList},
                                            "chat_invites": data.Item.chat_invites,
                                            "ongoing_chats": data.Item.ongoing_chats, 
                                            "room_id": data.Item.room_id,
                                            'userStatus': data.Item.userStatus,
                                        }
                                    }
                                    db.putItem(params4, function(err, data){
                                        if (err) {
                                            console.log("Error updating wall value in putItem users: " + err);
                                            callback(err);
                                        } else {
                                            console.log("Successfully added post");
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
    });
}
  
var deletePost = function(username, id, callback) {
    var params = {
        Key: {'inxid': {N: id}},
        TableName: "posts",
    };
    //delete item from post table
    db.deleteItem(params, function(err){
        //if error deleting console log, callback err
        if (err) {
            console.log("Error deleting post from post table: " + err);
            callback(err);
        //else, remove post from user wall
        } else {
            var params3 = {
                TableName: "users", 
                Key: {"username": {'S':username}}, 
            }
            db.getItem(params3, function(err, data){
                if (err || data == undefined) {
                    console.log("Error getting wall value in getItem users deletion: " + err);
                    callback(err);
                } else {
                    //get wall lsit
                    var wallL = (data.Item.wall.NS)
                    var newList = []
                    //find inxid and remove from list
                    wallL.forEach(function(num){
                        if (num != id) {
                            newList.push(num);
                        }
                    })
                    var params4 = {
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
                            "wall": {'NS': newList},
                            "chat_invites": data.Item.chat_invites,
                            "ongoing_chats": data.Item.ongoing_chats,  
                            "room_id": data.Item.room_id,
                            'userStatus': data.Item.userStatus,
                        }
                    }
                    db.putItem(params4, function(err, data){
                        if (err) {
                            console.log("Error deleting wall value in putItem users: " + err);
                            callback(err);
                        } else {
                            console.log("Successfully deleted post");
                            callback(err);
                        }
                    });
                }
            });
        }
    });
}
  var addComment = function(username, content, id, callback) {
      var params = {
            Key: {'inxid': {N: id}},
            TableName: "posts",
      };
      //get post from table, in order to change its contents
      db.getItem(params, function(err, data){
          //if error getting post, callback(err)
          if(err) {
              console.log("Error adding comment  in getItem posts: " + err);
              callback(err);
          //else, overwrite with new comments added
          } else {
              console.log(data.Item.comments.L);
              var commentL = data.Item.comments.L
              var stringSet = {"L": [{S: username}, {S: content}]};
              console.log("New String Set: " + stringSet.L[0] + ", " + stringSet.L[1]);
              
              var newList = []
              commentL.forEach(function(set){
                      console.log(set);
                      newList.push(set);
              })
              newList.push(stringSet);
              console.log(newList);
              var params1 = {
                  TableName: "posts",
                  Item: {
                      "inxid": {N: id},
                      "creator_username": data.Item.creator_username, 
                      "content": data.Item.content,
                      "comments": {L: newList}
                  }
              }
              db.putItem(params1, function(err){
                  if(err) {
                      console.log("Error adding comment in putItem posts: " + err);
                      callback(err);
                  } else {
                      callback(err);
                  }
              });
          }
      });
      
  }

var deleteComment = function(username, comment, id, callback) {
    var params = {
        Key: {'inxid': {N: id}},
        TableName: "posts",
    };
    //get post from table, in order to change its contents
    db.getItem(params, function(err, data){
        //if error getting post, callback(err)
        if(err) {
            console.log("Error deleting comment  in getItem posts: " + err);
            callback(err);
        //else, overwrite with new comments added
        } else {
            console.log(data.Item.comments.L);
            var commentL = data.Item.comments.L;
            
            var newList = [];
            commentL.forEach(function(set){
                if (set.L[0] != null && set.L[1] != null && set.L[1].S != comment) {
                    if(set.L[0].S == username) {
                        newList.push(set);
                    } 
                }
            });
            var params1 = {
                TableName: "posts",
                Item: {
                    "inxid": {N: id},
                    "creator_username": data.Item.creator_username, 
                    "content": data.Item.content,
                    "comments": {L: newList}
                }
            }
            db.putItem(params1, function(err){
                if(err) {
                    console.log("Error deleting comment in putItem posts: " + err);
                    callback(err);
                } else {
                    callback(err);
                }
            });
        }
    });
};

var getWall = function(username, callback) {
    var params = {
        ExpressionAttributeValues: {
            ':u': {S: username}
        },
        KeyConditionExpression: 'username = :u',
        TableName: "users"
    };
  
      // query the database for the friends list
    db.query(params, function(err, data) {
        if (err || !username) {
            //log error if it occurs
            console.log(err);
            callback(err, []);
        } else {
            var postList = [];
            data.Items[0].wall.NS.forEach(function(post){
                postList.push({'inxid': {'N': post}});
            })

            var postParams = {RequestItems: {}};
            postParams.RequestItems['posts'] = {
                Keys: postList,
                //define fields
                ProjectionExpression: 'inxid, content, creator_username, wall_username, comments'
            };

            db.batchGetItem(postParams, function(err, batchData) {
                if (err) {
                    console.log("batch error: " + err);
                    //callback(err, null);
                } else {
                    console.log(batchData.Responses.posts);
                    callback(err, batchData.Responses.posts);
                }
            });
        }
    });
}
  

var database = { 
    get_wall: getWall,
    add_post: addPost,
    delete_post: deletePost,
    add_comment: addComment,
    delete_comment: deleteComment,
    get_feed: getFeed,
    add_post_to_other_wall: addPostToOtherWall
};
  
module.exports = database;
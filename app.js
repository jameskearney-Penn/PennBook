var express = require('express');
var app = express();
const http =  require('http').Server(app);
var io = require('socket.io')(http);
var session = require('express-session');
var serveStatic = require('serve-static'); 
var morgan = require('morgan');
var path = require('path'); 
app.use(express.urlencoded());
app.use(session({
    secret: 'null',
    chat_id: 0,
    gname: 'null',
    prev_chats: [],
}));
app.use(morgan('combined'));
app.use(serveStatic(path.join(__dirname, 'public')));

/////////////////////////////////////////
////////////// ROUTES ///////////////////
/////////////////////////////////////////

//User-focused routes
var userRoutes = require('./routes/userRoutes.js');
app.get('/', userRoutes.get_main);
app.get('/signup', userRoutes.sign_up);
app.get('/logout', userRoutes.logout);
app.get('/userprofile', userRoutes.user_profile); // only renders the page to edit user profile
app.get('/viewfriends', userRoutes.view_friends); // Only renders the page to view friends
app.get('/updatefriends', userRoutes.update_friends); // Only renders the page to view friends
app.get('/allusers', userRoutes.all_users);
app.get('/getFriends/:user', userRoutes.visual_friends);
app.post('/createaccount', userRoutes.create_account);
app.post('/checklogin', userRoutes.check_login);
app.post('/editprofile', userRoutes.edit_profile); 
app.post('/addfriend', userRoutes.add_friend);
app.post('/deletefriend', userRoutes.delete_friend);
app.post('/searchUsers', userRoutes.search_users);
app.post('/likearticle', userRoutes.like_article);
app.post('/searchnews', userRoutes.search_news);

//VISUALIZER
app.get('/visual', userRoutes.get_visual);
app.get('/friendvisualization', userRoutes.visual_initial);


//Post-focused routes
var postRoutes = require('./routes/postRoutes.js');
app.get('/wall', postRoutes.get_wall);
app.get('/feed', postRoutes.get_feed);
app.get('/getAddPost', postRoutes.get_add_post); // Only renders the page to view friends
app.get('/friendsProfiles', postRoutes.friends_profile);
app.get('/getAddPostToOtherWall', postRoutes.get_add_post_to_other_wall);
app.post('/addPostToOtherWall', postRoutes.add_post_to_other_wall);
app.post('/addPost', postRoutes.add_post);
app.post('/deletePost', postRoutes.delete_post);
app.post('/addComment', postRoutes.add_comment);
app.post('/deleteComment', postRoutes.delete_comment);

//app.post('/dislikearticle', postRoutes.dislike_post);  

//Chat-focused routes
var chatRoutes = require('./routes/chatRoutes.js');
app.get('/chat', chatRoutes.get_chat);
app.get('/chatInvite', chatRoutes.chat_invite); //all currrent invites from a given user
app.get('/leaveChat', chatRoutes.leave_chat);
app.post('/invite', chatRoutes.invite); //invite a user to chat
app.post('/joinChat', chatRoutes.join_chat);
app.post('/addMember', chatRoutes.add_member);
app.post('/leaveChat', chatRoutes.leave_chat);
app.post('/addChatMessage', chatRoutes.add_chat_message);
app.post('/reject', chatRoutes.reject_invite);
app.post('/remove', chatRoutes.remove_chat);


/////////////////////////////////////////
////////////// SOCKET ///////////////////
/////////////////////////////////////////
io.on('connection', (socket) => {
    console.log("CONNECTED: " + socket.id);
    // handles new connection
    socket.emit('connected', {id: socket.id});

    socket.on("join room", (room) => {
        console.log("Joining room: " + room);
        socket.join(room);
    });

    socket.on("leave room", room => {
        socket.leave(room);
    });

    // handles message posted by client
    socket.on("chat message", obj => {
        console.log("server got chat message: " + obj.content);
        io.to(obj.room).emit("new chat message", obj);
    });
});

http.listen(80);
console.log('Server running on port 8080. Now open http://localhost:8080/ in the browser!');
   
<!DOCTYPE html>
<html>
<head>
	<title>My Friends</title>
	<!-- CSS only -->
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi" crossorigin="anonymous">
	
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Mono">
    <link type="text/css" rel="stylesheet" href="../css/index.css">
</head>
<body>
	<nav class="navbar navbar-expand-lg navbar-dark">
	  <a class="navbar-brand" href="/">PennBook</a>
	  <ul class="navbar-nav">
	  	<li class="nav-item"><a class="nav-link" href="/wall">Wall</a></li>
	  	<li class="nav-item"><a class="nav-link text-white" href="/viewfriends">Friends</a></li>
	  	<li class="nav-item"><a class="nav-link" href="/userprofile">Profile</a></li>
	  	<li class="nav-item"><a class="nav-link" href="/allusers">All Users</a></li>
	  	<li class="nav-item"><a class="nav-link" href="/logout">Logout</a></li>
	  	<li class="nav-item"><a class="nav-link" href="/visual">Visualizer</a></li>
	  	<li class="nav-item"><a class="nav-link" href="/chatInvite">Chat</a></li>
	  </ul>
</nav>
	
	<div class="container">
	  	<%if (error != null) { %>
				<div class="card text-white bg-danger mb-3 mt-3">
				  <div class="card-body">
				    <h5 class="card-title">Uh Oh!</h5>
				    <p class="card-text"><%= error %></p>
				  </div>
				</div>
			<% } %>
			
	<h1 class="text-center mt-3">My Friends</h1>
	<p class="text-center mt-3">Below is a list of your friends. View their profile or click to delete them from your friends list.</p>
	<table class="table table-borderless">
		<thead>
			<tr>
				<th>Username</th>
				<th>Status</th>
				<th>Invite to Chat</th>
				<th>Delete</th>
			</tr>
		</thead>
		<tbody id="friendTable">
			
		</tbody>
	</table>
  	</div>
  	<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
  	<script>
  	
  		function addFriendsToTable(inputArr) {
  			var today = new Date();
  			var theInnerHTML = "";
  			for (let i = 0; i < inputArr.length; i++) {
				theInnerHTML += "<tr>" + 
		  			"<td>" +
		  			'<form action="/friendsProfiles" method="post">'+
							'<input type="hidden" class="form-control" id="user" name="user" value='+ inputArr[i].username.S +'>'+
							'<div>'+
								'<button type="submit" class="btn btn-link text-decoration-none">'+inputArr[i].username.S +'</button>'+
							'</div>'+
					'</form>'+
		  			'</td>';
	  			if (inputArr[i].userStatus.S == 0 || inputArr[i].userStatus.S.substring(0, 4) < today.getFullYear() || inputArr[i].userStatus.S.substring(5, 7) < today.getMonth() + 1 || inputArr[i].userStatus.S.substring(8, 10) < today.getDate() || inputArr[i].userStatus.S.substring(11, 13) < (today.getHours() - 6)) { 
					theInnerHTML += '<td class="text-secondary">Not Active</td>'+
					'<td><button action="" type="button" class="btn btn-outline-secondary" disabled>Inactive</button></td>';
				} else { 
					theInnerHTML += '<td class="text-success">Active</td>'+
					' <td>'+
						'<form action="/invite" method="post">'+
							'<input type="hidden" class="form-control" id="invite" name="invite" value="'+inputArr[i].username.S +'">'+
							'<div>'+
								'<button class="btn btn-outline-success">'+
								'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat" viewBox="0 0 16 16">'+
								'  <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>'+
							'	</svg>'+
							'	Chat'+
							'	</button>'+
							'</div>'+
						'</form>'+
					'</td>';
				 }
				theInnerHTML += '<td>'+
			'	<form action="/deletefriend" method="post">'+
					 ' <input type="hidden" class="form-control" id="friend_name" name="friend_name" value="'+ inputArr[i].username.S+'">'+
		           '   <div>'+
						' <button type="submit" class="btn btn-danger">'+
						' <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-dash" viewBox="0 0 16 16">'+
						'	<path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM11 12h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1Zm0-7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>'+
					   	'    <path d="M8.256 14a4.474 4.474 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10c.26 0 .507.009.74.025.226-.341.496-.65.804-.918C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4s1 1 1 1h5.256Z"/>'+
						'</svg>'+
						' Remove Friend'+
						' </button>'+
					 ' </div>'+
				'</form>'+
				'</td>'+
			'</tr>';
		   }
  			
  		 $('friendTable').innerHTML = theInnerHTML;
  		}
  	
  		$(document).ready(function () {
  			var myArr = [];
  			var lenOfArr = <%= listUsers.length %>;
  			for (let x = 0; x < lenOfArr; x++) {
  				var newData = <%= listUsers[x]%>;
  				myArr.push(newData);
  			}
  			addFriendsToTable(myArr);
  		});
  	
		var reloadTimer = setInterval(refreshFriends, 5000); // set the timer for 10 second
		var currFri = <%= listUsers.length %>;
		function refreshFriends() { // reload the page every 10 seconds
			$.get("/updatefriends", function(res) {
				if (res.newData.length != currFri ) {
					addFriendsToTable(res.newData);
				}
				console.log("Friends are up to date");
			});
		}
		
		
	</script>git 
</body>
</html>

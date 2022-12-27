const fs = require('fs');
const exec = require('child_process').exec 
// The following are the command line interface commands used to refresh the user recommendations:
exec('java ComputeRanks.java');	
	 
// The following is included in the userDatabase.js file in order to allow updating the user interests
//    and updating the news recommendations 
function updateFilesForRecs() {
	var sparams = {
		TableName: "users",
		AttributesToGet: ["username", "articles_liked", "friends", "news_interests"]
	};
	  
	//Query the table and return data if found
	db.scan(sparams, function(err, data) {
		if (err) {
			console.log("THIS IS THE ERR: " + err);
		} else {
			let friendsData = "";
			let intData = "";
			let articleLikeData = "";
					
			for (x in data.Items) {
				let art_liked = null;
						
				if (!(data.Items[x].articles_liked == undefined)) {
					art_liked = data.Items[x].articles_liked.NS;
					for (oneArt in art_liked) {
						articleLikeData += data.Items[x].username.S + " " + art_liked[oneArt] + "\n";
					}
				}
					
				for (oneFriend in data.Items[x].friends.SS) {
					friendsData += data.Items[x].username.S + " " + data.Items[x].friends.SS[oneFriend] + "\n"; 
				}
						
				for (oneInt in data.Items[x].news_interests.SS) { // TODO TEST THIS
					intData += data.Items[x].username.S + " " + (data.Items[x].news_interests.SS[oneInt]).toUpperCase() + "\n"; 
				}
			}
			//console.log("File Data: " + fileData);
			fs.writeFile('../files/outputFriends.txt', friendsData, (err) => {
				if (err) throw err;
			});
			fs.writeFile('../files/outputLikes.txt', articleLikeData, (err) => {
				if (err) throw err;
			});
			fs.writeFile('../files/outputInterests.txt', intData, (err) => {
				if (err) throw err;
			});
		}
	});
}

const fs = require('fs');

	var sparams = {
	        TableName: "users",
	        AttributesToGet: ["username", "articles_liked", "friends", "news_interests"]
	};
  
   //Query the table and return data if found
	db.scan(sparams, function(err, data) {
	       if (err) {
	           console.log("THIS IS THE ERR: " + err);
	       } else {
				let fileData = "";
				
				
				
			   for (x in data.Items) {
					let art_liked = null;
					
					if (!(data.Items[x].articles_liked == undefined)) {
						art_liked = data.Items[x].articles_liked.NS;
					}
				  fileData += data.Items[x].username.S + " " + art_liked + " " + data.Items[x].friends.SS + " " + data.Items[x].news_interests.SS + "\n"; 
			   }
			   console.log("File Data: " + fileData);
			   fs.writeFile('outputUsers.txt', fileData, (err) => {
				if (err) throw err;
				});
	       }
	   });
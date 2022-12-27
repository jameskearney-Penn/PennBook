package edu.upenn.cis.nets2120.hw3;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Comparator;
import java.util.Date;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.hadoop.shaded.org.apache.commons.collections.ListUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.ScanRequest;
import com.amazonaws.services.dynamodbv2.model.ScanResult;

import edu.upenn.cis.nets2120.config.Config;
import edu.upenn.cis.nets2120.storage.SparkConnector;
import edu.upenn.cis.nets2120.storage.DynamoConnector;
import scala.Tuple2;

public class ComputeRanks {
	/**
	 * The basic logger
	 */
	static Logger logger = LogManager.getLogger(ComputeRanks.class.getName());

	/**
	 * Connection to Apache Spark
	 */
	SparkSession spark;
	
	DynamoDB db;
	AmazonDynamoDB client;
	Table usersTable;
	
	JavaSparkContext context;
	
	static double d_max;  // default value of d_max is 30
	static int i_max;     //default value of i_max is 25
	static boolean debug_mode; // default value is false
	
	public ComputeRanks() {
		System.setProperty("file.encoding", "UTF-8");
	}

	/**
	 * Initialize the database connection and open the file
	 * 
	 * @throws IOException
	 * @throws InterruptedException 
	 */
	public void initialize() throws IOException, InterruptedException {
		logger.info("Connecting to Spark...");

		spark = SparkConnector.getSparkConnection();
		context = SparkConnector.getSparkContext();
		
		//logger.info("Connecting to DynamoDB...");
		//db = DynamoConnector.getConnection(Config.DYNAMODB_URL);
		//client = AmazonDynamoDBClientBuilder.standard().build();
		
		logger.debug("Connected!");
	}
	
	
	/**
	 * Map each article to its category
	 * 
	 * @param filePath
	 * @return JavaPairRDD: (category: string, article: int)
	 */
	JavaPairRDD<String,String> getArtCat(String filePath) {
		Calendar cal = Calendar.getInstance();
		SimpleDateFormat myDate = new SimpleDateFormat("yyyymmdd");
		int todaysDate = Integer.parseInt(myDate.format(cal.getTime()));
		// Load the file filePath into an RDD (take care to handle both spaces and tab characters as separators)
		JavaPairRDD<String, String> art_cat = context.textFile(filePath)
				.mapToPair(line -> { // map each line to an edge of the form (followed, follower)
					String[] lineStr = line.toString().split("\",\""); // handle spaces and tabs
					if (Integer.parseInt(lineStr[3]) <= todaysDate) {
						// tuples will be of form (followed, follower)
						return new Tuple2<String, String>(lineStr[0].substring(1), lineStr[3]);
					} else {
						return null;
					}
				});
		//art_cat.<String, String> revartCat = art_cat.mapToPair(x -> {
		//	return new Tuple2<String, String>(x._2, x._1);
		//});
		
		//JavaPairRDD<String, String> unionArtCat = art_cat.union(revartCat);
		
		return art_cat.distinct(); // return the distinct values, so no edges are repeated
	}
	
	JavaPairRDD<String, String> getUserInterests(String filePath) {
		 //   ScanRequest scanOfTable = new ScanRequest().withTableName("users");
		  
		    //Query the table and return data if found
		//    ScanResult resultsOfScan = client.scan(scanOfTable);
		//    List<Map<String, AttributeValue>> itemsFromScan = resultsOfScan.getItems();
		//    for (Map<String, AttributeValue> x : itemsFromScan) {
		//    	System.out.println("here is one x: " + x);
		//    }
		JavaPairRDD<String, String> user_int = context.textFile(filePath)
				.mapToPair(line -> { // map each line to an edge of the form (followed, follower)
 					//if (line.contains("Business")) {// get the interests
					//	intArr 
					//} 
					String[] lineStr = line.toString().split(" "); // get the username
					// tuples will be of form (followed, follower)
					return new Tuple2<String, String>(lineStr[0], lineStr[1]);
				});
				
		//JavaPairRDD<String, String> revUserInt = user_int.mapToPair(x -> {
		//	return new Tuple2<String, String>(x._2, x._1);
		//});
		
		//JavaPairRDD<String, String> unionInterests = user_int.union(revUserInt);
		
		return user_int.distinct();
	}
	
	// Make the friends RDD, for if two users are friends with each other
	JavaPairRDD<String, String> getFriendsRDD(String filePath) {
		JavaPairRDD<String, String> friendsRDD = context.textFile(filePath)
				.mapToPair(line -> { // map each line to an edge of the form (followed, follower)
					String[] lineStr = line.toString().split(" "); // get the username
					// tuples will be of form (followed, follower)
					return new Tuple2<String, String>(lineStr[0], lineStr[1]);
				});
				//.flatMap( case (key, values) => values.map((key, _)));
		return friendsRDD.distinct();
	}
	
	// Get the articles liked RDD, that tells which articles which users liked (user, article liked)
	JavaPairRDD<String, String> getLikedArtRDD(String filePath) {
		JavaPairRDD<String, String> likedArtRDD = context.textFile(filePath)
				.mapToPair(line -> { // map each line to an edge of the form (followed, follower)
					String[] lineStr = line.toString().split(" "); // get the username
					if (!lineStr[1].equals("null") || !lineStr[1].equals(null)) {
						return new Tuple2<String, String>(lineStr[0], lineStr[1]);
					} else {
						return null;
					}
					// tuples will be of form (followed, follower)
				});
		
		//JavaPairRDD<String, String> revLikedArtRDD = likedArtRDD.mapToPair(x -> {
	//		return new Tuple2<String, String>(x._2, x._1);
	//	});
		
		//JavaPairRDD<String, String> distinctArtNodes = likedArtRDD.union(revLikedArtRDD);
		return likedArtRDD.distinct();
	}
	

	/**
	 * Main functionality in the program: read and process the social network
	 * 
	 * @throws IOException File read, network, and other errors
	 * @throws InterruptedException User presses Ctrl-C
	 */
	public void run() throws IOException, InterruptedException {
		logger.info("Running");
		
		double decay_factor = 0.15; // decay_factor, 0.15 for this assignment
		
		// Load the social network (category, article)
		JavaPairRDD<String, String> artCatRDD = getArtCat(Config.CURR_NEWS_DATAFILE);
//		artCatRDD.foreach(x -> System.out.println("Here is artcat edges: " + x));
//		System.out.println();
//		
		//Get the categories that each user has as an interest (user, interest)
		JavaPairRDD<String, String> userInterestRDD = getUserInterests(Config.INTEREST_DB_FILE);
//		userInterestRDD.foreach(x -> System.out.println("Here is userInterestRDD edges: " + x));
//		System.out.println();
//		
		// Make the friends RDD, for if two users are friends with each other
		JavaPairRDD<String, String> friendsRDD = getFriendsRDD(Config.FRIEND_DB_FILE);
//		friendsRDD.foreach(x -> System.out.println("Here is artcat edges: " + x));
//		System.out.println();
				
		// Get the articles liked RDD, that tells which articles which users liked (user, article liked)
		JavaPairRDD<String, String> artLikedRDD = getLikedArtRDD(Config.ARTICLE_LIKE_DB_FILE);
//		artLikedRDD.foreach(x -> System.out.println("Here is artcat edges: " + x));
//		System.out.println();
//			
		
		JavaPairRDD<String, String> articleOutgoingEdges = artLikedRDD
				.mapToPair(x -> {return new Tuple2<String, String>(x._2, x._1);})
				.union(
						artCatRDD.mapToPair(x -> {return new Tuple2<String, String>(x._2, x._1);})
				);
		
//		System.out.println();
//		articleOutgoingEdges.foreach(x -> System.out.println("Here is ARTOUTGOING edges: " + x));
		
		JavaPairRDD<String, String> catOutgoingEdges = userInterestRDD
				.mapToPair(x -> {return new Tuple2<String, String>(x._2, x._1);})
				.union(artCatRDD);
		
//		catOutgoingEdges.foreach(x -> System.out.println("Here is CAT OUTGOING edges: " + x));
		// Create one big RDD of the graph
		//JavaPairRDD<String, String> totalGraph = artCatRDD.union(userInterestRDD).union(friendsRDD).union(artLikedRDD);
		
		//artCatRDD.foreach(x -> System.out.println("HERE IS THE Article: " + x));
		//friendsRDD.foreach(x -> System.out.println("HERE IS THE friends: " + x));
		//userInterestRDD.foreach(x -> System.out.println("HERE IS THE interest: " + x));
		//artLikedRDD.foreach(x -> System.out.println("HERE IS THE liked: " + x));
		
		//totalGraph.foreach(x -> System.out.println("Here a piece of the total graph: " + x));
		
		// map each edge to a value of 1, sum up the number of edges extending from each node, 
		//find 1/n_b by summing and taking the reciprocal for each node
		JavaPairRDD<String, Double> artLikedNodeTransfer = 
				artLikedRDD.mapToPair(p -> new Tuple2<String, Double>(p._1, 1.0))
				.reduceByKey((x, y) -> x + y)
				.mapToPair(p -> new Tuple2<String, Double>(p._1, 0.4 / p._2));
		
		//artLikedNodeTransfer.foreach(x -> System.out.println("Here is artLike transfer: " + x));
		
		JavaPairRDD<String, Double> friendsNodeTransfer = friendsRDD.mapToPair(p -> new Tuple2<String, Double>(p._1, 1.0))
				.reduceByKey((x, y) -> x + y)
				.mapToPair(p -> new Tuple2<String, Double>(p._1, 0.3 / p._2));
		
		//friendsNodeTransfer.foreach(x -> System.out.println("Here is friends transfer: " + x));
		
		JavaPairRDD<String, Double> userInterestNodeTransfer = userInterestRDD.mapToPair(p -> new Tuple2<String, Double>(p._1, 1.0))
				.reduceByKey((x, y) -> x + y)
				.mapToPair(p -> new Tuple2<String, Double>(p._1, 0.3 / p._2));
		
		//userInterestNodeTransfer.foreach(x -> System.out.println("Here is userInt transfer " + x));
		
		JavaPairRDD<String, Double> categoryOutgoingEdgesTransfer = catOutgoingEdges.mapToPair(p -> new Tuple2<String, Double>(p._1, 1.0))
				.reduceByKey((x, y) -> x + y)
				.mapToPair(p -> new Tuple2<String, Double>(p._1, 1.0 / p._2));
		
		//categoryOutgoingEdgesTransfer.foreach(x -> System.out.println("Here is artCat transfer " + x));
		
		JavaPairRDD<String, Double> articleOutgoingEdgesTransfer = articleOutgoingEdges.mapToPair(p -> new Tuple2<String, Double>(p._1, 1.0))
				.reduceByKey((x, y) -> x + y)
				.mapToPair(p -> new Tuple2<String, Double>(p._1, 1.0 / p._2));
		
		System.out.println();
		//articleOutgoingEdgesTransfer.foreach(x -> System.out.println("Here is OUTGOING OF ART transfer " + x));
		
//		// join the edge RDD with the node transfer RDD to get an RDD of the form: (x, (y, transferredRank)), 
//		//where x is the node with an outward edge to y, and the transferred rank is the amount of rank that is given to y
		JavaPairRDD<String, Tuple2<String, Double>> articleOutEdgeTransferRDD = 
				articleOutgoingEdges.join(articleOutgoingEdgesTransfer); 
		JavaPairRDD<String, Tuple2<String, Double>> friendsEdgeTransferRDD = 
				friendsRDD.join(friendsNodeTransfer); 
		JavaPairRDD<String, Tuple2<String, Double>> catOutEdgeTransferRDD = 
				catOutgoingEdges.join(categoryOutgoingEdgesTransfer); 
		JavaPairRDD<String, Tuple2<String, Double>> userInterestEdgeTransferRDD = 
				userInterestRDD.join(userInterestNodeTransfer); 
		JavaPairRDD<String, Tuple2<String, Double>> artLikedEdgeTransferRDD = 
				artLikedRDD.join(artLikedNodeTransfer); 
//
//		articleOutEdgeTransferRDD.foreach(x -> System.out.println("Here is artLikeOUT transfer: " + x));
			System.out.println();
//			friendsEdgeTransferRDD.foreach(x -> System.out.println("Here is friends transfer: " + x));
//		System.out.println();
//		catOutEdgeTransferRDD.foreach(x -> System.out.println("Here is catout transfer: " + x));
			System.out.println();
//            userInterestEdgeTransferRDD.foreach(x -> System.out.println("Here is userint(catin) transfer: " + x));
 			System.out.println();
// 			artLikedEdgeTransferRDD.foreach(x -> System.out.println("Here is artlicle liked transfer: " + x));
//
		JavaPairRDD<String, Tuple2<String, Double>> allEdgeTransferRDD = friendsEdgeTransferRDD
				.union(userInterestEdgeTransferRDD).union(artLikedEdgeTransferRDD);
				//.union(articleOutEdgeTransferRDD).union(catOutEdgeTransferRDD); 
		//allEdgeTransferRDD.foreach(x -> System.out.println("Here is artlicle liked transfer: " + x));		
		
		JavaRDD<String> allGraphNodes = (friendsRDD.keys()).distinct();
//		// Set the initial social rank of each node to be 1.0
		JavaPairRDD<String, Double> socialRankRDD = allGraphNodes.mapToPair(p -> {
					return new Tuple2<String, Double>(p, 1.0);
		});
		
//		(allEdgeTransferRDD).foreach(x -> System.out.println("Here is social rank: " + x));
		System.out.println();
//		allGraphNodes.foreach(x -> System.out.println("Here is node rank: " + x));
		
		// Calculate the social rank of the nodes
		for (int curr_i = 0; curr_i < i_max; curr_i++) {
//			// contains the sum of the amount transferred to a given node from each individual user
			JavaPairRDD<String, Tuple2<String, Double>> propagateRDD = allEdgeTransferRDD
					.join(socialRankRDD)
					.mapToPair(p -> new Tuple2<String, Tuple2<String, Double>>(p._1, new Tuple2<String, Double>(p._2._1._1, p._2._2 * p._2._1._2)));
			
			System.out.println("here is the I : " + curr_i);
//			if (curr_i == 2 || curr_i == 7) {
//				propagateRDD.foreach(x -> System.out.println("Here is node rank: " + x));
//				System.out.println();
//			}
			
			// reduce the above to determine how much each person gets from each user..
			// sums the amount propagated, and uses the formula for social rank to determine the new social rank of a node
			JavaPairRDD<String, Double> newSocialRankRDD = propagateRDD
				.mapToPair(p ->	{ return new Tuple2<String, Double>(p._1, decay_factor + (1 - decay_factor) * p._2._2);})
			    .reduceByKey((x, y) -> x + y);
			
			
			// joins the new social rank with the old social rank, to calculate the change from the old to the new
			JavaPairRDD<String, Double> joinOldNew = newSocialRankRDD.join(socialRankRDD)
					.mapToPair(p -> {
						return new Tuple2<String, Double>(p._1, Math.abs(p._2._1 - p._2._2));
					});
			
			socialRankRDD = newSocialRankRDD; // sets the social rank RDD equal to the calculated values for this iteration
		}		
		// sort the RDD by value in descending order
		JavaPairRDD<String, Double> sortedRDD = socialRankRDD.mapToPair(p -> new Tuple2<String, Double>(p._1, p._2)).sortByKey(false);
				
		logger.info("*** Finished social network ranking! ***");
	}


	/**
	 * Graceful shutdown
	 */
	public void shutdown() {
		logger.info("Shutting down");

		if (spark != null)
			spark.close();
	}
	
	

	public static void main(String[] args) {
		d_max = 0.001;  // default value of d_max is 30
		i_max = 15;     //default value of i_max is 25
		debug_mode = false;
		if (args.length > 0) { // checks if there are user-inputted args
			d_max = Integer.parseInt(args[0]); // sets d_max to the first value
			if (args.length >= 2) { 
				i_max = Integer.parseInt(args[1]); // sets i_max to the second value, if present
				if (args.length >= 3) {
					debug_mode = true; // sets debug_mode to true if a third arg is present
				}
			}
		}
		
		final ComputeRanks cr = new ComputeRanks();
		
		try {
			cr.initialize();

			cr.run();
		} catch (final IOException ie) {
			logger.error("I/O error: ");
			ie.printStackTrace();
		} catch (final InterruptedException e) {
			e.printStackTrace();
		} finally {
			cr.shutdown();
		}
	}

}

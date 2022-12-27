package edu.upenn.cis.nets2120.config;

/**
 * Global configuration for NETS 2120 homeworks.
 * 
 * A better version of this would read a config file from the resources,
 * such as a YAML file.  But our first version is designed to be simple
 * and minimal. 
 * 
 * @author zives
 *
 */
public class Config {
	/**
	 * DynamoDB config data from HW2
	 */
	
	/**
     * If we set up a local DynamoDB server, where does it listen?
     */
    public static int DYNAMODB_LOCAL_PORT = 8000;

    /**
     * This is the connection to the DynamoDB server, which defaults
     * to local...
     */
    public static String DYNAMODB_URL = "https://dynamodb.us-east-1.amazonaws.com";
  //"http://localhost:8000";
    /**
     * Do we want to use the local DynamoDB instance or a remote one?
     * 
     * If we are local, performance is really slow - so you should switch
     * to the real thing as soon as basic functionality is in place.
     */
    public static Boolean LOCAL_DB = false;

	
	
	/**
	 * The path to the space-delimited social network data
	 */
	 //public static String SOCIAL_NET_PATH = "s3a://nets2120/twitter_combined.txt";
	//public static String NEWS_DATAFILE = "target/News_Category_dataset_v3.json";
	public static String HEAD_NEWS_DATAFILE = "target/testData.csv";
	public static String CURR_NEWS_DATAFILE = "target/fullFileData.csv";
	public static String FRIEND_DB_FILE = "target/outputFriends.txt";
	public static String INTEREST_DB_FILE = "target/outputInterests.txt";
	public static String ARTICLE_LIKE_DB_FILE = "target/outputLikes.txt";
	
	//public static String BIGGER_SOCIAL_NET_PATH = "s3a://nets2120/soc-LiveJournal1.txt";
	
	public static String LOCAL_SPARK = "local[*]";

	/**
	 * How many RDD partitions to use?
	 */
	public static int PARTITIONS = 5;
}

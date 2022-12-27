import java.io.BufferedReader;
import java.io.FileReader;
import java.io.FileWriter;

//This file was used in initially converting the news dataset to a readable CSV format
class convertFileToCSV {
	public static void main(String[] args) {
	    try {
	      // Creates a FileReader
	      FileReader file = new FileReader("src/News_Category_Dataset_v3.txt");
	      BufferedReader fileStream = new BufferedReader(file);
	      FileWriter fileW = new FileWriter("src/newFileData.csv");
	      int counter = 1;
	      String nextData; 
	      fileW.write("category,headline,authors,inxid,link,short_description,date\n");
	      while((nextData = fileStream.readLine()) != null) {
	    	  
	    	  if (!nextData.substring(0, 6).equals("{\"link")) {
	    		  String newLines = nextData.replace("\", \"link\": \"", "\",\"" + Integer.toString(counter) + "\",\"");
		    	  newLines = newLines.replace("\", \"headline\": \"", "\",\"");
		    	  newLines = newLines.replace("{\"category\": \"", "\"");
		    	  newLines = newLines.replace(", \"short_description\": \"", ",\"");
		    	  newLines = newLines.replace("\", \"authors\": \"", "\",\"");
		    	  newLines = newLines.replace("\", \"date\": ", "\",");
		    	  newLines = newLines.substring(0, newLines.length()-1);
		    	  counter++;	    	  
		    	  System.out.println(newLines);
		    	  System.out.println();
		    	  fileW.write(newLines + "\n");
	    	  }
	      }
	      // Closes the reader
	      fileW.close();
	      file.close();
	    }
	    catch(Exception e) {
	      System.out.println("here");
	      e.getStackTrace();
	    }
	  }
}
  
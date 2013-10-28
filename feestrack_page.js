
/**
 * Module dependencies.
 */
"use strict";

var mysql = require('mysql'),
	http  = require('http'),
	url = require('url'),
	querystring = require('querystring');


// Start a web server on port 8888. Requests go to function handleRequest

http.createServer(handleRequest).listen(3000);



//Function that handles http requests.

function handleRequest(request, response) {
	
	// Page HTML as one big string, with placeholder "DBCONTENT" for data // from the database

	var currentDate = new Date();
    var day = currentDate.getDate();
    var month = currentDate.getMonth() + 1;
    var year = currentDate.getFullYear();
                      

	var pageContent = '<html>' +
	                  '<head>' +
                      
	                  '<meta http-equiv="Content-Type" ' +
	                  'content="text/html; charset=UTF-8" />' +
	                  '<script>'+
   						'function enable_text(checkboxID, toggleID)'+
   						'{'+
							'var checkbox = document.getElementById(checkboxID);'+
							'var toggle = document.getElementById(toggleID);'+
							'updateToggle = checkbox.checked ? toggle.disabled=true : toggle.disabled=false;'+
  	    				'}'+
  	    			  '</script>'+

	                  '</head>' +
	                  '<body>' +
	                  '<form action="/add" method="post" name=f1 id=f1>' +
	                  '<input type="text" name="studentname" placeholder = "  Student Name  ">' + 
	                  'Mark Attendance:'+
	                  'Present'+
	                  '<input id ="chk1" type="checkbox" name="attendancep" value= "present" onclick=javascript:document.f1.chk2.checked=!document.f1.chk1.checked;>' +
	                  'Absent'+
	                  '<input id ="chk2" type="checkbox" name="attendancea" value = "absent" onclick=javascript:document.f1.chk1.checked=!document.f1.chk2.checked;>' +
	                  'Hours Attended:'+
	                  '<select name="hrsattended">' +
	                  '<option 12>12'+
	                  '<option 24>24'+
	                  '<option 36>36'+
	                  
	                  '<input type="text" name="totalhrs" placeholder = "  Total Hours">' +
	                  '<input type="submit" value="Update Attendance" />' +
	                  '</form>' +
	                  '<div>' +
	                  '<strong>Content in database:</strong>' +
	                  '<pre>' +
	                  'DBCONTENT' +
	                  '</pre>' +
	                  '</div>' +
	                  '<form action="/" method="get" name=f2 id=f2>' +
	                  '<input type="text" name="q">' +
	                  '<input type="submit" value="Filter student" placeholder = "  Student Name" />' +
	                  '</br>'+
                      'Fees Status: '+
                      'Current Date: ' + day + '/' + month + '/' + year + 
	                  '  Paid'+
	                  '<input type="checkbox" id="chk3" name="Paid" onclick=javascript:document.f2.chk4.checked=!document.f2.chk3.checked;>'+
	                  
	                  '  Due'+
	                  '<input type="checkbox" id="chk4" name="Due" onclick= javascript:document.f2.chk3.checked=!document.f2.chk4.checked;>'+
	                  '<div id="theContainer1" disabled>'+
	                  '<input type="text" id="Duedatetxt" name="Duedate" placeholder = "  Due date  " >'+
	                  '</div>'+
	                  '<input type="submit" id="Paybtn" value="Pay" />'+
	                  '</form>' +
	                  
	                  '</body>' +


	                  '</html>';
        
					  


	// Parsing the requested URL path in order to distinguish between the /page and /add route

	var pathname = url.parse(request.url).pathname;

	// User wants to add content to the database (POST request to /add)

	if (pathname == '/add') {
		var requestBody = '';
		var postParameters;
		request.on('data', function (data) {
			requestBody += data;
		});
		request.on('end', function() {
			postParameters = querystring.parse(requestBody);
			// The content to be added is in POST parameter "content"
		    addContentToDatabase(postParameters.studentname,postParameters.present,postParameters.absent,postParameters.hrsattended,postParameters.totalhrs, function() {
		    	//Redirect to the home page adding the new content to db
		    	response.writeHead(302, {'Location': '/'});
		    	response.end();
			});
		});
	//User wants to read data from the database (GET request to /)	
	} else {
	  // The text to use for filtering is in GET parameter "q"
	  var filter = querystring.parse(url.parse(request.url).query).q;
	  getContentsFromDatabase(filter, function(contents) {
	  	response.writeHead(200, {'Content-Type': 'text/html'});
	  	response.write(pageContent.replace('DBCONTENT', contents));
	  	response.end();
	  });
	}
}




//Function that is called by the code that handles the / route and 
//retrieves contents from the database, applying a LIKE filter if one 
//was suppplied

function getContentsFromDatabase(filter, callback) {
	var connection = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: 'ab_1234',
		database: 'StudentDB'
	});
	/*connection.query('CREATE DATABASE StudentDB', function(err) {
	if (err) {
		console.log('Could not create database "StudentDB".');
		}
	});

	connection.query('USE StudentDB', function(err) {
		if (err) {
			console.log('Could not switch to database "StudentDB".');
		}
	});

	connection.query('CREATE TABLE students ' +
		'(id INT(11) AUTO_INCREMENT, ' +
		' studentname VARCHAR(255), ' +
		' studentemail VARCHAR(255), ' +
		' studentcontactnum VARCHAR(255), ' +
		' studentfeesstatus VARCHAR(255), ' +
		' PRIMARY KEY(id))',
		function(err) {
			if (err) {
				console.log('Could not create table "students".');
			}	
		}
	);*/

	var query;
	var resultsAsString = '';

	if(filter) {
		query = connection.query('SELECT id, studentname, present, absent, hrsattended, totalhrs FROM feestrackdb ' +
			                     'WHERE studentname LIKE "' + filter + '%"');

	} else {
	  query = connection.query('SELECT id, studentname, present, absent, hrsattended, totalhrs FROM feestrackdb');
	}

	query.on('error', function(err) {
		console.log('A database error occured:');
		console.log(err);
	});

	// With every result, build the string that is later replaced into
	// the HTML of th homepage
	query.on('result', function(result) {
		resultsAsString += 'id: ' + result.id;
		resultsAsString += ', studentname: ' + result.studentname;
		resultsAsString += ', present: ' + result.present;
		resultsAsString += ', absent: ' + result.absent;
		resultsAsString += ', hrsattended: ' + result.hrsattended;
		resultsAsString += ', totalhrs: ' + result.totalhrs;
		resultsAsString += '\n';
	});

	// When we have worked through all results we call the callback
	// with our completed string
	query.on('end', function(result) {
		connection.end();
		callback(resultsAsString);
	});
}

//Function that is called by the code that handles the /add route
// and inserts the supplied string as a new content entry

function addContentToDatabase(studentname, present, absent, hrsattended, totalhrs, callback) {
	var connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		password: 'ab_1234',
		database: 'StudentDB'
	});

	connection.query('INSERT INTO feestrackdb SET studentname=?, present=?, absent=?, hrsattended=?, totalhrs=?;',[studentname, present, absent, hrsattended, totalhrs ], 

		function(err) {
			if (err) {
				console.log('Could not insert studentname "' + studentname + ' ' + present + ' ' + absent + ' ' + hrsattended + ' ' + totalhrs + '" into database.' );
			}
			callback();
	});
}



/**
 * Module dependencies.
 */
"use strict";
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mysql = require('mysql');


var app = express();
var stylus = require('stylus');


var mysql = require('mysql'),
	http  = require('http'),
	url = require('url'),
	querystring = require('querystring');

// all environments
app.configure(function(){
	app.set('port', process.env.PORT || 8888);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);

	app.use(stylus.middleware(
		{
		  src: __dirname + '/views',
		    dest: __dirname + '/public'
	    }));

	app.use(express.static(path.join(__dirname, 'public')));
});
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
// Start a web server on port 8888. Requests go to function handleRequest

http.createServer(handleRequest).listen(3000);



//Function that handles http requests.

function handleRequest(request, response) {
	
	// Page HTML as one big string, with placeholder "DBCONTENT" for data // from the database

	var pageContent = '<html>' +
	                  '<head>' +
	                  '<meta http-equiv="Content-Type" ' +
	                  'content="text/html; charset=UTF-8" />' +
	                  '</head>' +
	                  '<body>' +
	                  '<form action="/add" method="post">' +
	                  '<input type="text" name="studentname">' + 
	                  '<input type="text" name="studentemail">' +
	                  '<input type="text" name="studentcontactnum">' +
	                  '<input type="text" name="studentfeesstatus">' +
	                  '<input type="submit" value="Add Student" />' +
	                  '</form>' +
	                  '<div>' +
	                  '<strong>Content in database:</strong>' +
	                  '<pre>' +
	                  'DBCONTENT' +
	                  '</pre>' +
	                  '</div>' +
	                  '<form action="/" method="get">' +
	                  '<input type="text" name="q">' +
	                  '<input type="submit" value="Filter student" />' +
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
		    addContentToDatabase(postParameters.studentname,postParameters.studentemail,postParameters.studentcontactnum,postParameters.studentfeesstatus, function() {
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
		query = connection.query('SELECT id, studentname, studentemail, studentcontactnum, studentfeesstatus FROM students ' +
			                     'WHERE studentname LIKE "' + filter + '%"');

	} else {
	  query = connection.query('SELECT id, studentname, studentemail, studentcontactnum, studentfeesstatus FROM students');
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
		resultsAsString += ', studentemail: ' + result.studentemail;
		resultsAsString += ', studentcontactnum: ' + result.studentcontactnum;
		resultsAsString += ', studentfeesstatus: ' + result.studentfeesstatus;
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

function addContentToDatabase(studentname, studentemail, studentcontactnum, studentfeesstatus, callback) {
	var connection = mysql.createConnection({
		host: 'localhost',
		user:'root',
		password: 'ab_1234',
		database: 'StudentDB'
	});

	connection.query('INSERT INTO students (studentname,studentemail,studentcontactnum,studentfeesstatus) ' +
		             'VALUES ("' + studentname + ' ' + studentemail + ' ' + studentcontactnum + ' ' + studentfeesstatus + ' ")',

		function(err) {
			if (err) {
				console.log('Could not insert studentname "' + studentname + ' ' + studentemail + ' ' + studentcontactnum + ' ' + studentfeesstatus + '" into database.' );
			}
			callback();
	});
}


app.get('/', routes.index);
app.get('/users', user.list);


/*http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
*/
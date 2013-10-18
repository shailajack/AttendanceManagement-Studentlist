"use strict";

var mysql = require('mysql');

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'ab_1234'
});

connection.query('CREATE DATABASE node', function(err) {
	if(err) {
		console.log('Could not create database "node".');
	}
});

connection.query('USE node', function(err) {
	if (err) {
		console.log('Could not switch to database "node".');
	}
});

connection.query('CREATE TABLE test ' +
				  '(id INT(11) AUTO_INCREMENT, ' +
				  ' content VARCHAR(255), ' +
				  ' PRIMARY KEY(id))',
	function(err) {
		if (err) {
		console.log('Could not create table "test".');
		}
  	}
);

connection.query(
	'SELECT id, content FROM test',
	function (err, results, fields) {
		for (var i = 0; i < results.length; i++) {
			console.log('Content of id ' + results[i].id +
								  ' is ' + results[i].content);
		}
	}
);

var query = connection.query('SELECT id, content FROM test');

query.on('row', function(row) {
	console.log('Content of id ' + row.id + ' is ' + row.content);
});

connection.query('INSERT INTO test (content) VALUES ("Hello")');
connection.query('INSERT INTO test (content) VALUES ("World")');

connection.end();

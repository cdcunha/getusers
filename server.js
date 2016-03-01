var http = require('http');
var fs = require('fs');

var port = process.env.OPENSHIFT_NODEJS_PORT || "3000";
var serverUrl = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

var mssqlConnected = false;

var Connection = require('tedious').Connection;
var config = {
    userName: 'sqluser',
    password: '8oYgI1AC3D', //'sqluser',
    server: '54.207.53.33', //'serverss003',
    // If you are on Microsoft Azure, you need this:
    options: {encrypt: true, database: 'COL_HUMBER'} //'COL_COLWEB_DES'}
};
var connection = new Connection(config);
connection.on('connect', function(err) {
// If no error, then good to proceed.
    console.log("Connected");
	mssqlConnected = true;	
	executeStatement();
});

var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

var aUsers = [];

function executeStatement() {
    var query = "SELECT UserLogin, Password " +
	            "  FROM mrusers " +
				"  where Supervisor='VFJVRQ==' " +
				"    and Lock = 'RkFMU0U=' " +
				"    and AllowLogin = 'VFJVRQ=='";
	
	request = new Request(query, function(err, rowCount) {
		if (err) {
			console.log(err);
		}else{
			console.log('Records founded: ' + rowCount)
		}
    });
    //var result = "";
	var item = { };
    request.on('row', function(columns) {
        columns.forEach(function(column) {
          if (column.value === null) {
            console.log('NULL');
          } else {
            //result+= column.value + " ";
			if (column.metadata.colName == 'UserLogin'){
				item = {};
				item ["user"] = new Buffer(column.value, 'base64').toString('ascii');
			}else{
				item ["pass"] = new Buffer(column.value, 'base64').toString('ascii');
				aUsers.push(item);
			}
          }
        });
        //console.log(result);
        //result ="";
    });

    request.on('done', function(rowCount, more) {
		console.log(rowCount + ' rows returned');
    });
    connection.execSql(request);
}

var app = http.createServer(function (request, response) 
{
	//console.log("Server request: " + request.url)
	/*fs.readFile("index.html", 'utf-8', function (error, data) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    });
	*/
	if(request.url === '/favicon.ico'){
		return;
	}
	fs.readFile("index.html", 'utf-8', function (error, data) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    });
	/*
	response.writeHead(200, {'Content-Type': 'text/html'});
	if (mssqlConnected){
		response.write('You are connected to ' + config.server + ' at ' + config.options.database);		
		
		var list = '<br/>' +
		           '<table>' +
		           '  <thead>' +
				   '    <th>User</th>' +
				   '    <th>Pass</th>' +
				   '  </thead>' +
				   '  <tbody>';
		for (var i=0; i<aUsers.length; i++){
			list = list + '<tr><td>' + aUsers[i].user + '</td><td>' + aUsers[i].pass + '</td></tr>';
		}
		list = list + '</tbody></table>';
		response.write(list);
	}else{
		response.write('You are NOT connected to ' + config.server + ' at ' + config.options.database);
	}
    response.end();
	*/
}).listen(port, serverUrl);

console.log("Listening at " + serverUrl + ":" + port);
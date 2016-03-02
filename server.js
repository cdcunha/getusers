var http = require('http');
var fs = require('fs');

var port = process.env.OPENSHIFT_NODEJS_PORT || "3000";
var serverUrl = process.env.OPENSHIFT_NODEJS_IP || "192.168.0.175";

var mssqlConnected = false;

var Connection = require('tedious').Connection;
var config = {
    userName: 'sqluser',
    password: 'sqluser',
    server: 'serverss003',
    // If you are on Microsoft Azure, you need this:
    options: {encrypt: true, database: 'COL_COLWEB_DES'}
};

var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

var app = http.createServer(function (request, response) 
{
	if(request.url === '/favicon.ico'){
		return;
	}
	if(request.url === '/'){
		fs.readFile("index.html", 'utf-8', function (error, data) {
			response.writeHead(200, {'Content-Type': 'text/html'});
			response.write(data);
			response.end();
		});
	}
}).listen(port, serverUrl);

console.log("Listening at " + serverUrl + ":" + port);

var io = require('socket.io').listen(app);

io.sockets.on('connection', function(client) {
	var clientIP = client.request.connection.remoteAddress;
	client.on("connectDB", function(infoDB){
        //console.log(clientIP + ' - connected');
		config = {
			userName: infoDB.UserName,
			password: infoDB.Password,
			server: infoDB.Server,
			// If you are on Microsoft Azure, you need this:
			options: {encrypt: true, database: infoDB.Database}
		};
		
		connection = new Connection(config);
		connection.on('connect', function(err) {
		// If no error, then good to proceed.
			//console.log("DB connected");
			mssqlConnected = true;	
			executeStatement();
		});
		
		function executeStatement() {
			var aUsers = [];
			var query = "SELECT UserLogin, Password " +
						"  FROM mrusers " +
						"  where Supervisor='VFJVRQ==' " +
						"    and Lock = 'RkFMU0U=' " +
						"    and AllowLogin = 'VFJVRQ=='" +
						" ORDER BY UserLogin DESC";
			
			request = new Request(query, function(err, rowCount, rows) {
				if (err) {
					io.sockets.to(client.id).emit("load-list-users", infoDB, aUsers, 0);
					console.log(err);
				}else{
					console.log(new Date().toLocaleString() + ' ' + clientIP + ' : ' + rowCount + ' rec(s) - ' + infoDB.Database + ' [' + infoDB.Server + ']');
					io.sockets.to(client.id).emit("load-list-users", infoDB, aUsers, rowCount);
				}
			});
			
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
			});
			connection.execSql(request);
		}
    });	
	
	/*client.on("disconnect", function(){
		console.log(clientIP + " - disconnected.");
	})*/
});
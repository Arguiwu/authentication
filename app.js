var http = require('http'),
	express = require('express'),
	ejs = require('ejs'),
	path = require('path');

var app = express();
var port = process.env.PORT || 3000;

app.set('views','./app/view');
app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.use(express.static(path.join(__dirname,'public')));

app.listen(port);

console.log('application started on port ' + port);

app.get('/',function(req, res){
	res.render('index');
});
app.get('/login.html',function(req, res){
	res.render('login');
});
app.get('/content.html',function(req, res){
	res.render('content');
});
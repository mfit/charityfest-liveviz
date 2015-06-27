/*************************************
//
// donations app
//
**************************************/

var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser')
var device  = require('express-device');

var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var runningPortNumber = process.env.PORT;

var backend = require('./server/data.js');
var config = JSON.parse(fs.readFileSync('data/projects.json'));

var myBackend = new backend.backend(config);


console.log(config);
console.log(runningPortNumber);

app.configure(function(){

  // Configure static folder
  app.use(express.static(__dirname + '/public'));

  //set the view engine
  app.set('view engine', 'ejs');
  app.set('views', __dirname +'/views');

  // Configure Middleware
  app.use(device.capture());
  app.use(bodyParser.json()); // to get json params
});


// logs every request
app.use(function(req, res, next){
  // output every request in the array
  console.log({method:req.method, url: req.url, device: req.device});

  // goes onto the next function in line
  next();
});

app.get("/", function(req, res){
  res.render('live', {});
});

app.get("/backend", function(req, res){
  res.render('backend', {});
});

app.get("/projects", function(req, res) {
  res.json(myBackend.getProjects());
});

app.get("/sessions", function(req, res){
  res.json(myBackend.getSessions());
});

app.get("/donations", function(req, res){
  res.json(myBackend.getDonations());
});

app.get("/status", function(req, res){
  res.json(myBackend.getStatus());
});

app.get("/setup", function(req, res) {
  res.json(myBackend.getSetup());
});

/**
 * Accept + process a new donation
 */
app.post("/donation", function(req, res){
  var amount = req.body.amount,
      projectId = req.body.projectId,
      vStat;

  var donation = myBackend.addDonation(projectId, amount);

  vStat = myBackend.getSetup();

  // Notify update via socket (full data)
  io.sockets.emit('update', vStat);

  res.json(donation);
});

/**
 * Set visual layout setting
 */
app.post("/layout", function(req, res) {
  var activeId = parseInt(req.body.activeId),
    layout = {activeId:activeId};

  // Notify layout update
  io.sockets.emit('layout', layout);

  res.json(layout);
});


// process incoming socket events
// dont need this for now
// io.sockets.on('connection', function (socket) {
//   // // Process update
//   // socket.on('update', function(data, fn){
//   //   console.log(data);
//   //   io.sockets.emit('update', data);
//   //   fn();//call the client back to clear out the field
//   // });
// });


server.listen(runningPortNumber);


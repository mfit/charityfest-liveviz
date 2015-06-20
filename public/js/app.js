/*************************************
//
// donations app
//
**************************************/

// connect to our socket server
var socket = io.connect('http://127.0.0.1:1337/');

var app = app || {};

var lg;

// Init the graph helper
$(function() {
  if (d3) {
    lg = liveGraphApp();
  }
});

//
// Live updates
//
// Values
socket.on("update", function(d){
  if (lg) {
    lg.update(d);
  }
});

socket.on("layout", function(d){
  if (lg) {
    console.log("Layout", d);
    lg.setChartActive(d.activeId);
  }
});

// Set projects
socket.on("init", function(d) {

});

// settings

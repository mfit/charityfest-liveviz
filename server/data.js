var fs = require('fs');
var os = require('os');

var myBackend = function(config) {

  var projects = config.projects,
    sessions = config.sessions,
    projectValues = {},
    donations = [],
    file = config.donationsFile,
    fp,
    dId = 0;


  function readDonationsLog(file) {
    var data;
    try {
      data = fs.readFileSync(file);
    } catch(err) {
      console.log("Fresh file " + file);
      return;
    }
    if (data) {
      donations = String(data)
        .split("\n")
        .map(function(str) {
          var l = str.split(";");
          return {id: parseInt(l[0]), date: parseInt(l[1]), projectId: parseInt(l[2]), amount: parseFloat(l[3])};
        });
      donations
        .forEach(function(dn) {
          projectValues[dn.projectId] = (projectValues[dn.projectId] || 0) + dn.amount;
        });

      dId = donations.reduce(function(sum, ar) { return ar.id > sum ? ar.id : sum; }, 0);
      console.log("Read " + donations.length + " rows");
      console.log("MaxId = " + dId);
    }
  }

  readDonationsLog(file);

  console.log("Logging to " + file);
  fp = fs.openSync(file, 'a');

  this.addDonation = function(projectId, amount) {

    // Increase tally/counter
    var total = projectValues[projectId] || 0;
    projectValues[projectId] = total + amount;

    // Increase Id Counter
    dId++;

    // Donation row
    var donation = {id:dId, projectId: projectId, amount:amount, date: Date.now()};

    // Keep local
    donations.push(donation);

    // Write to logfile>
    fs.writeSync(fp, [donation.id, donation.date, donation.projectId, donation.amount].join(";") + os.EOL);

    return donation;
  };


  this.getStatus = function(session) {
    var plist;
    plist = typeof(session) !== 'undefined' ?
      projects.filter(function(p) { return p.sessionId==session; }) : projects;

    plist = plist.map(function(p) {
        return {
          title:p.title,
          id:p.id,
          sessionId: p.sessionId,
          value: projectValues[p.id] || 0
        };
      });
    return plist;
  };

  this.getSetup = function(session) {
    var getPlist = this.getStatus;

    return sessions
      // .filter(function(s) { return typeof(session) === 'undefinded' || s.id === session; })
      .map(function(s) {
        return {
          id: s.id,
          title: s.title,
          projects: getPlist(s.id)
        };
      });
  }

  this.getProjects = function() {
    return projects;
  };

  this.getSessions = function() {
    return sessions;
  };

  this.getDonations = function() {
    return donations;
  }

  return this;
};

module.exports = {
  backend: myBackend
};

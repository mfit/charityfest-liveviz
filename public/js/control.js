/**
 * Small angular app the does the 'operator' controls
 */

(function() {
  'use strict';

  angular.module('donationz', [
      // 'ngCookies',
      // 'ngResource',
      // 'ngRoute',
      // 'ngSanitize',
    ]);


  angular.module('donationz').controller('DonationsCtrl', ['DonationsData', '$scope',
    function(DonationsData, $scope) {
      var self = this;
      this.don = {amount:0};
      this.projects = [];
      this.projectLookup = {},
      this.sessions = [{id:0}, {id:1}, {id:2}, {id:3}],
      this.sessionLookup = {},
      this.activeSessionId;

      // Load projects from backend
      DonationsData.getProjects()
        .then(function(data) {
          $scope.$apply(function() {
            self.projects = data;
            self.projectLookup = self.projects
              .reduce(function(dict, item) { dict[item.id] = item; return dict;}, {});
          });
        })
        .catch(function(err) {
          console.log(err);
          alert("Could not load projects");
        });

      // Load sessions from backend
      DonationsData.getSessions()
        .then(function(data) {
          $scope.$apply(function() {
            self.sessions = data;
            self.sessionLookup = self.sessions
              .reduce(function(dict, item) { dict[item.id] = item; return dict;}, {});
          });
        })
        .catch(function(err) {
          console.log(err);
          alert("Could not load sessions");
        });

      // Load donations previously registered from the backend
      DonationsData.fetchDonations()
        .then(function(data) {
          // $scope.$digest();
        })
        .catch(function(err) {
          console.log(err);
          alert("Could not load donations");
        });

      this.isSessionActive = function(id) {
        return id==this.activeSessionId;
      }

      this.activateSession = function(id) {
        DonationsData.setSessionActive(id)
          .then(function() {
            $scope.$apply(function() {
              self.activeSessionId = id;
            });
          })
          .catch(alert);

      }

      this.addDonation = function() {
        DonationsData.addDonation(this.don.amount, this.don.project)
          .then(function(donation) {
            $scope.$apply(function() {
              self.don.amount = 0;
            });
          })
          .catch(function() {
            alert("Could not save donation");
          });
      };

      this.getDonations = function() {
        return DonationsData.getDonations()
          .sort(function(a,b) { return b.date-a.date; });
      };

      return this;
    }]);

  angular.module('donationz').service('DonationsData', ['$http', '$q',
    function($http, $q) {
      var base = '/';
      var data = [];

      this.addDonation = function(amount, project) {
        return new Promise(function(resolve, reject) {
          var donationData = {amount:amount, projectId: project};
          $http.post(base + 'donation', donationData)
          .success(function(donation) {
            console.log("New donation");
            console.log(donation);
            data.push(donation);
            resolve(donation);
          })
          .error(reject);
        });
      };

      this.getDonations = function() {
        return data;
      }

      this.fetchDonations = function() {
        return new Promise(function(resolve, reject) {
          $http.get(base + 'donations')
            .success(function(res) {
              data = res;
              resolve(res)
            })
            .error(reject);
        });
      }

      this.getProjects = function() {
        return new Promise(function(resolve, reject) {
          $http.get(base + 'projects')
            .success(resolve)
            .error(function(res) {
              console.log("Error!");
              console.log(res);
              reject(res);
            });
        });
      };

      this.getSessions = function() {
        return new Promise(function(resolve, reject) {
          $http.get(base + 'sessions')
            .success(resolve)
            .error(reject);
        });
      };

      this.setSessionActive = function(sessionId) {
        return new Promise(function(resolve, reject) {
          $http.post(base + 'layout', {activeId:sessionId})
            .success(resolve)
            .error(reject);
        });
      }

      return this;
    }]);
}());

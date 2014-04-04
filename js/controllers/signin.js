'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, Network, Storage) {
    var peerData = Storage.get('peerData');

    $scope.loading = false;
    $rootScope.peerId = peerData ? peerData.peerId : null;

    $scope.create = function() {
      $scope.loading = true;

      Network.init(function() {
        $location.path('peer');
      });
    };

    $scope.join = function(cid) {
      $scope.loading = true;

      if (cid) {
        $rootScope.connectedTo.push(cid);

        Network.init(function() {
          Network.connect(cid, function() {
            $location.path('peer');
          });
        });
      }
    };

    if (peerData && peerData.peerId) {
      console.log('------- reloaded ----------');
      console.log(peerData);
      $rootScope.peerId = peerData.peerId;
      $rootScope.connectedPeers = peerData.connectedPeers;

      console.log(peerData.connectedTo[0]);

      $scope.join(peerData.connectedTo[0]);
    }
  });


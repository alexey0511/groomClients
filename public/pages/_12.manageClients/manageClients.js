'use strict';

angular.module('myApp.manageClients', ['ngRoute'])

        .config(['$routeProvider', function ($routeProvider) {
                $routeProvider.when('/manageClients', {
                    templateUrl: 'pages/_12.manageClients/manageClients.html',
                    controller: 'ManageClientsController'
                });
            }])

        .controller('ManageClientsController', function ($rootScope, $scope, commonFunctions, $http, $location, clientsService) {
            $http.get('/api/getClients')
                    .success(function (response) {
                        $scope.people = response;
                    });

            $scope.removeClient = function (id) {
                console.log("-- DELETE Client", id);
                var clientIndex = clientsService.findClientIndex(id, $scope.people);
                var client = $scope.people.splice(clientIndex, 1);
                console.log(client[0]._id);
                $http.post('/api/deleteClients', client[0]);
            };
            $scope.openClient = function (id) {
                var clientIndex;
                clientIndex = clientsService.findClientIndex(id, $scope.people);
                console.log(clientIndex);
                if (clientIndex || clientIndex === 0) {
                    var id = $scope.people[clientIndex].id;
                    $location.path("/clients/" + id);
                }
            };
        });
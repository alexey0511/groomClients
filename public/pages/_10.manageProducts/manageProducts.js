'use strict';

angular.module('myApp.manageProducts', ['ngRoute'])

        .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
                $routeProvider.when('/manageproducts', {
                    templateUrl: 'pages/_10.manageProducts/manageProducts.html',
                    controller: 'ManageProductsController'
                });
            }])
        .controller('ManageProductsController', function ($scope, $http, commonFunctions, clientsService) {

            $http.get('/api/getProducts')
                    .success(function (response) {
                        $scope.products = response;
                    });
//            $scope.scanning = true;

            $scope.addProduct = function () {
                if ($scope.newProduct && $scope.newProduct.name && $scope.newProduct.price) {
                $scope.newProduct.id = commonFunctions.generateGuid();
                $scope.products.push($scope.newProduct);
                $http.post('/api/products', $scope.newProduct)
                        .success(function (p) {
                            console.log("ADD NEW PRODUCT ",p.id);
                        });
                $scope.newProduct = {};
            };
        }
            $scope.removeProduct = function (id) {
                console.log("-- DELETE PRODUCT", id);
                var productIndex = clientsService.findClientIndex(id, $scope.products);
                var product = $scope.products.splice(productIndex, 1);
                console.log(product[0]._id);
                $http.post('/api/deleteProducts',product[0]);
            };
        }); // end of controller

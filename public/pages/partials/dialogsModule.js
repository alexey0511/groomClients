angular.module('myApp.dialogs', ['ngRoute', 'ui.bootstrap'])
        .controller("ConfirmRemoveController", function ($scope, $modalInstance) {
            $scope.ok = function () {
                $modalInstance.close(true);
            };
            $scope.cancel = function () {
                $modalInstance.dismiss(false);
            };
        })
        .controller("adminProofController", function ($scope, $modalInstance) {
            $scope.password;
            $scope.ok = function () {
                $modalInstance.close($scope.password);
            };
            $scope.cancel = function () {
                $modalInstance.dismiss(false);
            };
        });

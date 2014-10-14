'use strict';

angular.module('app')
    .controller('OptionalNodeCtrl', [function () {
        this.someMethod = function () {
            console.log('do something');
        };
    }]);
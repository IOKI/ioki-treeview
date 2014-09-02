'use strict';

angular.module('app').controller('WorkareaController', ['$scope', '$modal', '$treeview', 'treeData', 'treeAvailableNodes', function ($scope, $modal, $treeview, treeData, treeAvailableNodes) {

    $scope.$on('treeview-selected', function (event, selectedScope) {
        var parent = selectedScope.getParent();

        $scope.selected = selectedScope.treedata;

        if (parent !== null) {
            $scope.parent = parent.treedata;
        }
    });

    $scope.$on('treeview-unselected', function () {
        $scope.selected = null;
    });

    $scope.tData = treeData.data;
    $scope.subnodes = treeAvailableNodes.data;

    /**
     * EXAMPLE: Custom addNode method
     *
     * This example contains modal from AngularUI. It receives treenode scope and save it in Workarea Controller.
     * Then opens modal which gives The User possibility to choose what kind of Node he or she would like to add.
     *
     * @param scope         - TreeView Scope given from directive
     */
    $scope.addNode = function (scope) {
        $scope.treescope = scope;
        $scope.open();
    };

    /**
     * Customization for AngularUI Modal
     */
    $scope.open = function () {

        var modalInstance = $modal.open({
            templateUrl: 'template/myModalContent.tpl.html',
            controller: ModalInstanceCtrl,
            resolve: {
                subnodes: function () {
                    return $scope.subnodes;
                },
                treescope: function () {
                    return $scope.treescope;
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
        }, function () {});
    };
    /*
    $scope.dragging = function (root, scope, target, draggedEl) {
        console.log('dragging', root, scope, target, draggedEl);
    };

    $scope.dropped = function (root, scope, target, draggedEl) {
    };*/

    /**
     * TreeView Settings Object
     * Put your TreeView customization here.
     */
    $scope.treeSettings = {
        addable: true,
        removable: true,
        selectable: true,
        rootSelected: true,
        expandAll: false,

        iconsBaseClass: 'fa',
        icons: {
            'directory': {
                closed: 'fa-folder-o',
                open: 'fa-folder-open-o'
            },
            'activity': 'fa-file-o',
            'video': 'fa-play-circle-o',
            'form': 'fa-truck',
            'draganddrop': 'fa-arrows',
            'crossword': 'fa-bullseye'
        },
        customMethods: {
            /**
             * Pass custom method for adding nodes in TreeView.
             * Function exists in Workarea Controller.
             */
            addNode: $scope.addNode/*,
            dragging: $scope.dragging*/
        }
    };
}]);

var ModalInstanceCtrl = function ($scope, $modalInstance, subnodes, treescope) {

    $scope.subnodes = subnodes;
    $scope.treescope = treescope;

    $scope.selected = {
        subnode: $scope.subnodes[0]
    };

    $scope.ok = function () {
        /**
         * New subnode structure
         * Name and Type properties are the same as selected.
         */
        var newSubNode = {
            name: $scope.selected.subnode.name,
            type: $scope.selected.subnode.type
        };

        if (angular.isArray($scope.selected.subnode.subnodes)) {
            newSubNode.subnodes = [];
            angular.copy($scope.selected.subnode.subnodes, newSubNode.subnodes);
        }

        /**
         * Add new subnode to the node in TreeView.
         */
        $scope.treescope.treedata.subnodes.push(newSubNode);

        // close modal
        $modalInstance.close($scope.selected.subnode);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};
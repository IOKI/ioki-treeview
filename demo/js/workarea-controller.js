'use strict';

angular.module('app').controller('WorkareaController', function ($scope) {

    $scope.treeSettings = {
        expandable: true,
        showExpander: true,
        selectable: false,
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
        }/*,
         callbacks: {
         addNode: function () {
         console.log('it\'s super callback!');
         }
         }*/
    };

    $scope.treeData = {
        name: 'Node 1',
        type: 'directory',
        expanded: true,
        subnodes: [
            {
                name: 'Node 1.1',
                type: 'directory',
                expanded: true,
                subnodes: [
                    {
                        name: 'Node 1.1.1',
                        type: 'directory',
                        expanded: true,
                        subnodes: [
                            {
                                name: 'Super activity',
                                type: 'activity'
                            }
                        ]
                    },
                    {
                        name: 'Node 1.1.2',
                        type: 'directory',
                        subnodes: [
                            {
                                name: 'Form',
                                type: 'form'
                            }
                        ]
                    },
                    {
                        name: 'Summary',
                        type: 'activity'
                    }
                ],
            },
            {
                name: 'Node 1.2',
                type: 'activity'
            },
            {
                name: 'Node 1.3',
                type: 'directory',
                expanded: true,
                subnodes: [
                    {
                        name: 'Node 1.3.1',
                        type: 'directory',
                        expanded: true,
                        subnodes: [
                            {
                                name: 'Super activity',
                                type: 'activity'
                            }
                        ]
                    },
                    {
                        name: 'Node 1.3.2',
                        type: 'directory',
                        subnodes: [
                            {
                                name: 'Form',
                                type: 'form'
                            }
                        ]
                    },
                    {
                        name: 'Summary',
                        type: 'activity'
                    }
                ]
            }
        ]
    };
});
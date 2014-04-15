angular.module('app').factory('treeAvailableNodes', function treeAvailableNodes() {
    'use strict';

    return {
        data: [
            {
                name: 'New Activity',
                type: 'activity'
            },
            {
                name: 'New Video',
                type: 'video'
            },
            {
                name: 'New Crossword',
                type: 'crossword'
            },
            {
                name: 'New Node',
                type: 'directory',
                subnodes: []
            }
        ]
    };
});
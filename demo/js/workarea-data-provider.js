angular.module('app').factory('treeData', function treeData() {
    'use strict';

    return {
        data: {
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
                    ]
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
        }
    };
});
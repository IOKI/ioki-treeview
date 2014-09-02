angular.module('app').factory('treeData', function treeData() {
    'use strict';

    return {
        data: [
            {
                name: 'Node 1',
                id: '1',
                type: 'directory',
                expanded: true,
                subnodes: [
                    {
                        name: 'Node 1.1',
                        id: '2',
                        type: 'directory',
                        expanded: true,
                        subnodes: [
                            {
                                name: 'Node 1.1.1',
                                id: '3',
                                type: 'directory',
                                expanded: true,
                                subnodes: [
                                    {
                                        name: 'Super activity',
                                        id: '4',
                                        type: 'activity'
                                    }
                                ]
                            },
                            {
                                name: 'Node 1.1.2',
                                id: '5',
                                type: 'directory',
                                expanded: false,
                                subnodes: [
                                    {
                                        name: 'Form',
                                        id: '6',
                                        type: 'form'
                                    }
                                ]
                            },
                            {
                                name: 'Summary',
                                id: '7',
                                type: 'activity'
                            }
                        ]
                    },
                    {
                        name: 'Node 1.2',
                        id: '8',
                        type: 'activity'
                    },
                    {
                        name: 'Node 1.3',
                        id: '9',
                        type: 'directory',
                        expanded: true,
                        subnodes: [
                            {
                                name: 'Node 1.3.1',
                                id: '10',
                                type: 'directory',
                                expanded: true,
                                subnodes: [
                                    {
                                        name: 'Super activity',
                                        id: '11',
                                        type: 'activity'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'Node 1.4',
                        id: '12',
                        type: 'directory',
                        expanded: false,
                        subnodes: []
                    },
                    {
                        name: 'Node 1.3',
                        id: '13',
                        type: 'directory',
                        expanded: true,
                        subnodes: [
                            {
                                name: 'Node 1.3.1',
                                id: '14',
                                type: 'directory',
                                expanded: true,
                                subnodes: [
                                    {
                                        name: 'Super activity',
                                        id: '15',
                                        type: 'activity'
                                    }
                                ]
                            },
                            {
                                name: 'Node 1.3.2',
                                id: '16',
                                type: 'directory',
                                subnodes: [
                                    {
                                        name: 'Form',
                                        id: '17',
                                        type: 'form'
                                    }
                                ]
                            },
                            {
                                name: 'Summary 1',
                                id: '18',
                                type: 'activity'
                            },
                            {
                                name: 'Summary 2',
                                id: '19',
                                type: 'activity'
                            },
                            {
                                name: 'Summary 3',
                                id: '20',
                                type: 'activity'
                            },
                            {
                                name: 'Summary 4',
                                id: '21',
                                type: 'activity'
                            }
                        ]
                    }
                ]
            }
        ]
    };
});
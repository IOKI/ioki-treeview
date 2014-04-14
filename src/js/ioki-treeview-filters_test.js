'use strict';

describe('Widgets TreeView Filters: getNodeIcon', function () {

    beforeEach(angular.mock.module('widgets'));

    it('should have a getNodeIcon filter', angular.mock.inject(function ($filter) {
        expect($filter('getNodeIcon')).not.toBe(null);
    }));

    it('should return null when node type is not a string', angular.mock.inject(function ($filter){
        var node = { name: 'Node 1', type: {} },
            icons = {'activity': 'fa-file-o'},
            getNodeIcon;

        getNodeIcon = $filter('getNodeIcon')(node, icons);

        expect(getNodeIcon).toBe(null);
    }));

    it('should return null when node type does not have it\'s representation on icons schema', angular.mock.inject(function ($filter){
        var node = { name: 'Node 1', type: 'video' },
            icons = {'activity': 'fa-file-o'},
            getNodeIcon;

        getNodeIcon = $filter('getNodeIcon')(node, icons);

        expect(getNodeIcon).toBe(null);
    }));

    it('should return string with class name when node is not expandable', angular.mock.inject(function ($filter){
        var node = { name: 'Node 1', type: 'activity' },
            testedClassName = 'fa-file-o',
            icons = {'activity': testedClassName},
            getNodeIcon;

        getNodeIcon = $filter('getNodeIcon')(node, icons);

        expect(getNodeIcon).toEqual(testedClassName);
    }));

    it('should return string with proper class name when node is expandable', angular.mock.inject(function ($filter){
        var node = { name: 'Node 1', type: 'directory', expanded: false },
            testedClosedClassName = 'fa-folder-o',
            testedOpenClassName = 'fa-folder-open-o',
            icons = {
                'directory': {
                    closed: testedClosedClassName,
                    open: testedOpenClassName
                }
            },
            getNodeIcon;

        getNodeIcon = $filter('getNodeIcon')(node, icons);
        expect(getNodeIcon).toEqual(testedClosedClassName);

        node.expanded = true;
        getNodeIcon = $filter('getNodeIcon')(node, icons);
        expect(getNodeIcon).toEqual(testedOpenClassName);
    }));
});

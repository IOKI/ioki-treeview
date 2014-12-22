angular.module('ioki.treeview')
    .provider('$treeview', function () {
        'use strict';

        var defaults = this.defaults = {
                prefixEvent: 'treeview',
                treesettings: {
                    /* template URL */
                    template: 'templates/ioki-treeview',

                    /* define if user can expand / collapse nodes */
                    expandable: true,

                    /* define if all nodes should be expanded on loading the tree */
                    expandAll: true,

                    /* [optional] define how deep the tree should be expanded on load */
                    // expandToLevel: [Number]

                    /* define if user see expanders */
                    showExpander: true,

                    /* define if user can remove nodes */
                    removable: false,

                    /* define if user can add nodes */
                    addable: true,

                    /* define if user can select node */
                    selectable: false,

                    /* define if root node should be selected on load */
                    rootSelected: false,

                    /* define if nodes are draggable or not */
                    draggable: true,

                    /* define if user can navigate through treeview by keyboard */
                    disallowKeyboardNavigation: false,

                    /* treeview offers custom methods via controller's scope */
                    customMethods: {
                        /* addNode method */
                        addNode: null,
                        /* callback after node selection */
                        afterNodeSelectCallback: null,
                        /* removeNode method */
                        removeNode: null,
                        /* method is called when node is started to drag (fire once) */
                        dragStart: null,
                        /* method is called when node is stopped to drag (fire once) */
                        dragEnd: null,
                        /* method is called when node is dragged */
                        dragging: null,
                        /* method is called when node is dropped */
                        drop: null,
                        /* init method is called when node is initialised */
                        init: null,
                        /* method is called before drag start (fire once) */
                        allowDragStart: function () { return true; }
                    }
                }
            },
            options = {};

        this.$get = ['$q', 'TreeviewManager', function ($q, TreeviewManager) {

            function TreeViewFactory(config) {
                var $treeview = {}, scope,
                    prop;

                /**
                 * _Private Method isRootNode
                 *
                 * It defines if given scope is the root scope for treeview.
                 *
                 * @param scope             - Object    - scope of the node
                 * @returns {boolean}       - Boolean   - returns true if node is root node
                 * @private
                 */
                function _isRootNode(scope) {
                    return typeof scope.$parent.$parent.treedata === 'undefined';
                }

                /**
                 * _Private Method isNodeRemovable
                 *
                 * Is node removable is determine by global settings (options.settings.removable)
                 * User also cannot remove Parent Node for whole TreeView
                 *
                 * @param scope             - Object    - scope of the node
                 * @returns {boolean}       - Boolean   - returns true if node is removable
                 * @private
                 */

                function _isNodeRemovable(scope) {
                    return !(_isRootNode(scope) || !options.settings.removable);
                }

                /**
                 * _Private Method configureScopeVars
                 *
                 * Method is configuring properties of node in scope.
                 * Values depends on options provided by developer.
                 *
                 * @param scope             - Object    - scope of node
                 * @param options           - Object    - options provided by developer
                 * @private
                 */
                function _configureScopeVars(scope, options) {
                    scope.treedata.$removable = _isNodeRemovable(scope);

                    if (options.settings.expandAll && !scope.treedata.expandAllCalled) {
                        scope.treedata.expanded = true;
                        scope.treedata.expandAllCalled = true;
                    }

                    if (options.settings.rootSelected && _isRootNode(scope)) {
                        scope.treedata.selected = true;

                        TreeviewManager.setSelectedNode(scope.treedata, scope.treeid);
                    }
                }

                options = $treeview.$options = angular.extend({}, defaults, config);

                /*
                 copy defaults options for treeview (@var defaults)
                 if option specific for instance (@var config) wasn't defined
                 */
                for (prop in defaults.treesettings) {
                    if (defaults.treesettings.hasOwnProperty(prop)) {
                        if (typeof config.settings[prop] === 'undefined') {
                            options.settings[prop] = defaults.treesettings[prop];
                        }
                    }
                }

                scope = $treeview.$scope = options.scope;
                scope.settings = options.settings;

                _configureScopeVars(scope, options);

                /**
                 * INTERFACE for TreeView available in Controller's scope
                 */

                scope.$addNode = function (obj) {
                    $treeview.addNode(obj);
                };

                scope.$removeNode = function () {
                    $treeview.removeNode();
                };

                scope.$toggleNode = function () {
                    $treeview.toggleNode();
                };

                scope.$selectNode = function (ev) {
                    $treeview.selectNode(ev);
                };

                /***********************************************************************
                 *
                 * METHODS for TreeView
                 *
                 */

                /**
                 * Method toggleNode
                 *  1) available in TreeView's scope
                 *  2) requires property "expandable" in treesettings to be true
                 *
                 * This method change state "expanded" in current node for opposite state
                 */
                $treeview.toggleNode = function () {
                    if (options.settings.expandable) {
                        scope.treedata.expanded = !scope.treedata.expanded;
                    }
                };

                /**
                 * Method selectNode
                 *  1) available in TreeView's scope
                 *  2) requires property "selectable" in treesettings to be true
                 *
                 * This method mark current node as selected and unselect other nodes in TreeView
                 * If selected node is the same as current node it will be unselect
                 */
                $treeview.selectNode = function (ev) {
                    var state;

                    if (options.settings.selectable) {
                        if (typeof ev.target.attributes['ng-click'] !== 'undefined' && ev.target.attributes['ng-click'].value !== '$selectNode($event)') {
                            setPropertyForAllNodes('selected', false);
                            scope.treedata.selected = true;
                        } else {
                            // save actual state
                            state = scope.treedata.selected;

                            // unselect all nodes
                            setPropertyForAllNodes('selected', false);

                            // change state of clicked element on opposite state
                            scope.treedata.selected = !state;
                        }

                        if (angular.isFunction(options.settings.customMethods.afterNodeSelectCallback)) {
                            options.settings.customMethods.afterNodeSelectCallback(scope.treedata);
                        }

                        if (scope.treedata.selected) {
                            TreeviewManager.setSelectedNode(scope.treedata, scope.treeid);
                        } else {
                            TreeviewManager.unselectNode();
                        }
                    }
                };

                /**
                 * Method addNode
                 *  1) available in TreeView's scope
                 *  2) requires property "addable" in treesettings to be true
                 *  3) requires customMethod addNode to be function
                 *
                 * This method adds new node to subnodes for current node
                 *
                 * Method allows to use custom function for manage adding process.
                 * It could be useful if developer want to implement pop-up or drop down with possibility
                 * to choose what kind of node user want to add.
                 *
                 * @param obj               - Object - additional info / settings that might help with managing adding process
                 */
                $treeview.addNode = function (obj) {
                    if (options.settings.addable) {
                        if (typeof options.settings.customMethods.addNode === 'function') {
                            options.settings.customMethods.addNode(scope, obj);
                        }
                    }
                };

                /**
                 * Method removeNode
                 *  1) available in TreeView's scope
                 *  2) requires property "removable" in treesettings to be true
                 *  3) (optionally) can use customMethod removeNode
                 *
                 * This method removes current node.
                 */
                $treeview.removeNode = function () {
                    var deferred = $q.defer(),
                        promise = deferred.promise;

                    if (options.settings.removable) {
                        if (angular.isFunction(options.settings.customMethods.removeNode)) {
                            options.settings.customMethods.removeNode(scope, deferred);
                        } else {
                            deferred.resolve();
                        }
                    }

                    promise.then(function (index) {
                        removeNode(index);
                    });
                };

                function removeNode (index) {
                    var node = scope.treedata,
                        parent = scope.getParent(),
                        indexOfNode;

                    if (parent !== null && angular.isArray(parent.treedata.subnodes)) {

                        indexOfNode = index || parent.treedata.subnodes.indexOf(node);

                        parent.treedata.subnodes.splice(indexOfNode, 1);
                        parent.treedata.selected = true;

                        if (node.selected) {
                            TreeviewManager.setSelectedNode(parent, scope.treeid);
                        }
                    }
                }

                /**
                 * Function setPropertyForAllNodes
                 *
                 * Function sets given property (@param prop) with given value (@param value) for all nodes in tree
                 *
                 * @param prop              - String
                 * @param value             - String / Number / Boolean
                 */
                function setPropertyForAllNodes(prop, value) {
                    var rootScope, rootNode, subnodes;

                    if (typeof prop === 'string' && typeof value !== 'undefined') {
                        rootScope = getRootNode(scope);
                        rootNode = rootScope.treedata;
                        subnodes = rootNode.subnodes;

                        rootNode[prop] = value;
                        setPropertyForSubnodes(subnodes, prop, value);
                    }
                }

                /**
                 * Function setPropertyForSubnodes
                 *
                 * Recursive function for setting given property (@param prop) with given value (@param value) for nodes on the same level
                 *
                 * @param actualSubnodes    - Array (with objects)
                 * @param prop              - String
                 * @param value             - String / Number / Boolean
                 */
                function setPropertyForSubnodes(actualSubnodes, prop, value) {
                    var i, arrLen;

                    if (angular.isArray(actualSubnodes)) {
                        i = 0;
                        arrLen = actualSubnodes.length;

                        for (i; i < arrLen; i++) {
                            actualSubnodes[i][prop] = value;

                            setPropertyForSubnodes(actualSubnodes[i].subnodes, prop, value);
                        }
                    }
                }

                /**
                 * Function getRootNode
                 *
                 * Recursive function for finding the root scope in TreeView. Every node knows only about itself and subnodes.
                 * This helper function helps to find root scope beginning from actual node and its scope (@param scope).
                 *
                 * @param scope             - Angular Scope Object
                 * @returns {*}             - Angular Scope Object - RootScope of TreeView
                 */
                function getRootNode(scope) {
                    if (_isRootNode(scope)) {
                        return scope;
                    } else {
                        return getRootNode(scope.$parent.$parent);
                    }
                }

                return $treeview;
            }

            return TreeViewFactory;
        }];
    });
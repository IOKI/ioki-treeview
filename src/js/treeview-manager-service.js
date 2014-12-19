angular.module('ioki.treeview')
    .factory('TreeviewManager', ['$document', '$rootScope', function ($document, $rootScope) {
        'use strict';

        var keysManager, TreeviewManager;

        TreeviewManager = {
            trees: {},

            focusedTree: null,

            newTreeId: 0,

            getNextTreeId: function () {
                return TreeviewManager.newTreeId + 1;
            },

            isAddedToManager: function (scope) {
                return typeof TreeviewManager.trees[scope.treeid] !== 'undefined';
            },

            addTree: function (scope, element) {
                /* Checks if TreeviewManager.trees is empty. If it is - focus on this tree.
                   Result: focus on the first compiled tree */
                if (Object.keys(TreeviewManager.trees).length === 0) {
                    TreeviewManager.focusedTree = scope.treeid;
                }

                if (typeof TreeviewManager.trees[scope.treeid] === 'undefined') {
                    TreeviewManager.trees[scope.treeid] = {};
                    TreeviewManager.trees[scope.treeid].scope = scope;
                    TreeviewManager.trees[scope.treeid].element = element;

                    if (typeof TreeviewManager.trees[scope.treeid].scope.treeAllowCopy === 'undefined') {
                        TreeviewManager.trees[scope.treeid].scope.treeAllowCopy = false;
                    }

                    // Clean after yourself - remove tree after scope is destroyed
                    TreeviewManager.trees[scope.treeid].scope.$on('$destroy', function () {
                        delete TreeviewManager.trees[scope.treeid];
                    });
                }
            },

            uniqueIdUsed: [],

            makeNewNodeId: function () {
                var index, newId;

                // This do while construction prevent form accidential duplicate of generated ids
                do {
                    newId = Math.random().toString(36).substring(7);
                    index = TreeviewManager.uniqueIdUsed.indexOf(newId);
                } while (index !== -1);

                // Add id to uniqueIdUsed to check later if generated id occurs in the system
                TreeviewManager.uniqueIdUsed.push(newId);

                return newId;
            },

            /**
             * DATA storage
             *  For actually selected node or empty object if there is no selected node at the time.
             *  selectedNode is a whole scope of selected node.
             *  Object with data (like node name) is in selectedNode.treedata.
             */
            selectedNode: {},

            /**
             * Method selectNode
             *
             * Method selects new node and unselect previously selected.
             *
             * @param newNode              - Object
             * @param refreshScope
             */
            selectNode: function (newNode, treeid, refreshScope) {
                var newScope,
                    parent,
                    _makeSelection;


                _makeSelection = function () {
                    if (typeof TreeviewManager.trees[treeid].selectedNode !== 'undefined') {
                        TreeviewManager.trees[treeid].selectedNode.selected = false;
                    }

                    newNode.selected = true;
                    parent = newNode.getParent();

                    // open to the selection
                    while (parent !== null) {
                        parent.expanded = true;
                        parent = parent.getParent();
                    }

                    TreeviewManager.setSelectedNode(newNode, treeid);
                };


                if (angular.isFunction(newNode.getScope) && !!refreshScope) {
                    newScope = newNode.getScope();

                    newScope.$apply(function () {
                        _makeSelection();
                    });
                } else {
                    _makeSelection();
                }
            },

            /**
             * Method setSelectedNode
             *
             * Method sets selectedNode as given in argument.
             * It also broadcast newly selectedNode in whole application.
             *
             * @param selectedNode          - Object
             */
            setSelectedNode: function (selectedNode, treeid) {
                TreeviewManager.focusedTree = treeid;
                TreeviewManager.trees[treeid].selectedNode = selectedNode;

                $rootScope.$broadcast('treeview-selected', selectedNode, treeid);
            },

            /**
             * Method unselectNode
             *
             * Method sets actually selected node as empty object.
             * It also broadcast empty selected node in whole application.
             */
            unselectNode: function () {
                TreeviewManager.selectedNode = {};

                $rootScope.$broadcast('treeview-unselected', {});
            },

            isKeyboardNavigationPossible: function () {
                return !TreeviewManager.trees[TreeviewManager.focusedTree].scope.treesettings.disallowKeyboardNavigation;
            },

            /**
             * Methods for controlling treeview by keyboard
             */
            moveControl: {
                /**
                 * Method moveControl.left
                 *
                 * RESULT: close selected node
                 */
                left: function () {
                    var scope,
                        _left;

                    _left = function () {
                        TreeviewManager.trees[TreeviewManager.focusedTree].selectedNode.expanded = false;
                    };

                    if (angular.isFunction(TreeviewManager.trees[TreeviewManager.focusedTree].selectedNode.getScope)) {
                        scope = TreeviewManager.trees[TreeviewManager.focusedTree].selectedNode.getScope();

                        scope.$apply(function () {
                            _left();
                        });
                    } else {
                        _left();
                    }
                },

                /**
                 * Method moveControl.right
                 *
                 * RESULT: open selected node
                 */
                right: function () {
                    var scope,
                        _right;

                    _right = function () {
                        TreeviewManager.trees[TreeviewManager.focusedTree].selectedNode.expanded = true;
                    };

                    if (angular.isFunction(TreeviewManager.trees[TreeviewManager.focusedTree].selectedNode.getScope)) {
                        scope = TreeviewManager.trees[TreeviewManager.focusedTree].selectedNode.getScope();

                        scope.$apply(function () {
                            _right();
                        });
                    } else {
                        _right();
                    }
                },

                /**
                 * Method moveControl.top
                 *
                 * RESULT: go up in treeview structure
                 *
                 * FUNCTIONAL BEHAVIOUR:
                 * New selected node could be (for selected node):
                 *  - previous sibling
                 *  - previous sibling's last child
                 *  - parent
                 */
                top: function () {
                    var node = TreeviewManager.trees[TreeviewManager.focusedTree].selectedNode,
                        parent = node.getParent(),
                        index, prevElement, newSelectedNode, lastChildInPrevElement;

                    if (parent !== null) {
                        // node is not a root node
                        index = parent.subnodes.indexOf(node);

                        if (index > 0) {
                            // node has a previous sibling

                            prevElement = parent.subnodes[index - 1];
                            newSelectedNode = prevElement;

                            while (prevElement.expanded && typeof prevElement.subnodes !== 'undefined' && prevElement.subnodes.length > 0) {
                                lastChildInPrevElement = prevElement.subnodes[prevElement.subnodes.length - 1];
                                newSelectedNode = lastChildInPrevElement;

                                prevElement = lastChildInPrevElement;
                            }
                        } else {
                            // first node in array - should select its parent
                            newSelectedNode = parent;
                        }

                        TreeviewManager.selectNode(newSelectedNode, newSelectedNode.getScope().treeid, true);
                    }
                },

                /**
                 * Method moveControl.bottom
                 *
                 * RESULT: go down in treeview structure
                 *
                 * FUNCTIONAL BEHAVIOUR:
                 * New selected node could be (for selected node):
                 *  - first child
                 *  - next sibling
                 */
                bottom: function () {
                    var node = TreeviewManager.trees[TreeviewManager.focusedTree].selectedNode,
                        parent = node.getParent(),
                        index, nextElement, newSelectedNode, beforeParent;

                    if (node.expanded && angular.isArray(node.subnodes) && typeof node.subnodes[0] !== 'undefined') {
                        /* node is:
                         - a directory
                         - expanded
                         - has a child
                         ** so go to first child */

                        nextElement = node.subnodes[0];
                        newSelectedNode = nextElement;

                        TreeviewManager.selectNode(newSelectedNode, newSelectedNode.getScope().treeid, true);
                    } else if (parent !== null) {
                        index = parent.subnodes.indexOf(node);

                        if (typeof parent.subnodes[index + 1] !== 'undefined') {
                            // node is not last in subnodes array

                            nextElement = parent.subnodes[index + 1];
                            newSelectedNode = nextElement;
                        } else {
                            // it is the last node
                            do {
                                beforeParent = parent.getParent();

                                if (beforeParent !== null) {
                                    index = beforeParent.subnodes.indexOf(parent);

                                    parent = beforeParent;

                                    if (typeof beforeParent.subnodes[index + 1] !== 'undefined') {
                                        nextElement = beforeParent.subnodes[index + 1];
                                        newSelectedNode = nextElement;
                                    }
                                }
                            } while (beforeParent !== null && typeof beforeParent.subnodes[index + 1] === 'undefined');
                        }

                        if (typeof newSelectedNode !== 'undefined') {
                            TreeviewManager.selectNode(newSelectedNode, newSelectedNode.getScope().treeid, true);
                        }
                    }
                },

                /**
                 * Method moveControl.delete
                 *
                 * Method calls another method for removing selected node.
                 */
                'delete': function () {
                    TreeviewManager.trees[TreeviewManager.focusedTree].selectedNode.$removeNode();
                }
            }
        };

        keysManager = {
            '37': TreeviewManager.moveControl.left,
            '38': TreeviewManager.moveControl.top,
            '39': TreeviewManager.moveControl.right,
            '40': TreeviewManager.moveControl.bottom,
            '46': TreeviewManager.moveControl['delete']
        };

        $document.on('keydown', function (ev) {
            var key = ev.keyCode;

            if (TreeviewManager.isKeyboardNavigationPossible() && angular.isFunction(keysManager[key])) {
                keysManager[key]();
            }
        });

        return TreeviewManager;
    }]);
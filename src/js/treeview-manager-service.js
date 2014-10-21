angular.module('ioki.treeview')
    .factory('TreeviewManager', ['$document', '$rootScope', function ($document, $rootScope) {
        'use strict';

        var keysManager, TreeviewManager;

        TreeviewManager = {
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
            selectNode: function (newNode, refreshScope) {
                var newScope,
                    parent,
                    _makeSelection;


                _makeSelection = function () {
                    if (typeof TreeviewManager.selectedNode !== 'undefined') {
                        TreeviewManager.selectedNode.selected = false;
                    }
                    newNode.selected = true;
                    parent = newNode.getParent();

                    // open to the selection
                    while (parent !== null) {
                        parent.expanded = true;
                        parent = parent.getParent();
                    }

                    TreeviewManager.setSelectedNode(newNode);
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
            setSelectedNode: function (selectedNode) {
                TreeviewManager.selectedNode = selectedNode;

                $rootScope.$broadcast('treeview-selected', selectedNode);
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
                        TreeviewManager.selectedNode.expanded = false;
                    };

                    if (angular.isFunction(TreeviewManager.selectedNode.getScope)) {
                        scope = TreeviewManager.selectedNode.getScope();

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
                        TreeviewManager.selectedNode.expanded = true;
                    };

                    if (angular.isFunction(TreeviewManager.selectedNode.getScope)) {
                        scope = TreeviewManager.selectedNode.getScope();

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
                    var node = TreeviewManager.selectedNode,
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

                        TreeviewManager.selectNode(newSelectedNode, true);
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
                    var node = TreeviewManager.selectedNode,
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

                        TreeviewManager.selectNode(newSelectedNode, true);
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
                            TreeviewManager.selectNode(newSelectedNode, true);
                        }
                    }
                },

                /**
                 * Method moveControl.delete
                 *
                 * Method calls another method for removing selected node.
                 */
                'delete': function () {
                    TreeviewManager.selectedNode.$removeNode();
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

            if (angular.isFunction(keysManager[key])) {
                keysManager[key]();
            }
        });

        return TreeviewManager;
    }]);
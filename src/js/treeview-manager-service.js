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
             * @param newScope              - Object
             */
            selectNode: function (newScope) {
                newScope.$apply(function () {
                    if (typeof TreeviewManager.selectedNode.treedata !== 'undefined') {
                        TreeviewManager.selectedNode.treedata.selected = false;
                    }
                    newScope.treedata.selected = true;

                    TreeviewManager.setSelectedNode(newScope);
                });
            },

            /**
             * Method setSelectedNode
             *
             * Method sets selectedNode as given in argument.
             * It also broadcast newly selectedNode in whole application.
             *
             * @param selectedNodeScope      - Object
             */
            setSelectedNode: function (selectedNodeScope) {
                TreeviewManager.selectedNode = selectedNodeScope;

                $rootScope.$broadcast('treeview-selected', selectedNodeScope);
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
                    TreeviewManager.selectedNode.$apply(function () {
                        TreeviewManager.selectedNode.treedata.expanded = false;
                    });
                },

                /**
                 * Method moveControl.right
                 *
                 * RESULT: open selected node
                 */
                right: function () {
                    TreeviewManager.selectedNode.$apply(function () {
                        TreeviewManager.selectedNode.treedata.expanded = true;
                    });
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
                    var node = TreeviewManager.selectedNode.treedata,
                        parent = TreeviewManager.selectedNode.getParent(),
                        index, prevElement, newSelectedNode, lastChildInPrevElement;

                    if (parent !== null) {
                        // node is not a root node
                        index = parent.treedata.subnodes.indexOf(node);

                        if (index > 0) {
                            // node has a previous sibling

                            prevElement = parent.treedata.subnodes[index - 1];
                            newSelectedNode = prevElement.getScope();

                            while (prevElement.expanded && typeof prevElement.subnodes !== 'undefined' && prevElement.subnodes.length > 0) {
                                lastChildInPrevElement = prevElement.subnodes[prevElement.subnodes.length - 1];
                                newSelectedNode = lastChildInPrevElement.getScope();

                                prevElement = lastChildInPrevElement;
                            }
                        } else {
                            // first node in array - should select its parent
                            newSelectedNode = parent;
                        }

                        TreeviewManager.selectNode(newSelectedNode);
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
                    var node = TreeviewManager.selectedNode.treedata,
                        parent = TreeviewManager.selectedNode.getParent(),
                        index, nextElement, newSelectedNode, beforeParent;

                    if (node.expanded && angular.isArray(node.subnodes) && typeof node.subnodes[0] !== 'undefined') {
                        /* node is:
                         - a directory
                         - expanded
                         - has a child
                         ** so go to first child */

                        nextElement = node.subnodes[0];
                        newSelectedNode = nextElement.getScope(nextElement);

                        TreeviewManager.selectNode(newSelectedNode);
                    } else if (parent !== null) {
                        index = parent.treedata.subnodes.indexOf(node);

                        if (typeof parent.treedata.subnodes[index + 1] !== 'undefined') {
                            // node is not last in subnodes array

                            nextElement = parent.treedata.subnodes[index + 1];
                            newSelectedNode = nextElement.getScope();
                        } else {
                            // it is the last node
                            do {
                                beforeParent = parent.getParent();

                                if (beforeParent !== null) {
                                    index = beforeParent.treedata.subnodes.indexOf(parent.treedata);

                                    parent = beforeParent;

                                    if (typeof beforeParent.treedata.subnodes[index + 1] !== 'undefined') {
                                        nextElement = beforeParent.treedata.subnodes[index + 1];
                                        newSelectedNode = nextElement.getScope();
                                    }
                                }
                            } while (beforeParent !== null && typeof beforeParent.treedata.subnodes[index + 1] === 'undefined');
                        }

                        if (typeof newSelectedNode !== 'undefined') {
                            TreeviewManager.selectNode(newSelectedNode);
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
            '46': TreeviewManager.moveControl.delete
        };

        $document.on('keydown', function (ev) {
            var key = ev.keyCode;

            if (angular.isFunction(keysManager[key])) {
                keysManager[key]();
            }
        });

        return TreeviewManager;
    }]);
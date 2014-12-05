angular.module('ioki.treeview', [
        'RecursionHelper'
    ])
    .directive("treeview", ['RecursionHelper', '$treeview', '$templateCache', '$compile', '$document', '$window', '$q', 'TreeviewManager', function (RecursionHelper, $treeview, $templateCache, $compile, $document, $window, $q, TreeviewManager) {
        'use strict';

        var settings = {};

        return {
            restrict: "E",
            transclude: true,
            scope: {
                treedata: '=',
                treesettings: '=?',
                treeid: '=?',
                treeAllowCopy: '=?'
            },
            compile: function (element) {

                /**
                 * Private method onNodeAction
                 *
                 * Method provides additional API and properties for each node on tree structure
                 *
                 * @param node                  - Object
                 * @param parent                - Object / Null Object
                 * @private
                 */
                function _onNodeAction (node, parent) {
                    var par = parent;

                    node.setParent = function (newParent) {
                        par = newParent;
                    };

                    /**
                     * Method getParent
                     *
                     * Method return parent of the node
                     *
                     * @returns {*}
                     */
                    node.getParent = function () {
                        return par;
                    };

                    /**
                     * Method getNext
                     *
                     * Method returns next node in subnodes array or null if current node is last in array
                     *
                     * @returns {*}
                     */
                    node.getNext = function () {
                        var index,
                            nextNode;

                        if (parent !== null) {
                            index = parent.subnodes.indexOf(node);
                            nextNode = parent.subnodes[index+1];

                            return (typeof nextNode !== 'undefined') ? nextNode : null;
                        } else {
                            return null;
                        }
                    };

                    /**
                     * Method getPrev
                     *
                     * Method returns previous node in subnodes array or null if current node is first in array
                     *
                     * @returns {*}
                     */
                    node.getPrev = function () {
                        var index,
                            prevNode;

                        if (parent !== null) {
                            index = parent.subnodes.indexOf(node);
                            prevNode = parent.subnodes[index-1];

                            return (typeof prevNode !== 'undefined') ? prevNode : null;
                        } else {
                            return null;
                        }
                    };

                    /*
                        Add levels indicators to nested subtrees.
                     */
                    node.level = (parent === null) ? 1 : parent.level + 1;


                    if (angular.isArray(node.subnodes)) {
                        for (var i = 0, len = node.subnodes.length; i < len; i++) {
                            _onNodeAction(node.subnodes[i], node);
                        }
                    }
                }

                function _addTreeToTreeManager (scope, element) {
                    scope.treeid = scope.treeid || TreeviewManager.getNextTreeId();

                    TreeviewManager.addTree(scope, element);
                }

                function _onRootScopeAction(scope, element) {
                    var rootNode = scope.treedata;

                    _addTreeToTreeManager(scope, element);
                    _onNodeAction(rootNode, null);
                }

                return RecursionHelper.compile(element, function (scope, element) {
                    /* Linking function in recursive compilation of TreeView */

//                    console.log('LINKING FNC');

                    var templateURL, template, compiledTemplate,
                        options,
                        startX = 0, startY = 0,
                        elementCopy, parent, dropIndicator, dropToDirEl,
                        isMoving = false, firstMove = true,
                        target = {
                            el:             null,
                            node:           null,
                            list:           null,
                            list_el:        null,
                            treeview:       null,
                            scope:          null,
                            addAfterEl:     true,
                            dropToDir:      false,
                            isDroppable:    false
                        };

                    /**
                     * Method getParent
                     *
                     * Method returns parent's scope of node or null if parent's scope is out of treeview.
                     *
                     * @returns {parent | null}         - Object / null - Parent's scope or null
                     */
                    scope.getParent = function () {
                        var parent = scope.$parent.$parent;

                        return (typeof parent.treedata !== 'undefined') ? parent : null;
                    };

                    if (typeof scope.treeid === 'undefined') {
                        scope.treeid = scope.getParent().treeid;
                    }

                    if (!TreeviewManager.isAddedToManager(scope)) {
                        element.attr('treeview-element-type', 'root');
                        _onRootScopeAction(scope, element);
                    }

                    /*
                        Copy settings given by user to nested nodes. Cache them in settings object.
                     */
                    if (typeof scope.treesettings !== 'undefined') {
                        angular.copy(scope.treesettings, settings);
                    }
                    scope.settings = settings;

                    /*
                        Expand treeview to given level if there is a need.
                     */
                    if (angular.isNumber(settings.expandToLevel)) {
                        scope.treedata.expanded = (scope.treedata.level < settings.expandToLevel);
                    }

                    /*
                        Initialization phase callback.
                     */
                    if (typeof scope.settings.customMethods !== 'undefined' && angular.isFunction(scope.settings.customMethods.init)) {
                        scope.settings.customMethods.init(scope, element);
                    }

                    /**
                     * Method treedata.getScope
                     *
                     * Method returns scope of node.
                     *
                     * @returns {*}                     - Object    - Scope object
                     */
                    scope.treedata.getScope = function () {
                        return scope;
                    };

                    // Get name of template
                    templateURL = scope.settings.template || 'templates/ioki-treeview';

                    // Prepare template for passing to the element
                    template = $templateCache.get(templateURL);
                    compiledTemplate = $compile(template)(scope);

                    element.append(compiledTemplate);

                    /* Prepare scope, element and settings for new treeview element which will be used in recursion process
                     * of creating whole TreeView
                     */
                    options = {scope: scope, element: element, settings: scope.settings};

                    $treeview(options);

                    /*
                     Events for Drag & Drop functionality
                     */
                    if (element.attr('treeview-element-type') !== 'root' && scope.settings.draggable) {
                        element.on('mousedown touchstart', mousedown);
                    } else {
                        if (options.settings.showExpander)  { element.addClass('show-expander');    }
                        if (!options.settings.removable)    { element.addClass('unremovable');      }
                        if (!options.settings.addable)      { element.addClass('unaddable');        }
                    }

                    function mousedown (event) {
                        var allowDragStart = scope.settings.customMethods.allowDragStart;

                        /*  allow drag if:
                         - clicked element does not have any other action bind to it
                         - user use left mouse button
                         */
                        if (event.target.tagName.toLowerCase() !== 'i' && event.target.tagName.toLowerCase() !== 'a' && event.button !== 2 && event.which !== 3) {
                            // Prevent event delegation
                            event.preventDefault();
                            event.stopPropagation();

                            if (typeof allowDragStart === 'undefined' || (angular.isFunction(allowDragStart) && allowDragStart(scope))) {
                                // get root element and cache it
                                if (TreeviewManager.trees[scope.treeid].element === 'undefined') {
                                    TreeviewManager.trees[scope.treeid].element = getTreeViewParent(element);
                                }

                                // calculate position on the screen for element
                                startX = event.pageX - element[0].offsetLeft;
                                startY = event.pageY - element[0].offsetTop;

                                // set events for $document
                                $document
                                    .on('mousemove touchmove', mousemove)
                                    .on('mouseup touchend', mouseup);
                            }
                        }

                        isMoving = false;
                    }

                    function mousemove (event) {
                        var elementWidth,
                            x = event.pageX + 10,
                            y = event.pageY + 10;

                        isMoving = true;

                        if (firstMove) {
                            // cache element's parent
                            parent = element.parent();

                            // create copy of dragged element inside TreeView
                            elementCopy = element[0].cloneNode(true);
                            elementCopy.className = 'ghost';

                            // add element's copy to TreeView - original element is dragged
                            element.after(elementCopy);

                            /*  get element width in case it's not a block with defined width and depends on the parent width
                             class 'dragging' set position: absolute; to element so it doesn't inherit width from parent
                             */
                            elementWidth = element[0].offsetWidth;

                            // apply class dragging for whole treeview
                            TreeviewManager.trees[scope.treeid].element.addClass('dragging');

                            // apply new styles for element
                            element
                                .addClass('dragged')
                                .css({
                                    left:   element[0].offsetLeft   + 'px',
                                    top:    element[0].offsetTop    + 'px',
                                    width:  elementWidth            + 'px'
                                });

                            if (typeof scope.settings.customMethods !== 'undefined' && angular.isFunction(scope.settings.customMethods.dragStart)) {
                                scope.settings.customMethods.dragStart(TreeviewManager.trees[scope.treeid].element, scope, element);
                            }

                            firstMove = false;
                        }

                        // Move element
                        element.css({
                            top: y + 'px',
                            left: x + 'px'
                        });

                        // Remove old drop indicator - DOM element which points where dragged node will be dropped
                        if (typeof dropIndicator !== 'undefined') {
                            dropIndicator.remove();
                        }

                        dropIndicator = angular.element('<li class="separator">DROP ITEM HERE</li>');

                        // Indicates on which element is cursor
                        target.el = angular.element($window.document.elementFromPoint(event.clientX, event.clientY));

                        // Find closest parent 'treeview' element for targeted element
                        target.treeview = target.el;
                        while (typeof target.treeview[0].tagName !== 'undefined' && target.treeview[0].tagName.toLowerCase() !== 'treeview') {
                            target.treeview = target.treeview.parent();
                        }

                        // Find list with subnodes for node (in DOM)
                        target.list = target.treeview.children().eq(1);

                        // Take actions if User do not try to drop node on ghost element
                        if (!isInsideGhost(target.treeview)) {
                            // Allow drop
                            target.isDroppable = true;

                            // Get scope of subtree (treeview) on which is cursor
                            target.scope = target.treeview.scope();
                            /*
                             Because of recursive nature of treeview node data can be stored:
                             - as treeData - for Global Parent for TreeView
                             - as subnode - for subnodes in whole TreeView
                             */
                            target.node = target.scope.treeData || target.scope.subnode;

                            if (!target.node.subnodes || !target.el.hasClass('node-label')) {
                                // Target is not a directory
                                target.dropToDir = false;

                                if (typeof target.node.subnodes !== 'undefined') {
                                    target.node = target.scope.$parent.treedata;
                                }

                                // Go upper than current treeview
                                target.treeview = target.treeview.parent();

                                // Define list where element should be put
                                target.list_el = target.treeview;

                                // Find parent treeview
                                while (typeof target.treeview[0].tagName !== 'undefined' && target.treeview[0].tagName.toLowerCase() !== 'treeview') {
                                    target.treeview = target.treeview.parent();
                                }

                                target.list = target.list_el.after();

                                /*  Add Drop Indicator to DOM
                                 Calculate if user wants to drop element after or before node he/she is on (target)
                                 */

                                if (event.clientY > target.list[0].getBoundingClientRect().top + (target.list[0].offsetHeight / 2)) {
                                    // add after current target
                                    target.list.after(dropIndicator);
                                    target.addAfterEl = true;
                                } else {
                                    // add before current target
                                    target.list.prepend(dropIndicator);
                                    target.addAfterEl = false;
                                }
                            } else {
                                // Target is a directory
                                target.dropToDir = true;

                                // whole subtree (treeview) is a place where dragged element will be pushed
                                target.list_el = target.treeview;

                                // add at the end of list
                                target.list = target.treeview.children().children().eq(-1);

                                target.list.after(dropIndicator);
                                target.addAfterEl = true;

                                // Remove styles from old drop to directory indicator (DOM element)
                                if (typeof dropToDirEl !== 'undefined') {
                                    dropToDirEl.removeClass('dropToDir');
                                }

                                // Define new drop to directory indicator and apply class
                                dropToDirEl = target.treeview;
                                dropToDirEl.addClass('dropToDir');
                            }

                        } else {
                            // Disallow drop
                            target.isDroppable = false;
                        }

                        // Remove styles from Drop To Directory Indicator
                        if (target.dropToDir === false) {
                            if (typeof dropToDirEl !== 'undefined') {
                                dropToDirEl.removeClass('dropToDir');
                            }
                        }

                        if (typeof scope.settings.customMethods !== 'undefined' && angular.isFunction(scope.settings.customMethods.dragging)) {
                            scope.settings.customMethods.dragging(TreeviewManager.trees[scope.treeid].element, scope, target, element);
                        }
                    }

                    /**
                     * Reset helper variables
                     * Reset styles
                     * Remove listeners
                     */
                    function mouseup() {
                        var currentNode, newCopyOfNode,
                            elementIndexToAdd, elementIndexToRemove,
                            addAfterElement,
                            parentScopeData,
                            deferred = $q.defer(),
                            promise = deferred.promise;

                        if (isMoving) {
                            // take actions if valid drop happened
                            if (target.isDroppable) {
                                // Scope where element should be dropped
                                target.scope = target.treeview.scope();

                                // Element where element should be dropped
                                target.node = target.scope.treeData || target.scope.subnode;

                                // Dragged element
                                currentNode = scope.treedata;

                                // Get Parent scope for element
                                parentScopeData = scope.$parent.$parent.treedata;
                                elementIndexToRemove = parentScopeData.subnodes.indexOf(currentNode);

                                // Dragged element can be dropped directly to directory (via node label)
                                if (target.dropToDir) {
                                    elementIndexToAdd = target.node.subnodes.length;

                                    // Expand directory if user want to put element to it
                                    if (!target.node.expanded) {
                                        target.node.expanded = true;
                                    }
                                } else {
                                    addAfterElement = target.el.scope().treedata;

                                    // Calculate new Index for dragged node (it's different for dropping node before or after target)
                                    if (target.addAfterEl) {
                                        elementIndexToAdd = target.node.subnodes.indexOf(addAfterElement) + 1;
                                    } else {
                                        elementIndexToAdd = target.node.subnodes.indexOf(addAfterElement);
                                    }
                                }

                                // "Resolve" promise - rearrange nodes
                                promise.then(function (index, newId) {
                                    var newElementIndex = index || 0;

                                    if (target.node.subnodes === parentScopeData.subnodes && newElementIndex < elementIndexToRemove) {
                                        parentScopeData.subnodes.splice(elementIndexToRemove, 1);
                                        target.node.subnodes.splice(newElementIndex, 0, currentNode);
                                    } else {
                                        // Check if node is comming from another treeview
                                        // and if copying is allowed
                                        if (currentNode.getScope().treeid !== target.node.getScope().treeid) {
                                            // If node was selected and is comming from another tree we need to select parent node in old tree
                                            if (currentNode.selected) {
                                                TreeviewManager.selectNode(currentNode.getParent(), currentNode.getScope().treeid);
                                                currentNode.selected = false;
                                            }

                                            // Assigning new id for node to avoid duplicates
                                            // Developer can provide his own id and probably should
                                            newId = newId || TreeviewManager.makeNewNodeId();
                                            currentNode.id = newId;
                                        }

                                        if (currentNode.getScope().treeid !== target.node.getScope().treeid && TreeviewManager.trees[scope.treeid].scope.treeAllowCopy) {
                                            // makes copy of node
                                            newCopyOfNode = angular.copy(currentNode);

                                            target.node.subnodes.splice(newElementIndex, 0, newCopyOfNode);
                                        } else {
                                            // cut node from one tree and put into another
                                            target.node.subnodes.splice(newElementIndex, 0, currentNode);
                                            parentScopeData.subnodes.splice(elementIndexToRemove, 1);
                                        }

                                        // Crucial timing - after adding to new tree and delete from old one
                                        // There is a need to reassign new parent for dragged node
                                        if (currentNode.getScope().treeid !== target.node.getScope().treeid) {
                                            currentNode.setParent(target.node);
                                        }
                                    }
                                });

                                /*  Custom method for DRAG END
                                 If there is no any custom method for Drag End - resolve promise and finalize dropping action
                                 */
                                if (typeof scope.settings.customMethods !== 'undefined' && angular.isFunction(scope.settings.customMethods.dragEnd)) {
                                    scope.settings.customMethods.dragEnd(target.isDroppable, TreeviewManager.trees[scope.treeid].element, scope, target, deferred);
                                } else {
                                    deferred.resolve(elementIndexToAdd);
                                }
                            } else {
                                if (typeof scope.settings.customMethods !== 'undefined' && angular.isFunction(scope.settings.customMethods.dragEnd)) {
                                    scope.settings.customMethods.dragEnd(target.isDroppable, TreeviewManager.trees[scope.treeid].element, scope, target, deferred);
                                }
                            }

                            // reset positions
                            startX = startY = 0;

                            // remove ghost
                            elementCopy.remove();
                            elementCopy = null;

                            // remove drop area indicator
                            if (typeof dropIndicator !== 'undefined') {
                                dropIndicator.remove();
                            }

                            // Remove styles from old drop to directory indicator (DOM element)
                            if (typeof dropToDirEl !== 'undefined') {
                                dropToDirEl.removeClass('dropToDir');
                            }

                            // reset droppable
                            target.isDroppable = false;

                            // remove styles for whole treeview
                            TreeviewManager.trees[scope.treeid].element.removeClass('dragging');

                            // reset styles for dragged element
                            element
                                .removeClass('dragged')
                                .removeAttr('style');
                        }

                        // remove events from $document
                        $document
                            .off('mousemove', mousemove)
                            .off('mouseup', mouseup);

                        firstMove = true;
                    }

                    function isInsideGhost(targetTreeView) {
                        var target = targetTreeView;

                        if (target.hasClass('ghost') || target.attr('treeview-element-type') === 'root') {
                            return true;
                        } else {
                            // look for ghost
                            while (typeof target[0] !== 'undefined' && target.attr('treeview-element-type') !== 'root') {
                                if (typeof target[0].tagName !== 'undefined') {
                                    if (target[0].tagName.toLowerCase() === 'treeview' && target.hasClass('ghost')) {
                                        return true;
                                    }
                                } else {
                                    return true;
                                }

                                target = target.parent();
                            }
                        }

                        return false;
                    }

                    function getTreeViewParent (el) {

                        if (typeof el !== 'undefined') {
                            while (typeof el !== 'undefined' && el.attr('treeview-element-type') !== 'root') {
                                el = el.parent();

                                if (el.attr('treeview-element-type') === 'root') {
                                    return {
                                        el: el,
                                        scope: el.scope()
                                    };
                                }
                            }
                        }
                    }
                });
            }
        };
    }]);
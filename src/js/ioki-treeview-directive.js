angular.module('ioki.treeview', ['RecursionHelper'])
    .provider('$treeview', function () {
        'use strict';

        var defaults = this.defaults = {
            prefixClass: 'treeview-',
            prefixEvent: 'treeview',
            treesettings: {
                template: 'templates/ioki-treeview',
                /* base class for icons system
                 * e.g. 'fa' for FontAwesome, 'glyphicons' for Glyphicons etc.
                 * we use FontAwesome by default
                 */
                iconsBaseClass: 'fa',
                /* beside your own template you can also configure specific icon in the interface */
                interfaceIcons: {
                    /* icon for adding new nodes */
                    addNode: 'fa-plus-circle',
                    /* icon for removing nodes */
                    removeNode: 'fa-minus-circle',
                    /* icon for open directory */
                    openDir: 'fa-caret-down',
                    /* icon for close directory */
                    closeDir: 'fa-caret-right'
                },
                /* define if user can expand / collapse nodes */
                expandable: true,

                /* define if all nodes should be expanded on loading the tree */
                expandAll: true,

                /* define if user see expanders */
                showExpander: true,

                /* define if user can remove nodes */
                removable: false,

                /* define if user can add nodes */
                addable: true,

                /* define if user can select node */
                selectable: false,

                /* treeview offers custom methods via controller's scope */
                customMethods: {
                    /* addNode method */
                    addNode: null,
                    /* removeNode method */
                    removeNode: null,
                    /* method is called when node is started to drag (fire once) */
                    dragStart: null,
                    /* method is called when node is stopped to drag (fire once) */
                    dragEnd: null,
                    /* method is called when node is dragged */
                    dragging: null,
                    /* method is called when node is dropped */
                    drop: null
                }
            }
        };

        this.$get = function () {

            function TreeViewFactory (config) {
                var $treeview = {},
                    options, scope,
                    prop;

                options = $treeview.$options = angular.extend({}, defaults, config);

                /*
                 copy defaults options for treeview (@var defaults)
                 if option specific for instance (@var config) wasn't defined
                 */
                for (prop in defaults.treesettings) {
                    if (defaults.treesettings.hasOwnProperty(prop)) {
                        if (typeof config.treesettings[prop] === 'undefined') {
                            options.treesettings[prop] = defaults.treesettings[prop];
                        }
                    }
                }

                /*
                 copy defaults interface icons if they are not defined in specific options for instance
                 */
                if (typeof config.treesettings.interfaceIcons !== 'undefined') {
                    for (prop in defaults.treesettings.interfaceIcons) {
                        if (defaults.treesettings.interfaceIcons.hasOwnProperty(prop)) {
                            if (typeof config.treesettings.interfaceIcons[prop] === 'undefined') {
                                options.treesettings.interfaceIcons[prop] = defaults.treesettings.interfaceIcons[prop];
                            }
                        }
                    }
                }

                scope = $treeview.$scope = options.scope;
                scope.treesettings = options.treesettings;

                if (typeof scope.$parent.$parent.treedata === 'undefined' || !options.treesettings.removable) {
                    scope.treedata.$removable = false;
                } else {
                    scope.treedata.$removable = true;
                }

                if (options.treesettings.expandAll && !scope.treedata.expandAllCalled) {
                    scope.treedata.expanded = true;
                    scope.treedata.expandAllCalled = true;
                }

                scope.$addNode = function (obj) {
                    $treeview.addNode(obj);
                };

                scope.$removeNode = function () {
                    $treeview.removeNode();
                };

                scope.$toggleNode = function () {
                    $treeview.toggleNode();
                };

                scope.$selectNode = function () {
                    $treeview.selectNode();
                };

                /**
                 * Method toggleNode
                 *  1) available in TreeView's scope
                 *  2) requires property "expandable" in treesettings to be true
                 *
                 * This method change state "expanded" in current node for opposite state
                 */
                $treeview.toggleNode = function () {
                    if (options.treesettings.expandable) {
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
                $treeview.selectNode = function () {
                    var state;

                    if (options.treesettings.selectable) {
                        // save actual state
                        state = scope.treedata.selected;

                        // unselect all nodes
                        setPropertyForAllNodes('selected', false);

                        // change state of clicked element on opposite state
                        scope.treedata.selected = !state;
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
                    if (options.treesettings.addable) {
                        if (typeof options.treesettings.customMethods.addNode === 'function') {
                            options.treesettings.customMethods.addNode(scope, obj);
                        }
                    }
                };

                /**
                 * Method removeNode
                 *  1) available in TreeView's scope
                 *  2) requires property "removable" in treesettings to be true
                 *  3) (optionally) can use customMethod removeNode
                 *
                 * This method removes current node
                 */
                $treeview.removeNode = function () {
                    var node = scope.treedata,
                        parent, subnodesArray, index;

                    if (options.treesettings.removable) {
                        if (typeof options.treesettings.customMethods.removeNode === 'function') {
                            options.treesettings.customMethods.removeNode(scope);
                        } else {
                            parent = scope.$parent.$parent.treedata;

                            if (typeof parent !== 'undefined') {
                                subnodesArray = parent.subnodes;

                                if (angular.isArray(subnodesArray)) {
                                    index = subnodesArray.indexOf(node);

                                    if (index > -1) {
                                        subnodesArray.splice(index,1);
                                    }
                                }
                            }

                        }
                    }
                };

                /**
                 * Function setPropertyForAllNodes
                 *
                 * Function sets given property (@param prop) with given value (@param value) for all nodes in tree
                 *
                 * @param prop              - String
                 * @param value             - String / Number / Boolean
                 */
                function setPropertyForAllNodes (prop, value) {
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
                function setPropertyForSubnodes (actualSubnodes, prop, value) {
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
                function getRootNode (scope) {
                    if (typeof scope.$parent.$parent.treedata === 'undefined') {
                        return scope;
                    } else {
                        return getRootNode(scope.$parent.$parent);
                    }
                }

                return $treeview;
            }

            return TreeViewFactory;
        };
    })
    .directive("treeview", ['RecursionHelper', '$treeview', '$templateCache', '$compile', '$document', '$window', '$q', function (RecursionHelper, $treeview, $templateCache, $compile, $document, $window, $q) {
        'use strict';

        var rootParent;

        return {
            restrict: "E",
            transclude: true,
            scope: {
                treedata: '=',
                treesettings: '='
            },
            compile: function (element) {

                // cache root
                if (typeof rootParent === 'undefined') {
                    element.attr('treeview-element-type', 'root');
                    rootParent = {};
                }

                return RecursionHelper.compile(element, function (scope, element) {
                    /* Linking function in recursive compilation of TreeView */

                    var templateURL, template, compiledTemplate,
                        options,
                        startX = 0, startY = 0,
                        elementCopy, parent, dropIndicator, dropToDirEl,
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

                    // Get name of template
                    templateURL = scope.treesettings.template || 'templates/ioki-treeview';

                    // Prepare template for passing to the element
                    template = $templateCache.get(templateURL);
                    compiledTemplate = $compile(template)(scope);

                    element.append(compiledTemplate);

                    /* Prepare scope, element and settings for new treeview element which will be used in recursion process
                     * of creating whole TreeView
                     */
                    options = {scope: scope, element: element, treesettings: {}};

                    if (angular.isDefined(scope.treesettings)) {
                        angular.copy(scope.treesettings, options.treesettings);
                    }

                    $treeview(options);

                    /*
                     Events for Drag & Drop functionality
                     */
                    if (element.attr('treeview-element-type') !== 'root') {
                        element.on('mousedown touchstart', function (event) {
                            var elementWidth;

                            /*  allow drag if:
                             - clicked element does not have any other action bind to it
                             - user use left mouse button
                             */
                            if (event.target.tagName.toLowerCase() !== 'i' && event.target.tagName.toLowerCase() !== 'a' && event.button !== 2 && event.which !== 3) {
                                // Prevent event delegation
                                event.preventDefault();
                                event.stopPropagation();

                                // get root element and cache it
                                if (typeof rootParent.el === 'undefined') {
                                    rootParent = getTreeViewParent(element);
                                }

                                // cache element's parent
                                parent = element.parent();

                                // create copy of dragged element inside TreeView
                                elementCopy = element[0].cloneNode(true);
                                elementCopy.className = 'ghost';

                                // add element's copy to TreeView - original element is dragged
                                element.after(elementCopy);

                                // calculate position on the screen for element
                                startX = event.pageX - element[0].offsetLeft;
                                startY = event.pageY - element[0].offsetTop;

                                /*  get element width in case it's not a block with defined width and depends on the parent width
                                 class 'dragging' set position: absolute; to element so it doesn't inherit width from parent
                                 */
                                elementWidth = element[0].offsetWidth;

                                // apply class dragging for whole treeview
                                rootParent.el.addClass('dragging');

                                // apply new styles for element
                                element
                                    .addClass('dragged')
                                    .css({
                                        left:   element[0].offsetLeft   + 'px',
                                        top:    element[0].offsetTop    + 'px',
                                        width:  elementWidth            + 'px'
                                    });

                                // set events for $document
                                $document
                                    .on('mousemove touchmove', mousemove)
                                    .on('mouseup touchend', mouseup);

                                if (typeof scope.treesettings.customMethods.dragStart === 'function') {
                                    scope.treesettings.customMethods.dragStart(rootParent, scope, element);
                                }
                            }
                        });
                    }

                    function mousemove(event) {
                        var x = event.pageX + 10,
                            y = event.pageY + 10,
                            dropIndicatorEl = angular.element('<li class="separator">DROP ITEM HERE</li>');

                        // Move element
                        element.css({
                            top: y + 'px',
                            left: x + 'px'
                        });

                        // Remove old drop indicator - DOM element which points where dragged node will be dropped
                        if (typeof dropIndicator !== 'undefined') {
                            dropIndicator.remove();
                        }

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
                                    target.list.after(dropIndicatorEl);
                                    target.addAfterEl = true;
                                } else {
                                    // add before current target
                                    target.list.prepend(dropIndicatorEl);
                                    target.addAfterEl = false;
                                }
                            } else {
                                // Target is a directory
                                target.dropToDir = true;

                                // whole subtree (treeview) is a place where dragged element will be pushed
                                target.list_el = target.treeview;

                                // add at the end of list
                                target.list = target.treeview.children().children().eq(-1);

                                target.list.after(dropIndicatorEl);
                                target.addAfterEl = true;

                                // Remove styles from old drop to directory indicator (DOM element)
                                if (typeof dropToDirEl !== 'undefined') {
                                    dropToDirEl.removeClass('dropToDir');
                                }

                                // Define new drop to directory indicator and apply class
                                dropToDirEl = target.treeview;
                                dropToDirEl.addClass('dropToDir');
                            }

                            // Cache drop indicator for future to remove it
                            dropIndicator = dropIndicatorEl;
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

                        if (typeof scope.treesettings.customMethods.dragging === 'function') {
                            scope.treesettings.customMethods.dragging(rootParent, scope, target, element);
                        }
                    }

                    /**
                     * Reset helper variables
                     * Reset styles
                     * Remove listeners
                     */
                    function mouseup() {
                        var currentNode,
                            elementIndexToAdd, elementIndexToRemove,
                            addAfterElement,
                            parentScopeData,
                            deferred = $q.defer(),
                            promise = deferred.promise;

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
                                addAfterElement = target.list_el.children().eq(0).scope().subnode;

                                // Calculate new Index for dragged node (it's different for dropping node before or after target)
                                if (target.addAfterEl) {
                                    elementIndexToAdd = target.node.subnodes.indexOf(addAfterElement) + 1;
                                } else {
                                    elementIndexToAdd = target.node.subnodes.indexOf(addAfterElement);
                                }
                            }

                            // "Resolve" promise - rearrange nodes
                            promise.then(function (index) {
                                var newElementIndex = index || 0;

                                if (target.node.subnodes === parentScopeData.subnodes && newElementIndex < elementIndexToRemove) {
                                    parentScopeData.subnodes.splice(elementIndexToRemove, 1);
                                    target.node.subnodes.splice(newElementIndex, 0, currentNode);
                                } else {
                                    target.node.subnodes.splice(newElementIndex, 0, currentNode);
                                    parentScopeData.subnodes.splice(elementIndexToRemove, 1);
                                }
                            });

                            /*  Custom method for DRAG END
                             If there is no any custom method for Drag End - resolve promise and finalize dropping action
                             */
                            if (typeof scope.treesettings.customMethods.dragEnd === 'function') {
                                scope.treesettings.customMethods.dragEnd(target.isDroppable, rootParent, scope, target, deferred);
                            } else {
                                deferred.resolve(elementIndexToAdd);
                            }
                        } else {
                            if (typeof scope.treesettings.customMethods.dragEnd === 'function') {
                                scope.treesettings.customMethods.dragEnd(target.isDroppable, rootParent, scope, target, deferred);
                            }
                        }

                        // reset positions
                        startX = startY = 0;

                        // remove ghost
                        parent[0].removeChild(elementCopy);

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
                        rootParent.el.removeClass('dragging');

                        // reset styles for dragged element
                        element
                            .removeClass('dragged')
                            .removeAttr('style');

                        // remove events from $document
                        $document
                            .off('mousemove', mousemove)
                            .off('mouseup', mouseup);
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
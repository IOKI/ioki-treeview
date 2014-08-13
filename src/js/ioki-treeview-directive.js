angular.module('ioki.treeview', [
        'RecursionHelper',
        'pasvaz.bindonce'
    ])
    .provider('$treeview', function () {
        'use strict';

        var defaults = this.defaults = {
                prefixClass: 'treeview-',
                prefixEvent: 'treeview',
                treesettings: {
                    /* template URL */
                    template: 'templates/ioki-treeview',

                    /* base class for icons system
                     * e.g. 'fa' for FontAwesome, 'glyphicons' for Glyphicons etc.
                     * we use FontAwesome by default
                     */
                    iconsBaseClass: 'fa',

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
            },
            options = {};

        this.$get = function ($rootScope) {

            function TreeViewFactory (config) {
                var $treeview = {}, scope,
                    prop;

                function _isRootNode (scope) {
                    return typeof scope.$parent.$parent.treedata === 'undefined';
                }

                /**
                 * _Private Method isNodeRemovable
                 *
                 * Is node removable is determine by global settings (options.settings.removable)
                 * User also can not remove Parent Node for whole TreeView
                 *
                 * @param scope             - Object    - scope of the node
                 * @returns {boolean}       - Boolean   - returns true if node is removable
                 */
                function _isNodeRemovable (scope) {
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

                    if (options.settings.rootSelected && _isRootNode(scope)){
                        scope.treedata.selected = true;
                        $rootScope.$broadcast('treeview-selected', scope.treedata);
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
                        if (typeof ev.toElement.attributes['ng-click'] !== 'undefined' && ev.toElement.attributes['ng-click'].value !== '$selectNode($event)') {
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

                        if (scope.treedata.selected) {
                            $rootScope.$broadcast('treeview-selected', scope.treedata);
                        } else {
                            $rootScope.$broadcast('treeview-unselected', scope.treedata);
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
                 * This method removes current node
                 */
                $treeview.removeNode = function () {
                    var node = scope.treedata,
                        parent, subnodesArray, index;

                    if (options.settings.removable) {
                        if (typeof options.settings.customMethods.removeNode === 'function') {
                            options.settings.customMethods.removeNode(scope);
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

        var rootParent,
            settings = {};

        return {
            restrict: "E",
            transclude: true,
            scope: {
                treedata: '=',
                treesettings: '=?'
            },
            compile: function (element) {

                // cache root
                // beside recursive nature of treeview the code below will be executed exactly once
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

                    if (typeof scope.treesettings !== 'undefined') {
                        angular.copy(scope.treesettings, settings);
                    }

                    scope.settings = settings;

                    // Expand to given Level
                    if (angular.isNumber(settings.expandToLevel)) {
                        if (typeof scope.$parent.treedata === 'undefined') {
                            scope.treedata.level = 1;
                        } else {
                            scope.treedata.level = scope.$parent.treedata.level + 1;
                        }

                        scope.treedata.expanded = (scope.treedata.level < settings.expandToLevel);
                    }

                    // Method getParent
                    scope.treedata.getParent = function() {
                        var parent = scope.$parent.$parent.$parent.treedata;

                        return (typeof parent !== 'undefined') ? parent : null;
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
                    if (element.attr('treeview-element-type') !== 'root') {
                        element.on('mousedown touchstart', mousedown);
                    } else {
                        if (options.settings.showExpander)  { element.addClass('show-expander');    }
                        if (!options.settings.removable)    { element.addClass('unremovable');      }
                        if (!options.settings.addable)      { element.addClass('unaddable');        }
                    }

                    function mousedown (event) {
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

                            // calculate position on the screen for element
                            startX = event.pageX - element[0].offsetLeft;
                            startY = event.pageY - element[0].offsetTop;

                            // set events for $document
                            $document
                                .on('mousemove touchmove', mousemove)
                                .on('mouseup touchend', mouseup);
                        }

                        isMoving = false;
                    }

                    function mousemove(event) {
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
                            rootParent.el.addClass('dragging');

                            // apply new styles for element
                            element
                                .addClass('dragged')
                                .css({
                                    left:   element[0].offsetLeft   + 'px',
                                    top:    element[0].offsetTop    + 'px',
                                    width:  elementWidth            + 'px'
                                });

                            if (typeof scope.settings.customMethods.dragStart === 'function') {
                                scope.settings.customMethods.dragStart(rootParent, scope, element);
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

                        if (typeof scope.settings.customMethods.dragging === 'function') {
                            scope.settings.customMethods.dragging(rootParent, scope, target, element);
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
                                if (typeof scope.settings.customMethods.dragEnd === 'function') {
                                    scope.settings.customMethods.dragEnd(target.isDroppable, rootParent, scope, target, deferred);
                                } else {
                                    deferred.resolve(elementIndexToAdd);
                                }
                            } else {
                                if (typeof scope.settings.customMethods.dragEnd === 'function') {
                                    scope.settings.customMethods.dragEnd(target.isDroppable, rootParent, scope, target, deferred);
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
                            rootParent.el.removeClass('dragging');

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
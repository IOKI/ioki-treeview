angular.module('RecursionHelper', [])
    .factory('RecursionHelper', ['$compile', function ($compile) {
        'use strict';

        /*
         * An Angular service which helps with creating recursive directives.
         * @author Mark Lagendijk
         * @license MIT
         */
        return {
            /**
             * Manually compiles the element, fixing the recursion loop.
             * @param element
             * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
             * @returns An object containing the linking functions.
             */
            compile: function (element, link) {
                // Normalize the link parameter
                if (angular.isFunction(link)) {
                    link = { post: link };
                }

                // Break the recursion loop by removing the contents
                var contents = element.contents().remove();
                var compiledContents;
                return {
                    pre: (link && link.pre) ? link.pre : null,
                    /**
                     * Compiles and re-adds the contents
                     */
                    post: function (scope, element) {
                        // Compile the contents
                        if (!compiledContents) {
                            compiledContents = $compile(contents);
                        }
                        // Re-add the compiled contents to the element
                        compiledContents(scope, function (clone) {
                            element.append(clone);
                        });

                        // Call the post-linking function, if any
                        if (link && link.post) {
                            link.post.apply(null, arguments);
                        }
                    }
                };
            }
        };
    }]);
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
                        var currentNode,
                            elementIndexToAdd, elementIndexToRemove,
                            addAfterElement,
                            parentScopeData,
                            deferred = $q.defer(),
                            newCopyOfNode = {},
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
                                target.elementIndexToAdd = elementIndexToAdd;

                                // "Resolve" promise - rearrange nodes
                                promise.then(function (passedObj) {
                                    var newElementIndex = passedObj.index || 0,
                                        newId;

                                    if (target.node.subnodes === parentScopeData.subnodes && newElementIndex < elementIndexToRemove) {
                                        parentScopeData.subnodes.splice(elementIndexToRemove, 1);
                                        target.node.subnodes.splice(newElementIndex, 0, currentNode);
                                    } else {
                                        // Check if node is comming from another treeview
                                        if (currentNode.getScope().treeid !== target.node.getScope().treeid) {
                                            // If node was selected and is comming from another tree we need to select parent node in old tree
                                            if (currentNode.selected) {
                                                TreeviewManager.selectNode(currentNode.getParent(), currentNode.getScope().treeid);
                                                currentNode.selected = false;
                                            }

                                            // Assigning new id for node to avoid duplicates
                                            // Developer can provide his own id and probably should
                                            newId = passedObj.newId || TreeviewManager.makeNewNodeId();

                                            if (TreeviewManager.trees[scope.treeid].scope.treeAllowCopy) {
                                                // makes copy of node
                                                newCopyOfNode = angular.copy(currentNode);
                                                newCopyOfNode.id = newId;
                                                newCopyOfNode.level = ++target.node.level;
                                                newCopyOfNode.getParent = function () {
                                                    return target.node;
                                                };

                                                target.node.subnodes.splice(newElementIndex, 0, newCopyOfNode);
                                            } else {
                                                // cut node from one tree and put into another
                                                currentNode.id = newId;

                                                target.node.subnodes.splice(newElementIndex, 0, currentNode);
                                                parentScopeData.subnodes.splice(elementIndexToRemove, 1);

                                                currentNode.setParent(target.node);
                                            }
                                        } else {
                                            target.node.subnodes.splice(newElementIndex, 0, currentNode);
                                            parentScopeData.subnodes.splice(elementIndexToRemove, 1);
                                        }
                                    }
                                });

                                /*  Custom method for DRAG END
                                 If there is no any custom method for Drag End - resolve promise and finalize dropping action
                                 */
                                if (typeof scope.settings.customMethods !== 'undefined' && angular.isFunction(scope.settings.customMethods.dragEnd)) {
                                    scope.settings.customMethods.dragEnd(target.isDroppable, TreeviewManager.trees[scope.treeid].element, scope, target, deferred);
                                } else {
                                    deferred.resolve({index: elementIndexToAdd});
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
angular.module('ioki.treeview').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/ioki-treeview',
    "<treeview-node ng-controller=\"OptionalNodeCtrl as optionalNodeCtrl\">\n" +
    "    <treeview-node-body\n" +
    "        ng-class=\"{\n" +
    "            'expanded': treedata.expanded,\n" +
    "            'selected': treedata.selected,\n" +
    "            'dir': treedata.subnodes\n" +
    "        }\"\n" +
    "        ng-click=\"$selectNode($event)\">\n" +
    "\n" +
    "        <!-- expander icon -->\n" +
    "        <i class=\"fa expander\"\n" +
    "           ng-click=\"$toggleNode()\"></i>\n" +
    "\n" +
    "        <!-- node icon -->\n" +
    "        <i class=\"fa node-icon\"></i>\n" +
    "\n" +
    "        <!-- node label -->\n" +
    "        <span class=\"node-label\" ng-bind=\"treedata.name\" ng-click=\"optionalNodeCtrl.someMethod()\"></span>\n" +
    "\n" +
    "        <!-- remove node icon -->\n" +
    "        <i class=\"fa remove-node\"\n" +
    "           ng-click=\"$removeNode()\"></i>\n" +
    "\n" +
    "        <!-- add node icon -->\n" +
    "        <i class=\"fa add-node\"\n" +
    "           ng-click=\"$addNode()\"></i>\n" +
    "    </treeview-node-body>\n" +
    "    <ul>\n" +
    "        <li ng-repeat=\"subnode in treedata.subnodes track by subnode.id\" ng-if=\"treedata.subnodes && treedata.expanded\">\n" +
    "            <treeview treedata=\"subnode\"></treeview>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</treeview-node>\n"
  );

}]);

angular.module('ioki.treeview')
    .filter('getNodeIcon', function () {
        'use strict';

        /**
         * getNodeIcon filter
         *
         * Filter based on Icons Schema provided for directive is trying to match icon for a specific node
         * Icon is a CSS Class
         *
         * @node - node in treeview
         * @icons - Icons Schema
         *
         * @return String - CSS Class for specific icon
         */
        return function (node, icons) {
            var icon;

            /* IF Statement
                node.type should be a string and has representation on icons schema
             */
            if (typeof node.type === 'string' && typeof icons[node.type] !== 'undefined') {
                icon = icons[node.type];

                /* IF Statement
                    icon can be either:
                        - object - with two properties with icon's names for open node (expanded) and closed (contracted)
                        - string - name for icon (node cannot be expanded or have the same icon for two states)
                 */
                if (icon !== null && typeof icon === 'object') {
                    node.expanded = node.expanded || false;

                    if (node.expanded) {
                        return icon.open;
                    } else {
                        return icon.closed;
                    }
                } else {
                    return icon;
                }
            } else {
                return null;
            }
        };
    });
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
                    removeNode: null
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

                if (options.treesettings.expandAll) {
                    scope.treedata.expanded = true;
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
    .directive("treeview", ['RecursionHelper', '$treeview', '$templateCache', '$compile', function (RecursionHelper, $treeview, $templateCache, $compile) {
        'use strict';
        
        return {
            restrict: "E",
            scope: {
                treedata: '=',
                treesettings: '='
            },
            compile: function (element) {

                return RecursionHelper.compile(element, function (scope, element) {
                    /* Linking function in recursive compilation of TreeView */

                    var templateURL, template, compiledTemplate,
                        options;

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
                });
            }
        };
    }]);
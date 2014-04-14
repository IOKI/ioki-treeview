angular.module('RecursionHelper', []).factory('RecursionHelper', ['$compile', function($compile){
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
        compile: function(element, link){
            // Normalize the link parameter
            if(angular.isFunction(link)){
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
                post: function(scope, element){
                    // Compile the contents
                    if(!compiledContents){
                        compiledContents = $compile(contents);
                    }
                    // Re-add the compiled contents to the element
                    compiledContents(scope, function(clone){
                        element.append(clone);
                    });

                    // Call the post-linking function, if any
                    if(link && link.post){
                        link.post.apply(null, arguments);
                    }
                }
            };
        }
    };
}]);
angular.module('ioki.treeview', ['RecursionHelper'])
    .provider('$treeview', function () {
        'use strict';

        var defaults = this.defaults = {
            prefixClass: 'treeview-',
            prefixEvent: 'treeview',
            treesettings: {
                /* define if user can expand / collapse nodes */
                expandable: true,

                /* define if all nodes should be expanded on loading the tree */
                expandAll: true,

                /* define if user see expanders */
                showExpander: true,

                /* define if user can delete nodes */
                deletable: false,

                /* define if user can add nodes */
                addable: false,

                /* define if user can select node */
                selectable: false
            }
        };

        this.$get = function () {

            function TreeViewFactory (config) {
                var $treeview = {},
                    options, scope;

                options = $treeview.$options = angular.extend({}, defaults, config);

                /*
                 copy defaults options for treeview (@var defaults)
                 if option specific for instance (@var config) wasn't defined
                 */
                for (var prop in defaults.treesettings) {
                    if (defaults.treesettings.hasOwnProperty(prop)) {
                        if (typeof config.treesettings[prop] === 'undefined') {
                            options.treesettings[prop] = defaults.treesettings[prop];
                        }
                    }
                }

                scope = $treeview.$scope = options.scope;
                scope.treesettings = options.treesettings;

                if (typeof scope.$parent.$parent.treedata === 'undefined' || !options.treesettings.deletable) {
                    scope.treedata.$removable = false;
                } else {
                    scope.treedata.$removable = true;
                }

                if (options.treesettings.expandAll) {
                    scope.treedata.expanded = true;
                }

                scope.$toggleNode = function () {
                    $treeview.toggleNode();
                };

                scope.$selectNode = function () {
                    $treeview.selectNode();
                };

                $treeview.toggleNode = function () {
                    if (options.treesettings.expandable) {
                        scope.treedata.expanded = !scope.treedata.expanded;
                    }
                };

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
    .directive("treeview", function (RecursionHelper, $treeview) {
        'use strict';
        
        return {
            restrict: "E",
            scope: {
                treedata: '=',
                treesettings: '='
            },
            templateUrl: "../src/js/ioki-treeview.tpl.html",
            compile: function (element) {
                return RecursionHelper.compile(element, function (scope, element) {
                    var options = {scope: scope, element: element, treesettings: {}};

                    if (angular.isDefined(scope.treesettings)) {
                        angular.copy(scope.treesettings, options.treesettings);
                    }

                    $treeview(options);
                });
            }
        };
    });
angular.module('ioki.treeview')
    .filter('getNodeIcon', function() {
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
            if (typeof node.type === 'string' && typeof icons[node.type] !== 'undefined'){
                icon = icons[node.type];

                /* IF Statement
                    icon can be either:
                        - object - with two properties with icon's names for open node (expanded) and closed (contracted)
                        - string - name for icon (node cannot be expanded or have the same icon for two states)
                 */
                if (icon !== null && typeof icon === 'object') {
                    node.expanded = node.expanded || false;

                    if (node.expanded){
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
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
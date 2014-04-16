angular.module('ioki.treeview').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/ioki-treeview',
    "<div ng-class=\"{'expanded': treedata.expanded, 'selected': treedata.selected}\"\n" +
    "     ng-click=\"$selectNode()\">\n" +
    "    <!-- expander icon -->\n" +
    "    <i class=\"expander fa\"\n" +
    "       ng-class=\"(treedata.subnodes && treesettings.showExpander) ? (treedata.expanded ? 'fa-caret-down' : 'fa-caret-right') : 'invisible'\"\n" +
    "       ng-click=\"$toggleNode()\"></i>\n" +
    "\n" +
    "    <!-- node icon -->\n" +
    "    <i class=\"fa {{treedata | getNodeIcon: treesettings.icons}}\"></i> {{ treedata.name }}\n" +
    "\n" +
    "    <!-- remove node icon -->\n" +
    "    <i class=\"remove-node fa fa-minus-circle\"\n" +
    "       ng-click=\"$removeNode()\"\n" +
    "       ng-class=\"{'invisible': !treedata.$removable}\"></i>\n" +
    "\n" +
    "    <!-- add node icon -->\n" +
    "    <i class=\"add-node fa fa-plus-circle\"\n" +
    "       ng-click=\"$addNode()\"\n" +
    "       ng-class=\"{'invisible': (!treesettings.addable || !treedata.subnodes)}\"></i>\n" +
    "</div>\n" +
    "<ul ng-class=\"{'expanded': treedata.expanded}\">\n" +
    "    <li ng-repeat=\"subnode in treedata.subnodes track by $index\">\n" +
    "        <treeview treedata=\"subnode\" treesettings=\"treesettings\"></treeview>\n" +
    "    </li>\n" +
    "</ul>"
  );

}]);

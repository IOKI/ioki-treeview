angular.module('ioki.treeview').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/ioki-treeview',
    "<div bindonce\n" +
    "     bo-class=\"{'dir': treedata.subnodes}\"\n" +
    "     ng-class=\"{'expanded': treedata.expanded, 'selected': treedata.selected}\"\n" +
    "     ng-click=\"$selectNode()\">\n" +
    "\n" +
    "    <!-- expander icon -->\n" +
    "    <i class=\"expander\"\n" +
    "       bo-class=\"treesettings.iconsBaseClass\"\n" +
    "       ng-click=\"$toggleNode()\"></i>\n" +
    "\n" +
    "    <!-- node icon -->\n" +
    "    <i class=\"node-icon\"\n" +
    "       bo-class=\"treesettings.iconsBaseClass\"></i>\n" +
    "\n" +
    "    <!-- node label -->\n" +
    "    <span class=\"node-label\" bo-text=\"treedata.name\"></span>\n" +
    "\n" +
    "    <!-- remove node icon -->\n" +
    "    <i class=\"remove-node\"\n" +
    "       bo-class=\"treesettings.iconsBaseClass\"\n" +
    "       ng-click=\"$removeNode()\"></i>\n" +
    "\n" +
    "    <!-- add node icon -->\n" +
    "    <i class=\"add-node\"\n" +
    "       bo-class=\"treesettings.iconsBaseClass\"\n" +
    "       ng-click=\"$addNode()\"></i>\n" +
    "</div>\n" +
    "<ul ng-show=\"treedata.subnodes\">\n" +
    "    <li ng-repeat=\"subnode in treedata.subnodes track by $index\">\n" +
    "        <treeview treedata=\"subnode\" treesettings=\"treesettings\"></treeview>\n" +
    "    </li>\n" +
    "</ul>"
  );

}]);

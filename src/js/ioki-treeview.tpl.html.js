angular.module('ioki.treeview').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/ioki-treeview',
    "<div bindonce\n" +
    "     ng-class=\"{'expanded': treedata.expanded, 'selected': treedata.selected, 'dir': treedata.subnodes}\"\n" +
    "     ng-click=\"$selectNode()\">\n" +
    "\n" +
    "    <!-- expander icon -->\n" +
    "    <i class=\"expander\"\n" +
    "       bo-class=\"settings.iconsBaseClass\"\n" +
    "       ng-click=\"$toggleNode()\"></i>\n" +
    "\n" +
    "    <!-- node icon -->\n" +
    "    <i class=\"node-icon\"\n" +
    "       bo-class=\"settings.iconsBaseClass\"></i>\n" +
    "\n" +
    "    <!-- node label -->\n" +
    "    <span class=\"node-label\" ng-bind=\"treedata.name\"></span>\n" +
    "\n" +
    "    <!-- remove node icon -->\n" +
    "    <i class=\"remove-node\"\n" +
    "       bo-class=\"settings.iconsBaseClass\"\n" +
    "       ng-click=\"$removeNode()\"></i>\n" +
    "\n" +
    "    <!-- add node icon -->\n" +
    "    <i class=\"add-node\"\n" +
    "       bo-class=\"settings.iconsBaseClass\"\n" +
    "       ng-click=\"$addNode()\"></i>\n" +
    "</div>\n" +
    "<ul ng-if=\"treedata.subnodes && treedata.expanded\">\n" +
    "    <li ng-repeat=\"subnode in treedata.subnodes track by $index\">\n" +
    "        <treeview treedata=\"subnode\"></treeview>\n" +
    "    </li>\n" +
    "</ul>"
  );

}]);

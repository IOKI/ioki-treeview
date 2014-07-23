angular.module('ioki.treeview').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/ioki-treeview',
    "<div ng-class=\"{'expanded': treedata.expanded, 'selected': treedata.selected}\"\n" +
    "     ng-click=\"$selectNode()\">\n" +
    "    <!-- expander icon -->\n" +
    "    <i class=\"expander \"></i>\n" +
    "\n" +
    "    <!-- node icon -->\n" +
    "    <i class=\"\"></i>\n" +
    "\n" +
    "    <!-- node label -->\n" +
    "    <span class=\"node-label\">{{ treedata.name }}</span>\n" +
    "\n" +
    "    <!-- remove node icon -->\n" +
    "    <i class=\"remove-node \"></i>\n" +
    "\n" +
    "    <!-- add node icon -->\n" +
    "    <i class=\"add-node \"></i>\n" +
    "</div>\n" +
    "<ul ng-class=\"{'expanded': treedata.expanded}\" ng-if=\"treedata.subnodes\">\n" +
    "    <li ng-repeat=\"subnode in treedata.subnodes track by $index\">\n" +
    "        <treeview treedata=\"subnode\" treesettings=\"treesettings\"></treeview>\n" +
    "    </li>\n" +
    "</ul>"
  );

}]);

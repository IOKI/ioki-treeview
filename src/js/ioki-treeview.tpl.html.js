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

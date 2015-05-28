
/*
 * author: Ben Borchard
 * file: background.js
 * date: May 28, 2015
 */

// constant object needed as arguments for specific chrome methods
var getInfo = {populate:true};
var queryInfo = {active:true};

var orderAttrLists = new Array();

// specify a function in our array so that we can access the orderAttrList by
// providing the windowId
orderAttrLists.getByWinId = function(windowId){
	for(var i=0; i<orderAttrLists.length; i++){
		if (windowId == orderAttrLists[i].windowId){
			return orderAttrLists[i].orderAttrList;
		}
	}
}

// specify a function in our array so that we can remove an orderAttrList by
// providing the windowId
orderAttrLists.removeByWinId = function(windowId){
	var index = -1;
	for(var i=0; i<orderAttrLists.length; i++){
		if (windowId == orderAttrLists[i].windowId){
			index = i;
		}
	}
	if (index != -1){
		orderAttrLists.splice(index, 1);
	}
}

// initialize the orderAttrLists array by looking at all windows and tabs within
chrome.windows.getAll(getInfo, function(windows){
	for(var i=0; i<windows.length; i++){
		orderAttrLists[i] = new Object();
		orderAttrLists[i].windowId = windows[i].id;
		orderAttrLists[i].orderAttrList = new OrderAttrList(windows[i].tabs);
		// reload all tabs so that the connection can be established in each one
		for (var j=0; j<windows[i].tabs.length; j++){
			// do not reload the extensions tab because it will reload the extension
			// and will cause an infinite loop of reloading
			// TODO: see if this is necessary after the extension is packed
			if (windows[i].tabs[j].url.indexOf("chrome://extensions") != 0) {
				chrome.tabs.reload(windows[i].tabs[j].id);
			}
			
		}
	}
	
	chrome.tabs.query(queryInfo, function(tabs){
		for (var i=0; i<tabs.length; i++){
		 	orderAttrLists.getByWinId(tabs[i].windowId).toFront(tabs[i].id);
		}
	});
	
});



/*//////////////////////////////////////////////////////////////////
*
* Listeners that deal with maintaining the proper orders of tabs in the
* various windows according to what was most recently used
*
*///////////////////////////////////////////////////////////////////

chrome.windows.onCreated.addListener(function(window){
	orderAttrLists[orderAttrLists.length] = {windowId: window.id, orderAttrList: new OrderAttrList()};
});

chrome.windows.onRemoved.addListener(function(windowId){
 	orderAttrLists.removeByWinId(windowId);
});

chrome.tabs.onCreated.addListener(function(tab){
	orderAttrLists.getByWinId(tab.windowId).add(tab.index, tab.id);
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
	orderAttrLists.getByWinId(removeInfo.windowId).remove(tabId);
});

chrome.tabs.onAttached.addListener(function(tabId, attachInfo){
	orderAttrLists.getByWinId(attachInfo.newWindowId).toString();
	orderAttrLists.getByWinId(attachInfo.newWindowId).add(attachInfo.newPosition, tabId);
	orderAttrLists.getByWinId(attachInfo.newWindowId).toString();
});

chrome.tabs.onDetached.addListener(function(tabId, detachInfo){
	orderAttrLists.getByWinId(detachInfo.oldWindowId).remove(tabId);
});

chrome.tabs.onMoved.addListener(function(tabId, moveInfo){
	orderAttrLists.getByWinId(moveInfo.windowId).swap(moveInfo.fromIndex, moveInfo.toIndex);
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
	

	chrome.tabs.get(activeInfo.tabId, function(tab){
		orderAttrLists.getByWinId(tab.windowId).toFront(tab.id);
	});
	
});

chrome.tabs.onReplaced.addListener(function(newTabId, oldTabId) {

	chrome.tabs.get(newTabId, function(tab){
		orderAttrLists.getByWinId(tab.windowId).remove(oldTabId);
		orderAttrLists.getByWinId(tab.windowId).add(tab.index, tab.id);
		console.log("new: "+newTabId+", "+tab.id);
	});
});

/*//////////////////////////////////////////////////////////////////
*
* Messaging system so the background page can communicate with the content
* script
*
*///////////////////////////////////////////////////////////////////


chrome.runtime.onConnect.addListener(function(port){
	
	chrome.commands.onCommand.addListener(function(command){
		var indexOffset = 0;
		if (command == "Toggle-Tab-Forward") {
			indexOffset = 1;
		}
		else{
			indexOffset = -1;
		}
		chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, getInfo, function(window) {
			console.log(window.id);
			port.postMessage({orderArray: orderAttrLists.getByWinId(window.id).getArray(),
			   tabArray: window.tabs, indexOffset: indexOffset});

		});
	});
	
	port.onMessage.addListener(function(msg){
		tabIndexArray = new Array();
		tabIndexArray[0] = msg;
		highlightInfo = {windowId: chrome.windows.WINDOW_ID_CURRENT, tabs: tabIndexArray};
		chrome.tabs.highlight(highlightInfo, function(window){
			// No follow-up action required
		});
	});
});
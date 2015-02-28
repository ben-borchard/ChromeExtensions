
/*
 * author: Ben Borchard
 * file: background.js
 * date: January 22, 2014
 */

//constant object needed as arguments for specific chrome methods
var getInfo = {populate:true};
var queryInfo = {active:true};

var orderAttrLists = new Array();

//specify a function in our array so that we can access the orderAttrList by
//providing the windowId
orderAttrLists.getByWinId = function(windowId){
	for(var i=0; i<orderAttrLists.length; i++){
		if (windowId == orderAttrLists[i].windowId){
			return orderAttrLists[i].orderAttrList;
		}
	}
}

//specify a function in our array so that we can remove an orderAttrList by
//providing the windowId
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

//initialize the orderAttrLists array by looking at all windows and tabs within
chrome.windows.getAll(getInfo, function(windows){
	for(var i=0; i<windows.length; i++){
		orderAttrLists[i] = new Object();
		orderAttrLists[i].windowId = windows[i].id;
		orderAttrLists[i].orderAttrList = new OrderAttrList(windows[i].tabs);
		//reload all tabs so that the connection can be established in each one
		for (var j=0; j<windows[i].tabs.length; j++){
			//do not reload the extensions tab because it will reload the extension
			//and will cause an infinite loop of reloading
			//TODO: see if this is necessary after the extension is packed
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
	//console.log("window created");
	orderAttrLists[orderAttrLists.length] = {windowId: window.id, orderAttrList: new OrderAttrList()};
});

chrome.windows.onRemoved.addListener(function(windowId){
	//console.log("window removed");
 	orderAttrLists.removeByWinId(windowId);
});

chrome.tabs.onCreated.addListener(function(tab){
	//console.log("tab created");
	orderAttrLists.getByWinId(tab.windowId).add(tab.index, tab.id);
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
	// console.log("tab removed");
	orderAttrLists.getByWinId(removeInfo.windowId).remove(tabId);
});

chrome.tabs.onAttached.addListener(function(tabId, attachInfo){
	// console.log("tab attached");
	orderAttrLists.getByWinId(attachInfo.newWindowId).add(attachInfo.newPosition, tabId);
});

chrome.tabs.onDetached.addListener(function(tabId, detachInfo){
	// console.log("tab detached");
	orderAttrLists.getByWinId(detachInfo.oldWindowId).remove(tabId);
});

chrome.tabs.onMoved.addListener(function(tabId, moveInfo){
	// console.log("tab moved");
	orderAttrLists.getByWinId(moveInfo.windowId).swap(moveInfo.fromIndex, moveInfo.toIndex);
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
	 // console.log("tab activated");
	orderAttrLists.getByWinId(activeInfo.windowId).toFront(activeInfo.tabId);	
});

/*//////////////////////////////////////////////////////////////////
*
* Messaging system so the background page can communicate with the content
* script
*
*///////////////////////////////////////////////////////////////////


// tab switch engaged
chrome.commands.onCommand.addListener(function(command){
	
	var indexOffset = 0;
	if (command == "Toggle-Tab-Forward") {
		indexOffset = 1;
	}
	else{
		indexOffset = -1;
	}

	console.log("command: "+command);

	// current window
	chrome.windows.get(-2, getInfo, function(window) {
		
		// active tab
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			chrome.tabs.sendMessage(tabs[0].id, {
				orderArray: orderAttrLists.getByWinId(window.id).getArray(),
				tabArray: window.tabs, 
				indexOffset: indexOffset
			});
		});
	});
});
	
// Listen for messages from tabs
chrome.runtime.onMessage.addListener(
	function(msg, sender, sendResponse){
		tabIndexArray = new Array();
		tabIndexArray[0] = msg;
		highlightInfo = {windowId: chrome.windows.WINDOW_ID_CURRENT, tabs: tabIndexArray};
		chrome.tabs.highlight(highlightInfo, function(window){
			//console.log("not sure what to do here");
		});
	}

);
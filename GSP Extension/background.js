/*
 * author: Ben Borchard
 * file: background.js
 * date: January 22, 2014
 */

//go through all the windows
chrome.windows.getAll(getInfo, function(windows){
	for(var i=0; i<windows.length; i++){
        //go through all the tabs
		for (var j=0; j<windows[i].tabs.length; j++){
            //reload any google search tabs so that the extension will take effect
            //immediately
			if (windows[i].tabs[j].url.indexOf("https://www.google.com/search") == 0 ||
			    windows[i].tabs[j].url.indexOf("https://www.google.com/#q=") == 0) {
				chrome.tabs.reload(windows[i].tabs[j].id);
			}
			
		}
	}
});

//listen for connections
chrome.runtime.onConnect.addListener(function(port){
	console.log("connected");
	
    //when a message comes, open a new tab in a current window with a given
    //url using the index of the current tab to determine the index of the 
    //new tab
	port.onMessage.addListener(function(msg){
		var queryInfo  = {active: true, currentWindow: true};
		chrome.tabs.query(queryInfo, function(tabs) {
			var createProperties = {index: tabs[0].index+1, url: msg};
			chrome.tabs.create(createProperties);	
		});
		
	});
});
/*
 * author: Ben Borchard
 * file: content.js
 * date: January 22, 2014
 */

//connection that allows communation with the background script
var port = chrome.runtime.connect();

//the two displays that appear when the user is trying to switch a tab
var tabChooser = null;
var titleDisplay = null;
var imgList = null;

//the index of the icon that is currently selected
var iconBordered = -1;

//the height of the icon which is determined based on the number of tabs
//open in the current window
var iconHeight = -1;

//an array of tab objects that is ordered according to how recently each tab was used
var orderedTabArray = new Array();

//boolean that determines whether the tab has focus in the window
var hasFocus = true;

//a boolean that keeps track of whether the modifier key has been pressed
var modDown = false;

//set listeners so the focus of the tab can be updated
window.onfocus = function() {
	//console.log('focus');
	hasFocus = true;
};

window.onblur = function() {
	//console.log('blur');
	hasFocus = false;
};

//included for testing purposes
port.onDisconnect.addListener(function(message){
	console.log("disconnected");
});

//removes the chooser if it is there and resets all the global variables
//if tabSelected is true, then a message will be sent to the background script
//telling it to activate the selected tab
//if tabSelected is false, no message will be sent
var removeChooser = function(tabSelected){
	if (tabChooser != null){
		document.body.removeChild(tabChooser);
		document.body.removeChild(titleDisplay);
		if (tabSelected) {
			port.postMessage(orderedTabArray[iconBordered].index);
		}
		tabChooser = null;
		titleDisplay = null;
		imgList = null;
		iconBordered = -1;
	}
}

//updates the selected tab by bordering its icon, unbordering the previously selected
//tab's icon, and changing the title displayed to the selected tabs title
var updateBorderAndTitle = function(newIndex){	
	
	var lastIcon = iconBordered;

	iconBordered = typeof newIndex == "number" ? newIndex : newIndex.data.newIndex;
	iconBordered = iconBordered == orderedTabArray.length ? 0 : iconBordered;
	iconBordered = iconBordered == -1 ? orderedTabArray.length-1 : iconBordered;
			
	// use the index to update the title
	var title = orderedTabArray[iconBordered].title;

	$($('.mruext-chooser').children()[iconBordered]).addClass('mruext-image-border');
	if (lastIcon != -1){
		$($('.mruext-chooser').children()[lastIcon]).removeClass('mruext-image-border');
	}
	
	$('.mruext-title').html(title);
}

//listen for messages from the background script (it only sends a message
//when the user wants to toggle the tab forward or backward)
port.onMessage.addListener(function(msg){

	//the the tab isn't in focus, this function should do nothing
	if (!modDown) {
		return;
	}
	if (!hasFocus) {
		return;
	}
	
	//if the tabChooser isn't there, create it and put in in the document body
	if (tabChooser == null){
		
		//determine various aspects of the style based on the number of
		//tabs in the window and the size of the window
		var tabNum = msg.tabArray.length;
		var width = Math.min(70, tabNum*10).toString() + "%";
		var left = Math.max(15, (100-tabNum*10)/2) + "%";
		iconHeight = ((100/(Math.ceil(tabNum/7)+1))-10).toString() + "%";
		
		/////////////////////////////////////////////////////////////
		// create the two displays and set their styles appropriately
		/////////////////////////////////////////////////////////////
		
		// create the div to hold the images for the tabs
		//tabChooser = document.createElement("div");

		tabChooserContainer = $('<div></div>').addClass("mruext-container");
		tabChooser = $('<div></div>').addClass("mruext-chooser");
		titleDisplay = $('<div></div>').addClass("mruext-title");
		
		//make a new array of tabs that is in ordered by how recently they
		//were focused
		orderedTabArray = new Array();
		//console.log(msg.orderArray);
		for(var i=0; i<msg.tabArray.length; i++){
			//console.log(i);
			orderedTabArray[msg.orderArray[i].mruValue] = msg.tabArray[i];
		} 
		
		//create the image using the favIconUrl property of the tabs in the
		//orderedTabArray, style the image appropriately, and add it to the
		//tabChooser div
		for(var i=0; i<orderedTabArray.length; i++){

			var image = document.createElement("img");

			if (orderedTabArray[i].url.indexOf("chrome://") != 0){
				$(image).attr("src", orderedTabArray[i].favIconUrl);
			}
			//TODO: Figure out why the code below is breaking the extension...
			//else if (orderedTabArray[i].url.equals("")){
			//	image.setAttribute("src", chrome.extenstion.getURL("newTab.png"));
			//}
			else{
				//image.setAttribute("src", chrome.extension.getURL("chrome.png"));
			}

			$(image).mouseover({newIndex : i}, updateBorderAndTitle);
			$(image).mousedown({tabSelected : true}, removeChooser);
			$(image).addClass('mruext-image');

			$(tabChooser).append(image);
			$(tabChooserContainer).append(titleDisplay);
			$(tabChooserContainer).append(tabChooser);
		}

		$(document.body).prepend(tabChooserContainer);
		
		//set the initial icon to bordered be the first in the list
		iconBordered = 0;
		
		//update the selected tab appropriately
		updateBorderAndTitle(msg.indexOffset+iconBordered);
	}
	//if the tabChooser is already on screen, the user is just trying to navigate
	//to the proper tab
	else{
		//update the selected tab appropriately
		updateBorderAndTitle(msg.indexOffset+iconBordered);
	}
});

//listen for keyup events
$(document).keyup(function (event){
	//determine if one of the appropriate modifier keys is causing the event
	//(ctrl for pc and linux and command for mac)
	var key = new Array();
	if (navigator.appVersion.indexOf("Mac") != -1){
		key[0] = 91;
		key[1] = 93;
	}
	else{
		key[0] = 17;
	}
	if (key.indexOf(event.which) != -1){
		//remove the chooser when the appropriate modifier comes up
		modDown = false;
		removeChooser(true);
	}
});

//listen for keydown events
$(document).keydown(function (event){
	//modifier key
	var key = new Array();
	if (navigator.appVersion.indexOf("Mac") != -1){
		key[0] = 91;
		key[1] = 93;
	}
	else{
		key[0] = 17;
	}
	if (key.indexOf(event.which) != -1){
		modDown = true;
	}
	
	//escape key
	if (event.which == 27) {
		if (tabChooser != null) {
			removeChooser(false);
		}
	}
	//right arrow
	if (event.which == 39) {
		if (tabChooser != null) {
			updateBorderAndTitle("Toggle-Tab-Forward");
		}
	}
	//left arrow
	if (event.which == 37) {
		if (tabChooser != null) {
			updateBorderAndTitle("Toggle-Tab-Backward");
		}
	}
	//enter
	if (event.which == 13) {
		if (tabChooser != null) {
			removeChooser(true);
		}
	}

});

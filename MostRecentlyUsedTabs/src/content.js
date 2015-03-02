/*
 * author: Ben Borchard
 * file: content.js
 * date: January 22, 2014
 */

//the two displays that appear when the user is trying to switch a tab
var tabChooser = null;
var titleDisplay = null;
var imgList = null;

//the index of the icon that is currently selected
var iconBordered = -1;

//an array of tab objects that is ordered according to how recently each tab was used
var orderedTabArray = new Array();

//boolean that determines whether the tab has focus in the window
var hasFocus = true;

//a boolean that keeps track of whether the modifier key has been pressed
var modDown = false;

// removes the chooser if it is there and resets all the global variables
// if tabSelected is true, then a message will be sent to the background script
// telling it to activate the selected tab
// if tabSelected is false, no message will be sent
var removeChooser = function(tabSelected){
	if (tabChooser != null){
		$(tabChooserContainer).remove();
		$(titleDisplay).remove();
		if (tabSelected) {
			chrome.runtime.sendMessage(orderedTabArray[iconBordered].index);
		}
		tabChooser = null;
		titleDisplay = null;
		titleChooserContainer = null;
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

	$('.mruext-title span').html(title);

	var left = ((window.innerWidth - $('.mruext-title').outerWidth())/2).toString()+"px";
	$('.mruext-title').css("left", left);
	
}
function createChooser(msg){

	tabChooserContainer = $('<div></div>').addClass("mruext-container");
	tabChooser = $('<div></div>').addClass("mruext-chooser");
	title = $('<span></span>');
	titleDisplay = $('<div></div>').addClass("mruext-title").append(title);
	
	// make a new array of tabs ordered by how recently they
	// were focused
	orderedTabArray = new Array();
	console.log(msg.tabArray.length);
	console.log(msg.orderArray.length);
	for(var i=0; i<msg.tabArray.length; i++){
		orderedTabArray[msg.orderArray[i].mruValue] = msg.tabArray[i];
	} 
	
	// create the image using the favIconUrl property of the tabs in the
	// orderedTabArray, style the image appropriately, and add it to the
	// tabChooser div
	for(var i=0; i<orderedTabArray.length; i++){

		var image =$('<img></img>');

		// Set image

		// New Tab
		if (orderedTabArray[i].url.indexOf("chrome://newtab/") == 0)
			$(image).attr("src", chrome.extension.getURL("images/newTab.PNG"));
		// Chrome configuration tab
		else if (orderedTabArray[i].url.indexOf("chrome://") == 0)
			$(image).attr("src", chrome.extension.getURL("images/chrome.png"));
		// Default for sites with no favicon
		else if (typeof(orderedTabArray[i].favIconUrl) === 'undefined')
			$(image).attr("src", chrome.extension.getURL("images/defaultIcon.png"));
		// Favicon of site
		else 
			$(image).attr("src", orderedTabArray[i].favIconUrl);

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

var tabtoggle = function(msg, sender, sendRespose){

	//the the tab isn't in focus, this function should do nothing
	if (!modDown) {
		return;
	}
	
	//if the tabChooser isn't there, create it and put in in the document body
	if (tabChooser == null){
		createChooser(msg)
	}
	//if the tabChooser is already on screen, the user is just trying to navigate
	//to the proper tab
	else{
		//update the selected tab appropriately
		updateBorderAndTitle(msg.indexOffset+iconBordered);
	}
}

//listen for messages from the background script (it only sends a message
//when the user wants to toggle the tab forward or backward)
chrome.runtime.onMessage.addListener(tabtoggle);


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
		console.log('mod up');
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
			event.preventDefault();
			event.stopPropagation();
			removeChooser(false);
		}
	}
	//right arrow
	if (event.which == 39) {
		if (tabChooser != null) {
			event.preventDefault();
			event.stopPropagation();
			updateBorderAndTitle(iconBordered+1);
		}
	}
	//left arrow
	if (event.which == 37) {
		if (tabChooser != null) {
			event.preventDefault();
			event.stopPropagation();
			updateBorderAndTitle(iconBordered-1);
		}
	}
	//enter
	if (event.which == 13) {
		if (tabChooser != null) {
			event.preventDefault();
			event.stopPropagation();
			removeChooser(true);
		}
	}

});

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
	
	/////////////////////////////////////
	//update the index appropriately
	///////////////////////////////////
	
	
	var lastIcon = iconBordered;
	//if called directly in the code
	if (typeof newIndex == "number") {
		iconBordered = newIndex;
	}
	//if called as the event handler of an event
	else{
		iconBordered = newIndex.data.newIndex;
	}
	
	//make sure that the indices wrap around so that there is no index out of bounds
	//issue
	if (iconBordered == orderedTabArray.length){
		iconBordered = 0;
	}
	if (iconBordered == -1){
		iconBordered = orderedTabArray.length-1;
	}
	
	//////////////////////////////////////
	// update border and title
	/////////////////////////////////////
		
	// use the index to update the title
	var title = orderedTabArray[iconBordered].title;
	
	// update the border of the icon 
	document.body.children[0]. // div
		children[0].  // ul
		children[iconBordered]. //li
		//children[0].  // img
		setAttribute("style", 
	   "height:"+iconHeight+";background-color:rbga(0,0,0,0.75);padding:1% 2%;"+
	   "border:2px solid #000000;border-radius:25px;");
	// and unborder the last icon
	if (lastIcon != -1){
		document.body.children[0]. // div
		children[0].  // ul
		children[iconBordered]. //li
		//children[0].  // img
		setAttribute("style", 
		   "height:"+iconHeight+";background-color:rbga(0,0,0,0);padding:1% 2%;");		       
	}
	
	//update the titleDisplay by removing the paragraph previously in it and adding
	//a new one with the appropriate title
	if (document.body.children[1].children.length != 0) {
		document.body.children[1].removeChild(document.body.children[1].firstChild);
	}
	var urlParagraph = document.createElement("p");
	urlParagraph.appendChild(document.createTextNode(title));
	document.body.children[1].appendChild(urlParagraph);
	var left = ((window.innerWidth - document.body.children[1].offsetWidth)/2).toString()+"px";
	document.body.children[1].setAttribute("style",
	   "position:fixed;top:30%;height:5%;color:#ffffff;text-align:center;"+
	   "background-color:rgba(0,0,0,.75);border:2px solid #000000;"+
	   "border-radius:25px;left:"+left+";z-index:100000000;");       
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
		tabChooser = document.createElement("div");
		tabChooser.setAttribute("style", 
		   "position:fixed;top:35%;left:"+left+";width:"+width+";height:15%;"+
		   "background-color:rgba(0,0,0,.5);border:2px solid #000000;"+
		   "border-radius:25px;z-index:10000000;");
		// create ordered list to hold the images
		imgList = document.createElement("ul");
		imgList.setAttribute("style", "list-style-type:none;");
		tabChooser.appendChild(imgList);
		
		titleDisplay = document.createElement("div");
		titleDisplay.setAttribute("style", 
		   "position:fixed;top:30%;height:4%;color:#ffffff;text-align:center;"+
		   "background-color:rgba(0,0,0,.75);border:2px solid #000000;"+
		   "border-radius:25px;z-index:100000000;");
		
		
		//make a new array of tabs that is in ordered by how recently they
		//were focused
		orderedTabArray = new Array();
		console.log(msg.orderArray);
		for(var i=0; i<msg.tabArray.length; i++){
			console.log(i);
			orderedTabArray[msg.orderArray[i].mruValue] = msg.tabArray[i];
		} 
		
		//create the image using the favIconUrl property of the tabs in the
		//orderedTabArray, style the image appropriately, and add it to the
		//tabChooser div
		for(var i=0; i<orderedTabArray.length; i++){
			var image = document.createElement("img");
			var listItem = document.createElement("li");
			listItem.setAttribute("style", "display:inline;")
			//console.log(orderedTabArray);
			//console.log(i);
			if (orderedTabArray[i].url.indexOf("chrome://") != 0){
				image.setAttribute("src", orderedTabArray[i].favIconUrl);
			}
			//TODO: Figure out why the code below is breaking the extension...
			//else if (orderedTabArray[i].url.equals("")){
			//	image.setAttribute("src", chrome.extenstion.getURL("newTab.png"));
			//}
			else{
				image.setAttribute("src", chrome.extension.getURL("chrome.png"));
			}
			//image.setAttribute("onmouseover", "updateBorderAndTitle("+i+")");
			//image.setAttribute("onmousdown", "removeChooser(true)");
			$(image).mouseover({newIndex : i}, updateBorderAndTitle);
			$(image).mousedown({tabSelected : true}, removeChooser);
			listItem.setAttribute("style", 
		           "height:"+iconHeight+";background-color:rbga(0,0,0,0);"+
			   "padding:1% 2%;");
			listItem.appendChild(image)
			imgList.appendChild(listItem);
		}
		
		//insert the two displays into the body of the document
		document.body.insertBefore(titleDisplay, document.body.firstChild);
		document.body.insertBefore(tabChooser, document.body.firstChild);
		
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
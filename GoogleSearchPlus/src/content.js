/*
 * author: Ben Borchard
 * file: content.js
 * date: January 22, 2014
 */

//get all the dom elements that hold the links (different for images 
//and web searches
var searchResultLinks = document.getElementsByClassName("r");
var searchResultImages = document.getElementsByClassName("rg_di");

//index of link currently bordered
var index = -1;

//iFrame object that shows a preview of the current tab
var previewIframe = null;

//port object that connects the content script to the background script
var port = chrome.runtime.connect();

//event handler for the keydown event
var onKeydown = function (event){
    //only take note if we are in a google search page
    if (document.URL.indexOf("https://www.google.com/search") == 0 ||
          document.URL.indexOf("https://www.google.com/#q=") == 0) {
        
        console.log(event.which);
        
        //initialize array of containing divs
        var divArray = new Array();
        
        //assign the proper value to the divArray depending on whether
        //we are in a google image search or google web search
        if (searchResultImages.length == 0) {
            divArray = searchResultLinks;
        }
        else{
            divArray = searchResultImages;
        }
        
        //enter key (open currently bordered link in current tab)
        if (event.which == 13 && index != -1) {
            window.location = divArray[index].firstChild.href;
        }
        
        //esc key (exit the link choosing process)
        if (event.which == 27 && index != -1) {
            window.scrollTo(0,0);
            divArray[index].firstChild.setAttribute("style", "");
            index = -1;
        }
        
        //left arrow key (preview the currently bordered link in an iFrame)
        if (event.which == 37 && index != -1) {
            previewIframe = document.createElement('iframe');
            previewIframe.setAttribute('style', 'position:fixed;top:10%;left:10%;height:30%;width:80%;z-index:100000000;');
            previewIframe.setAttribute('src', divArray[index].firstChild.href);
            document.body.insertBefore(previewIframe, document.body.firstChild);
            
        }
        
        //right arrow key
        if (event.which == 39 && index != -1) {
            //get rid of the iFrame if it is there
            if (previewIframe != null) {
                document.body.removeChild(document.body.firstChild);
                previewIframe = null;
            }
            //else open the currently bordered link in a new tab
            //by posting a message to the background script
            else{
                port.postMessage(divArray[index].firstChild.href);    
            }
            
        }
        
        //keep track of the old index
        var oldIndex = index;
        
        //down arrow key (move index up)
        if (event.which == 40) {
            index++;
            if (index == divArray.length) {
                index = 0;
            }
        }
        //up arrow key (move index down)
        if (event.which == 38) {
            index--;
            if (index == -1) {
                index = divArray.length-1;
            }
        }
        
        //update the bordered link using the changed index and unborder
        //the old link
        if (index != -1) {
            if (oldIndex != -1) {
                divArray[oldIndex].firstChild.setAttribute("style", "");
            }
            divArray[index].firstChild.setAttribute("style", "border:2px solid #ff0000;border-radius:25px;");
                        
            window.scrollTo(0, ($(divArray[index].firstChild).offset().top -
                                 (window.innerHeight/2)) + offset);
            
            //do not let any  other event handler deal with this
            //event
            event.stopPropagation();
            
        }
        
    }
}

//add the listener to the document
document.addEventListener("keydown", onKeydown, true);
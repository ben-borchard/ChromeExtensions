/*
 * author: Ben Borchard
 * file: orderAttrList.js
 * date: January 22, 2014
 */
 


//a list that keeps an order of its contents with an mru value
function OrderAttrList(tabs){

	//array that holds the contents of the list
	var array = new Array();
	
	//initialize the array if there is an input value
	if (tabs != undefined){
		for (var i=0; i<tabs.length; i++){
			array[i] = {mruValue: i, tabId: tabs[i].id};
		}
	}
	
	//increments mru value of any object with an mru value less than the
	//parameter
	function incrementAllBelow(number){
		for (var i=0; i<array.length; i++){
			if (array[i].mruValue < number){
				array[i].mruValue = array[i].mruValue+1;
			}
		}
	}
	
	//decrements mru value of any object with an mru value less than the
	//parameter
	function decrementAllAbove(number){
		for (var i=0; i<array.length; i++){
			if (array[i].mruValue > number){
				array[i].mruValue = array[i].mruValue-1;
			}
		}
	}
	
	//returns the index of an object within the list given a certain
	//tabId
	function getIndexWithTabId(tabId){
		for(var i=0; i<array.length; i++){
			if (tabId == array[i].tabId){
				return i;
			}
		}
		return -1;
	}
	
	//returns the actual array object that stores the objects in the list
	this.getArray = function(){
		return array;
	}
	
	//adds an object to the array and adjusts the mru values appropriately
	//(gives the added object an mruValue of 0)
	this.add = function(index, tabId){
		for(var i=array.length-1; i>index; i--){
			array[i] = array[i+1]
		}
		array[index] = new Object();
		array[index].mruValue = -1;
		array[index].tabId = tabId;
		incrementAllBelow(array.length);
	}

	//removes an object from the array using the tabId and adjusts the mru
	//values of the objects left in the array
	this.remove = function(tabId){
		var index = getIndexWithTabId(tabId);
		var value = array[index].mruValue;
		array.splice(index, 1);
		decrementAllAbove(value);
	}
	
	//swaps two elements in the array
	this.swap = function(index1, index2){
		var temp = array[index1];
		array[index1] = array[index2];
		array[index2] = temp;
		
	}
        
	//brings a certain object based on the tabId to the front of the mruValue
	//spectrum (makes the mruValue of the object 0 and adjusts the other mruValues
	//appropriately
	this.toFront = function(tabId){
		var index = getIndexWithTabId(tabId);
		var value = array[index].mruValue;
		array[index].mruValue = -1;
		incrementAllBelow(value);
	}
	
	//gives a string representation of the list
	this.toString = function(){
		var logString = "[";
		for(var i=0; i<array.length-1; i++){
			logString = logString + array[i] + ", ";
		}
		logString = array[array.length-1] + "]";
		console.log(logString);
		return logString;
	}
}
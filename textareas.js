/*
 * TextAreas.js
 *
 * This "content" script finds TextArea's in the DOM and tags them
 * with a unique ID and edit button. When the button is
 * clicked it communicates with the master extension page to send an
 * edit request.
 *
 */
 
var editImgURL = chrome.extension.getURL("gumdrop.png");
var port = chrome.extension.connect();

console.log("textareas.js: port is "+port);

/*
 updateTextArea

 Called when we want to update the text area with our updated text
*/
function updateTextArea(id, content) {
    var texts = document.getElementsByTagName('textarea');
    for (var i=0; i<texts.length; i++) {
	var text = texts[i];

	var text_edit_id = text.getAttribute("edit_id");

	if (text_edit_id == id)
	{
	    text.value = content;
	}
    }
}

/*
  Find the current active text area and spawn an edit for it
*/
function findActiveTextArea() {
    var texts = document.getElementsByTagName('textarea');
    // For now hardwire
    var text = texts[0];

    // And spawn the request
    var text_edit_id = text.getAttribute("edit_id");
    var edit_msg = {
	msg: "edit",
	text: text.value,
	id: text_edit_id
    };

    console.log("  findActiveTextArea:"+JSON.stringify(edit_msg));
    port.postMessage(edit_msg);
}

/* Message handling multiplexer */
function textareas_message_handler(msg, port) {
    console.log("textareas_message_handler: "+JSON.stringify(msg));

    // What was the bidding?
    var cmd = msg.msg;
    if (cmd == "find_edit") {
	console.log("find_edit: request");
    } else if (cmd == "update") {
	var id = msg.id;
	var content = msg.text;
	updateTextArea(id, content);
    } else {
	console.log("textareas_message_handler: un-handled message:"+cmd);
    }
}

port.onMessage.addListener(textareas_message_handler);

/*
 editTextArea

 Called when the edit button on a page is clicked, once done
 it finds the appropriate text area, extracts it's text and
 fires a message to the main extension to trigger the editing
*/
 
function editTextArea(event) {
    var img = event.currentTarget;
    var edit_id = img.getAttribute("edit_id");
    console.log("editTextArea:"+edit_id);

    var texts = document.getElementsByTagName('textarea');

    for (var i=0; i<texts.length; i++) {
	var text = texts[i];

	var text_edit_id = text.getAttribute("edit_id");

	if (text_edit_id == edit_id)
	{
	    var edit_msg = {
		msg: "edit",
		text: text.value,
		id: edit_id
	    };
	    
	    console.log("  edit_msg:"+JSON.stringify(edit_msg));
	    port.postMessage(edit_msg);
	}
    }
}

function findTextAreas() {

    console.log("Finding text area (Pure HTML Version)");
	   
    var texts = document.getElementsByTagName('textarea');

    for (var i=0; i<texts.length; i++) {
	var text = texts[i];

	// We don't want to tag all text boxen, especially if they are hidden
	var display = text.style.getPropertyCSSValue('display');
	if (display && display.cssText=="none")
	{
	    continue;
	}

	// Set attribute of text box so we can find it
	var edit_id = "eta_"+i;
	text.setAttribute("edit_id", edit_id);

	// Add a clickable edit img to trigger edit events
	var image = document.createElement('img');
	image.setAttribute("edit_id", edit_id);
	image.src = editImgURL;
	text.parentNode.insertBefore(image, text.nextSibling);
	image.addEventListener('click', editTextArea, false);
    }
}


// Called when content script loaded
findTextAreas();

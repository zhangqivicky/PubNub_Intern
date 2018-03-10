$(document).ready(function(){
	// define a group of channels user can subscribe. they should be created by admin (not implemented in this demo)
	var channelNames = ["General", "Tech Team", "HR Team", "Ad Team", "Operation"];
	var channelIds = ["csloc_general", "csloc_tech", "csloc_hr", "csloc_ad", "csloc_op"];
	
	// define a group of global variables
	var curUsername = '';
	var curChannel = '';  
    var subscrlist = [];
    
    // initialize pubnub instance for api access
    var pubnub = new PubNub({
        publishKey : 'demo',
        subscribeKey : 'demo',
        ssl: true
    }); 
    
    // add listeners to the pubnub obj, here I only handle message. 
    pubnub.addListener({
        message: function(m) {
            // handle message
            if(!curUsername) return; // if not join the team, do nothing
            var channelName = m.channel; // The channel for which the message belongs
            var channelGroup = m.subscription; // The channel group or wildcard subscription match (if exists)
            var pubTT = m.timetoken; // Publish timetoken
            var msg = m.message; // The Payload
            var publisher = m.publisher; // The Subscription
            // Here we adopt the strategy if pushed message is from current channel, just append it to the end.
            // if it is not from current channel, reminder user by adding a red bullet to related channel. 
            if(channelName == curChannel){ 
            	$('ul#messages').append(getMsgItem(pubTT, msg));
            	$('ul#messages').scrollTop($('ul#messages')[0].scrollHeight); // scroll to the bottom to show new message
            }else{
				var id = subscrlist.indexOf(channelName);
				var item = $('a#'+channelName+' li');
				if( id >= 0 ){
					item.find("img").remove();
					item.append('<img src="remind.png">');
				}
            }
        }
    });  

    // here handle the behavior of user join
	$( "#join .btn").click(function() {
        var username = $("input[name=username]").val().trim();
        if(username.length == 0){ // no input
        	return;
         }
        if(username.length < 5 || username.length > 20){ // input is too short or long
        	$( "#join p.alert").html("The length should be between 5 and 20!");
			return;	
         }
        curUsername = username;
        $("span#username").html(curUsername);
        $('#join').hide(); // hide login box
        $('#content').show(); // show chatting ui
        
        // get the list of subscribed channels, in this demo, "general" channel is pre-subscribed.
        subscrlist = $("#channels input:checkbox:checked").map(function(){
            var channel = $(this).val();     
            return channel;
          }).get();
        
        // subscribe these channels to pubnub and list them in sidebar
        if( subscrlist.length > 0 ){  
        	pubnub.subscribe({
           		channels: subscrlist,
            	withPresence: true 
        	});
    		loadSidebar(subscrlist);  	 
        }  	
	}); 

	// below handle various interface behaviors
	// first handle the action of subscribe/unsubscribe to channels
    $("#channels input:checkbox").click(function(){
    	var channel = $(this).val();
    	var subscrone = [];
    	subscrone.push(channel);
    	if($(this).is(':checked')){  
    		pubnub.subscribe({
       			channels: subscrone,
        		withPresence: true 
    		});   		
    		$('ul#subscribed').append(getSubscrItem(channel));
    		setTimeout(function(){ subscrlist.push(channel); }, 500);
    	}else{
    		pubnub.unsubscribe({
    		    channels: subscrone
    		});
    		subscrlist.splice(subscrlist.indexOf(channel), 1);
    		$('#subscribed a#'+channel).remove();
        }
   	});     
 	// handle messge submission
	$("#msg-submit").click(function(){
        var message = $("input[name=message]").val().trim();
        if(message.length == 0){  // if message is empty
        	return;
        }
        if(curChannel.length == 0){ // if no channel is selected in publishing message
        	$('ul#messages').html("<p>Please select the channel you would send to!</p>");
        	return;
        }
        // build message by combing username with input
		message =  curUsername + ": " + message;
       
		// start to publish now
        var publishConfig = {
            channel : curChannel,
            message : message
        }
        pubnub.publish(publishConfig, function(status, response) {
            console.log(status, response);
        })		
    });

	// handle the change of current channel
	 $('#subscribed').on('click', 'a.channel', function() {
	 	curChannel = $(this).attr("id");
	 	$("a.channel").removeClass("current");
	 	$("#msg-input").val('');
	 	$(this).addClass("current");
	 	$(this).find("img").remove();

	 	// when current channel is changed, load historical message. 
	 	// this part should be optimized to load the data based on time. 
	 	// e.g. for new user, they should not see old messages published before they join.  
	    // in this demo, whether the user is new has not been examined.
	 	pubnub.history(
	    	    {
	    	        channel: curChannel,
	    	        reverse: false, // Setting to true will traverse the time line in reverse starting with the oldest message first.
	    	        count: 50, // how many items to fetch
	    	        stringifiedTimeToken: false // false is the default
	    	    },
	    	    function (status, response) {
	    	        // handle status, response
	    	        console.log(status, response);
	    	        if(!response.error){
		    	    var msglist = '';    
	    	        for (i=0; i<response.messages.length; i++) {
		    	        	msg = response.messages[i];
	    	        		msglist += getMsgItem(msg.timetoken, msg.entry);	    	        	
	    	    	}
	    	        $('ul#messages').html(msglist);
	    	        $('ul#messages').scrollTop($('ul#messages')[0].scrollHeight);
	    	    	}
	    	    }
	    );
	});
	 
	 // Load the content in left sidebar
	 function loadSidebar(subscrlist){
			var list  = '';
			for(i=0; i<subscrlist.length; i++){
				list += getSubscrItem( subscrlist[i] );
			}
			//alert(list);
			$('ul#subscribed').html(list);
	 } 

	// Build the row of subscribed channels shown in left sidebar
    function getSubscrItem(channelId){
	        var item = '<a href="#" id="'+channelId+'" class="channel">';
	        var index = channelIds.indexOf(channelId);
	     	item += '<li class="list-group-item"># '+ channelNames[index] + '</li></a>';
	    	return item;
	    }
	    
	 // Build the row of time and message shown in mqin column
    function getMsgItem(time, message){
    	var d = new Date(Math.round(time/1000)); 
    	date = d.toString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1"); 	
        var item = '<li class="list-group-item">';
    	item += '<span class="time">' + date + '</span>';
    	item += '<span class="message">' + message + '</span></li>';
    	return item;
    }
	
});    
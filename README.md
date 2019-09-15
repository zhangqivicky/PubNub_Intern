# Slack-like Instant Chat Application

## Implementation

### Step 1) Design the UI

The idea of this web application is to simulate company’s working environment. In a typical company, there are different departments such as tech, human resources, operation et al. In most cases, the employees are only concerned about the messages related to them. In this design,I have initialised a channel for each department and users can subscribe to one or multiple channels based on their roles in the company and send/receive messages accordingly. After defining this as core function in the application, I have developed a simple UI based on bootstrap library. It includes two parts: a login box and a chat window. At the top of chat window, users can check the checkboxes to subscribe to different channels. The sidebar of chat window list users’ subscribed channels. The main column of chat window show message stream in current channel and a message publish box.
For demo purpose, the homepage initially shows a login box in the middle. After users input username and click “join the team”, the login box will be hidden and a chat window will be presented.

### Step 2) Use PubNub API

PubNub has provided a group of powerful and easy-to-use APIs to build online chat applications. Due to a limited time to develop demo, I only use message API. If you need more details about the other APIs , you can access them here: https://www.pubnub.com/docs/web-javascript/pubnub-javascript-sdk.

First, I add a js file to load pubnub sdk in the header of my page based on instruction in the link above.

```
<script src=”https://cdn.pubnub.com/sdk/javascript/pubnub.4.20.2.js"></script>
```
Then, I initialise pubnub obj for API access. For easy test, I have use ‘demo’ as publishKey and subscribeKey, as shown below.

```
var pubnub = new PubNub({ publishKey : ‘demo’, subscribeKey : ‘demo’});
```
Next step is to add listener on receiving messages. Here I have considered two different scenarios. If the users receive new message bound to the channel they are viewing, i.e. “current channel”. What we just need do is to append the message to the end of message list in chat window. However, if new message is not bound to current channel, users can not notice the delivery when they work on current channel, so we need figure out an easy way to alert users in this situation. In this demo, I have adopted the solution which adds a red bullet to the name of channel with new messages. If users saw the alert and click on channel name, they will be switched to this channel and see the messages and then the red bullet will disappear. For the details of this feature, you can check my codes.

```
pubnub.addListener({message: function(m) { // add codes here }});
```
In addition, when switching to a different channel from current one, we need load historical messages in new channel. In my configuration, the API request should return the most recent 50 messages in new channel.

```
pubnub.history({channel: curChannel, reverse: false, count: 50, stringifiedTimeToken: false }, function (status, response) { // add codes here });
```
In practical application, published time should be considered when retrieving the data. e.g. for new users, ideally they should not see old messages which were published before they join the team for the first time. In this version, I just retrieved the message data based on its maximum number. When user authentication is added in in my future version, I can easily check whether this user is new based on login history and then add the check of whether to show old messages.
In addition, there are another two interface actions which need API access. The first one is concerned about subscribing to or unsubscribing from a channel. In this demo, users are permitted to change their subscriptions any time. Each change will need send an API request by the function below.

```
pubnub.subscribe({ channels: subscrlist, withPresence: true});
pubnub.unsubscribe({ channels: subscrlist });
```
The second is about publishing a new message. In order to avoid the impact of connection error, I have added a check on publish status. Only when the client receive response which shows that the publishing is successful, the message will be appended to the end of message list in current chat window.

```
pubnub.publish(publishConfig, function(status, response) {
            if(!response.error){ //codes to append the message };
        })
```
### Step 3) Write jQuery and CSS

In this step, I have used jQuery to handle various logics related to clicks on the interface. In order to resolve some display issues from bootstrap, I have created a custom css file to overwrite bootstrap’s format. The presentation of this demo page in mobile has not been fully test due to time limitation. For testing purpose, I would recommend to check the demo site in desktop.

## Conclusion

The demo is just for a quick test and there are many aspects which should be improved in order to work exactly like slack. Some of remaining coding parts are related to the users and their status. They include the presentation of active users when switching to a channel and the feature of 1-on-1 chat between active users et al.

## Demo

* Video Demo in Youtube about how to use the system:

https://www.youtube.com/watch?v=OakieBxkRdk


* Medium Post abuot project introduction:

https://medium.com/@zhangqiqi0912/slack-like-chat-app-b5d4f6d1acf9





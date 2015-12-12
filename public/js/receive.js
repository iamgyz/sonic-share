var peer = new Peer({
    host: 'localhost',
    port: 7788,
    path: '/api',
    config: {'iceServers': [
        { url: 'stun:stun.l.google.com:19302' },
        { url: 'stun:stun1.l.google.com:19302' },
        { url: 'stun:stun2.l.google.com:19302' },
        { url: 'stun:stun3.l.google.com:19302' },
        { url: 'stun:stun4.l.google.com:19302' },
        { url: 'stun:stunserver.org'},
        { url: 'stun:stun.softjoys.com'},
        { url: 'stun:stun.voiparound.com'},
        { url: 'stun:stun.voipbuster.com'},
        { url: 'stun:stun.voipstunt.com'},
        { url: 'stun:stun.voxgratia.org'},
        { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' }
  ]}
});
var connectedPeers = {};
// Show this peer's ID.
peer.on('open', function(id){
   $('#progress').html("Initializing....");
});
// Await connections from others
peer.on('connection', connect);
peer.on('error', function(err) {
  console.log(err);
  $('#progress').html("Fail!<br>"+err);
})

var file = null;
var dataBuffer = null;
var fileSize,fileName,fileType;
// Handle a connection object.
function connect(c) {
  // Handle a chat connection.
  console.log(c);
  if (c.label === 'chat') {
    //send ask 
    var msg = "0:ask";
    c.send(msg);
    console.log("send "+msg);
    c.on('data', function(data) {
      tmp = data.split(':');
      //1=> get file infomation
      //5=> error
      if(tmp[0]=='1'){
          fileName = tmp[1];
          fileSize = parseInt(tmp[2]);
          fileType = tmp[3];
          console.log("GET=>",tmp);          
          //將dataBuffer清空
          dataBuffer = null;
          var userConfirm = confirm("是否接收"+fileName+"("+fileSize+" Bytes)?");
          //如果user 同意
          if(userConfirm){
            var msg="2:ok";
            c.send(msg);
            console.log("send "+msg);
          }
          else{
            console.log("Destroy peer");
            peer.destroy();
            $('#progress').html("You choose not to receive :(");
          }
      }//if
      else if(tmp[0]=='5'){
          $('#progress').html("Error: "+tmp[1]);
          peer.destroy();
      }
    });//on data

    c.on('close', function() {
      console.log(c.peer + ' has left the chat.');
      delete connectedPeers[c.peer];
    });
  } else if (c.label === 'file') {
    c.on('data', function(data) {
        //檢查是否是arrayBuffer
        if (data.constructor === ArrayBuffer) {
          //如果是第一個chunk，那直接assign給dataBuffer
          if(dataBuffer==null){
              dataBuffer = data;
          }
          //如果是第二個chunk之後，進行concat
          else{
              console.log("Progress: "+dataBuffer.byteLength+"/"+fileSize);
              $('#progress').html("Progress: "+100* dataBuffer.byteLength/fileSize+"%");
              eachActiveConnection(function(c, $c) {
                if (c.label === 'chat') {
                  c.send("3:"+100* dataBuffer.byteLength/fileSize);
                }
              });
              /*
              * 以下是arrayBuffer concat 的演算法
              */
              var tmp = new Uint8Array(dataBuffer.byteLength+data.byteLength);
              tmp.set(new Uint8Array(dataBuffer),0);
              tmp.set(new Uint8Array(data),dataBuffer.byteLength);
              dataBuffer = tmp.buffer;
          }//else
          /*
          * 檢查是否全部接收完成，若是完成 跳出下載
          */
          if(dataBuffer.byteLength==fileSize){
              $('#progress').html("Progress: 100%");
              eachActiveConnection(function(c, $c) {
                if (c.label === 'chat') {
                  c.send("3:100");
                }
              }); 
              var dataView = new Uint8Array(dataBuffer);
              var dataBlob = new Blob([dataView],{ type: fileType });
              var url = window.URL.createObjectURL(dataBlob);
              var a = document.createElement("a");
              document.body.appendChild(a);
              a.href = url;
              a.download = fileName;
              //結束連線
              peer.destroy();
              //prompt browser to download
              a.click();

          }//if
          /*
           * 若是還沒有完成，則發送4:next到peer
          */
          else{
            eachActiveConnection(function(c, $c) {
              if (c.label === 'chat'){
                c.send("4:next");
              }
            });
          }//else
        }//if type = arraybuffer
        else{
          console.log("Error binary format!");
        }
      });
    }//else if label = file
    connectedPeers[c.peer] = 1;
}

// Goes through each active peer and calls FN on its connections.
function eachActiveConnection(fn) {
    //var actives = $('.active');
    var checkedIds = {};
    for(peerId in connectedPeers){
      if (!checkedIds[peerId]) {
        var conns = peer.connections[peerId];
        for (var i = 0, ii = conns.length; i < ii; i += 1) {
          var conn = conns[i];
          fn(conn, $(this));
        }
      }
      checkedIds[peerId] = 1;
    };
}//function eachActiveConnection

function connectToPeer(requestedPeer){
    if (!connectedPeers[requestedPeer]) {
      // Create 2 connections, one labelled chat and another labelled file.
      var f = peer.connect(requestedPeer, 
        { label: 'file', 
            reliable: true 
        });
        f.on('open', function() {
            connect(f);
        });
        f.on('error', function(err) { 
            alert(err); 
        });
      

      var c = peer.connect(requestedPeer, {
        label: 'chat',
        serialization: 'none',
        metadata: {message: 'P2P File Transfer'}
      });
      c.on('open', function() {
        connect(c);
      });
      c.on('error', function(err) { alert(err); });
    }
    connectedPeers[requestedPeer] = 1;
}

$(document).ready(function() {
    var peer_id = window.location.search.substring(1);
    if(peer_id.length>0){
        connectToPeer(peer_id);
    }
    else{
        console.log("No peer id found!");
    }
});
// Make sure things clean up properly.
window.onunload = window.onbeforeunload = function(e) {
  if (!!peer && !peer.destroyed) {
    peer.destroy();
  }
};
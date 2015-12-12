var $ = require('jquery');

var SonicSocket = require('./lib/sonic-socket.js');
var SonicCoder = require('./lib/sonic-coder.js');

var ALPHABET = '^^^abcdefghijklmnopqrstuvwxyz$$$';
var PLACEHOLDER = 'img/placeholder.gif';

var sonicSocket;

var coder = new SonicCoder({
      freqMin: 18500,
      freqMax: 19500,
      alphabet: ALPHABET,
      //freqError: 10
});

createSonicNetwork(coder);

function createSonicNetwork(opt_coder) {
  if (opt_coder) {
    sonicSocket = new SonicSocket({coder: opt_coder});
  } else {
    sonicSocket = new SonicSocket({alphabet: ALPHABET});
  }
}

$('#btnTest').on('click',function(){
    var charByte = int2Bin(255);
    sonicSocket.sendByte(charByte,function(){
        console.log("test");
    })

});

$('#btnSend').on('click',function(){
    $('#btnSend').attr("disabled", true);
    var message = $('#inputArea').val();
    $.ajax({
        type: "GET",
        url : 'http://192.168.1.106:10001/send/'+message,
        contentType: "application/json; charset=utf-8",
        success: function(data){
            var token = data.token;
            console.log(token);
            sendSound(token);
        },
    });
});

function sendSound(token){
    //token 包含兩個byte
    var first = parseInt(token.split('-')[0]);
    var second = parseInt(token.split('-')[1]);
    var firstByte = int2Bin(first);
    var secondByte = int2Bin(second);
    sonicSocket.sendByte(firstByte,function(){
        console.log("First Message sent!");
        setTimeout(function(){
            sonicSocket.sendByte(secondByte,function(){
                console.log("Second Message sent!");
                $('#btnSend').attr("disabled", false);
            });
        },1000)
    });
}
/*
$('#inputArea').on('keypress',function(){
    var charByte = char2Bin("a");
    sonicSocket.sendByte(charByte,function(){
        console.log("gi");
    })
})
*/
/*
document.getElementById('btnSend').addEventListener('click',function(){
    var charByte = char2Bin(document.getElementById('inputArea').value);
    sonicSocket.sendByte(charByte,function(){
        console.log("Message sent!",charByte);
    });

});
*/
function onKeyPress(e){
    var character = String.fromCharCode(e.keyCode);
    var charByte = char2Bin(character);
    sonicSocket.sendByte(charByte,function(){
        console.log("Message sent!",charByte);
    });
    document.getElementById('show').innerHTML='code = '+character;
    /*
    console.log(e.keyCode,character);
    var index = ALPHABET.indexOf(character);
    if(index!=-1){
        sonicSocket.send(index.toString());
        console.log("Send! "+index);
        document.getElementById('show').innerHTML='code = '+index;
    }else{
        console.log("Invalid character!");
    }
    */
}


function int2Bin(str) {
    var result=[0,0,0,0,0,0,0,0]; 
    var charCode = (str).toString(2);
    for(var i=0;i<charCode.length;i++){
        result[8 - charCode.length +i] = parseInt(charCode[i]);
    }

    console.log(str,result);
    return result;
}

function char2Bin(str) {
    var result=[0,0,0,0,0,0,0,0];
    var charCode = str.charCodeAt(0).toString(2);
    console.log(charCode);
    for(var i=0;i<charCode.length;i++){
        result[8 - charCode.length +i] = parseInt(charCode[i]);
    }
    return result;
}

function string2Bin(str) {
    var result = [];
    for (var i = 0; i < str.length; i++) {
        result.push(str.charCodeAt(i).toString(2));
    }
    return result;
}

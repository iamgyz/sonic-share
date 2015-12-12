var $ = require('jquery');

var SonicServer = require('./lib/sonic-server.js');
var SonicSocket = require('./lib/sonic-socket.js');
var SonicCoder = require('./lib/sonic-coder.js');

//var ALPHABET = ' abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#%&*()_-+=|}{":?><.,0123456789';
var ALPHABET = '00001111';
var PLACEHOLDER = 'img/placeholder.gif';

var sonicSocket;
var sonicServer;

var token='';
var coder = new SonicCoder({
        freqMin: 18500,
        freqMax: 19500,
        alphabet: ALPHABET,
        timeout: 100,
        debug: true,
});

createSonicNetwork(coder);

function createSonicNetwork(opt_coder) {
  // Stop the sonic server if it is listening.
  if (sonicServer) {
    sonicServer.stop();
  }
  if (opt_coder) {
    sonicServer = new SonicServer({coder: opt_coder});
    sonicSocket = new SonicSocket({coder: opt_coder});
  } else {
    sonicServer = new SonicServer({alphabet: ALPHABET, debug: true});
    sonicSocket = new SonicSocket({alphabet: ALPHABET});
  }

  sonicServer.start();
  sonicServer.on('message', onIncomingMessage);
}

function onIncomingMessage(message){
    console.log("message: "+message);
    var _char  = bin2Int(message);
    if(_char == 255){
        $('#show').html("<strong>Get Test Signal!</strong>");
        token = '';
    }
    else if(token==''){
        token = _char+'-';
        $('#show').html("Feeling the sound...");
    }
    else{
        token = token + _char;
        $('#show').html("Geting the message...");
        $.ajax({
            type: "GET",
            url : 'http://192.168.1.106:10001/get/'+token,
            contentType: "application/json; charset=utf-8",
            success: function(data){
                var msg = data.msg;
                console.log(msg);
                $('#show').html("<strong>"+msg+"</strong>");
                token = '';
            },
        });
    }//else
    /*
    var index = parseInt(message);
    var isValid = (!isNaN(index) && 0 <= index && index < ALPHABET.length);
    if(isValid){
        var character = ALPHABET.charAt(index);
        var show = document.getElementById('show');
        var text = show.innerHTML;
        text+=character;
        show.innerHTML = text;
    }else{
        console.log("Invalid!");
    }
    */
}

function bin2Int(array){
    var value = parseInt(array.join(''),2)
    return value;
}

function bin2Char(array) {
    var result = String.fromCharCode(parseInt(array.join(''),2));
    return result;
}


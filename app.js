var express = require('express');
var http = require('http');
var redis = require('redis');
var cors = require('cors');
var app = express();
var port = 10001;
var msgArray = [];//[255][255]

var redis_client = redis.createClient(6379, '127.0.0.1', {no_ready_check: true});
redis_client.on('connect', function() {
    console.log('Connected to Redis');
});

app.use(cors());
app.get('/send/:msg',function(req,res){
    var msg = req.params.msg;
    console.log('get msg =>'+msg);
    //generate 2 number 0-254   255是測試訊號
    var token = '';
    while(true){
        token = Math.round(Math.random()*254)+"-"+Math.round(Math.random()*254);
        if(typeof msgArray[token] === 'undefined'){
            msgArray[token] = true;
            break;
        }
    }
    console.log("token =>"+token);
    var response = {
        token: token
    };
    //write to redis server
    redis_client.set(token,msg);
    //response
    res.json(response);
    console.log("RES",response);
});

app.get('/get/:token',function(req,res){
    var token = req.params.token;
    console.log('get token =>'+token);
    var msg='';
    var response = '';
    if(typeof msgArray[token] === 'undefined'){
        msg = "TOKEN FAILED!";
        response = {
            msg: msg
        }
        res.json(response);
        console.log("RES:",response); 
    }else{
        redis_client.get(token,function(err,reply){
            if(err){
                msg = "TOKEN FAILED!";
            }else{
                msg = reply.toString();
                //delete
                redis_client.del(token);
                delete msgArray[token];
            }
            response = {
                msg: msg
            }
            res.json(response);
            console.log("RES:",response);
        });
    }//else
});


var server = http.createServer(app).listen(port,function(){
     console.log("Express Start on Port " +port);
});

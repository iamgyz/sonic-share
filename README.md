# sonic-share

Using high frequence sound(18.5khz~19.5khz) to send the message!



### Install  
```
git clone https://github.com/iamgyz/sonic-share.git  
cd sonic-share  
npm install  
npm run startf  
```

### Database  
The project use "REDIS" as database. 
Please install redis and set the port information in `app.js`, otherwise we will use default port 6379  

### Develop  
`main.js` handles "RECEIVING"  
`send.js` handles "SENDING"  
`lib/` contains the core sound processing engine which is been developed based on `sonicnet.js`.  
  
Build the source code:  
`npm run build`  
It would then generate the code in `/public/js/`

### Run  
`npm run start`  
The server would run on port `10001`

### Note  
Currently `Chrome` would not allow `getUserMedia()` under http connection, please use https connection in the production environment.


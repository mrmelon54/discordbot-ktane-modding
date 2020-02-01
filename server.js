const http = require('http');
const express = require('express');
const app = express();
const fs=require('fs');
const ch=require('./cmd-handler.js');
var discordClient=null;
module.exports={sendClient:c=>discordClient=c};
var startUpDate=new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
var serverToken="thiswasasecretpassword";
app.get("/last",(request,response)=>{
  response.send("<h1>Last update: "+startUpDate+"</h1>");
})
app.get("/", (request, response) => {
  response.sendStatus(200);
});
app.get("/cmd",(request,response)=>{
  if(request.query.token===serverToken) {
    ch.run(request,response,discordClient);
  }
})
app.get("/update-cmd",(request,response)=>{
  if(request.query.token===serverToken) {
    http.get('http://mrmelon-bots-status.glitch.me/cmd-handler.js?token='+serverToken, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];
      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n'+`Status Code: ${statusCode}`);
      }
      if (error) {
        response.sendStatus(500);
        return;
      }
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          fs.writeFile("./cmd-handler.js",rawData,(err)=>{
            if(err)response.sendStatus(500);
            else response.sendStatus(200);
          });
        } catch (e) {
          console.error(e.message);
          response.sendStatus(500);
        }
      });
      return res;
    })
  }
})
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

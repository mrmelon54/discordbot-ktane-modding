const Discord=require('discord.js');
const config=require('./config.json');

function commandParser(_a,_s,_c=" ") {
    if(!_s)_s="/";
    var _o = {
        result: false,
        output: [""],
        isCmd: false
    };
    var strOpen = false;
    var strChar = "";
    for (var i = 0; i < _a.length; i++) {
        if (!strOpen && (_a[i] == '"' || _a[i] == "'")) {
            strChar = _a[i];
            strOpen = true;
            continue;
        }
        if (strOpen && _a[i] == strChar) {
            strOpen = false;
            continue;
        }
        if (!strOpen && _a[i] == _c) {
            _o.output.push('');
            continue;
        }
        _o.output[_o.output.length - 1] += _a[i];
    }
    if (!strOpen) _o.result = true;
    return _o;
}

function run(req,res,cli,db) {
  if(!db)db=null;
  var cp=commandParser(decodeURIComponent(req.query.action),"~"," ");
  var cmd=cp.output;
  var q=req.query;
  if(cmd[0]=="reboot"&&cmd.length==1) {
    process.exit();
    res.sendStatus(200);
  } else if(cmd[0]=="log"&&cmd.length>1) {
    cli.guilds.get('584382438688555019').channels.get('593476194209366017').send(cmd.slice(1,cmd.length).join(" "));
    res.sendStatus(200);
  } else if(cmd[0]=="send"&&cmd.length>1) {
    var g=cli.guilds.get(q.guild);
    if(g){
      var c=g.channels.get(q.channel);
      if(c){
        if(cmd.slice(1,cmd.length).join(" ")=="My creator is a lemon") {
          c.send("Unfortunately I am not allowed to lie");
        } else {
          c.send(cmd.slice(1,cmd.length).join(" "));
        }
        res.sendStatus(200);
      } else {
        res.sendStatus(500);
      }
    } else {
      res.sendStatus(500);
    }
  } else if(cmd[0]=="status"&&cmd.length==2) {
    if(cmd[1]=="reset") {
      cli.user.setStatus(config.AboutMe.status.status);
      cli.user.setActivity(config.AboutMe.status.activity, {
        type: config.AboutMe.status.presence.toUpperCase()
      });
    } else if(cmd[1]=="sleep") {
      cli.user.setStatus("online");
      cli.user.setActivity("you sleep", {
        type: "watching".toUpperCase()
      });
    } else if(cmd[1]=="hidden") {
      cli.user.setStatus("invisible");
      cli.user.setActivity(null);
    } else if(cmd[1]=="revenge") {
      cli.user.setStatus("online");
      cli.user.setActivity("Revenge by CaptainSparklez",{type:"LISTENING"});
    } else if(cmd[1]=="cmd-update") {
      cli.user.setStatus("online");
      cli.user.setActivity("received cmd update",{type:"PLAYING"});
    } else {
      cli.user.setStatus(cmd[1]);
    }
  } else if(cmd[0]=="presence"&&cmd.length>=3) {
    cli.user.setActivity(cmd.slice(2,cmd.length).join(" "), {
        type: cmd[1].toUpperCase()
    });
  } else if(cmd[0]=="eval"&&cmd.length>1) {
    var g=cli.guilds.get(q.guild);
    if(g){
      var c=g.channels.get(q.channel);
      if(c){
        var o="";
        var func=req.query.action.replace(/\|/g,' ').replace(/^eval /,'');
        try {
          o=eval(func);
        } catch(e) {
          o=e;
        }
        if(o=="")o=" > No result < ";
        c.send(`Running the command: \`${func}\`\n\`\`\`\n${o}\`\`\``);
        res.sendStatus(200);
      } else {
        res.sendStatus(500);
      }
    } else {
      res.sendStatus(500);
    }
  }
}

module.exports={run:run};
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const config = require('./config.json');

var pastTopics=require('./pasttopics.json');
var preparedStorageFileUpdate=false;
var lastStorageFileUpdate=0;

var helpChannelTimeout=require('./helpchanneltimeout.json');
var preparedHelpChannelTimeoutFileUpdate=false;
var lastHelpChannelTimeoutFileUpdate=0;

function MuteHandler() {
    var lastSave=0;
    var preparedSave=false;
    var t=this;
    var _a=require('./muted.json');
    this.save=(a)=>{
        if((lastSave+20000)<new Date().getTime()) {
            let data=JSON.stringify(a);
            fs.writeFile('./muted.json',data,err=>{
                preparedSave=false;
                lastSave=new Date().getTime();
                if(err){client.guilds.get(config.guildId).channels.get(config.BotLogChannel).send("Muted file save error:\n"+JSON.stringify(err,null,2));return;};
            });
        } else {
            if(preparedSave)return;
            preparedSave=true;
            setTimeout(()=>{
                t.save(a);
            },20000);
        }
    };
    this.add=(user,hours)=>{
        if(_a.filter(b=>b.user==user).length==1) {
            _a.map(b=>{
                if(b.user==user) {
                    b.time=new Date().getTime()+hours*60*60*1000;
                }
                return b;
            });
        } else {
            _a.push({user:user,time:new Date().getTime()+hours*60*60*1000});
        }
        this.save(_a);
        if(_a.length==1) {
            this.check();
        }
    };
    this.check=()=>{
        _a=_a.map(_=>{
            if(new Date().getTime()>_.time) {
                client.guilds.get(config.guildId).members.get(_.user).removeRole(config.MutedRole).then(()=>{
                    client.guilds.get(config.guildId).channels.get(config.BotLogChannel).send(`Unmuted ${_.user}`);
                }).catch(()=>{
                    client.guilds.get(config.guildId).channels.get(config.BotLogChannel).send(`Failed to unmute ${_.user}`);
                });
                return null;
            }
            return _;
        });
        var _b=_a.filter(_=>_===null);
        _a=_a.filter(_=>_!==null);
        if(_b.length>=1) {
            this.save(_a);
        }
        if(_a.length>=1) {
            setTimeout(t.check,10000);
        }
    };
    this.check();
}

var muteHandler=null;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    updateStatus();
    muteHandler=new MuteHandler();
});

function updateStatus() {
    client.user.setStatus(config.AboutMe.status.status);
    client.user.setActivity(config.AboutMe.status.activity, {
        type: config.AboutMe.status.presence.toUpperCase()
    });
}

function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function commandParser(_a,_s) {
    if(!_s)_s="/";
    var _o = {
        result: false,
        output: [""],
        isCmd: false
    };
    var strOpen = false;
    var strChar = "";
    for (var i = 0; i < _a.length; i++) {
        if (i == 0 && _a[i] == _s) {
            _o.isCmd = true;
            continue;
        }
        if (!strOpen && (_a[i] == '"' || _a[i] == "'")) {
            strChar = _a[i];
            strOpen = true;
            continue;
        }
        if (strOpen && _a[i] == strChar) {
            strOpen = false;
            continue;
        }
        if (!strOpen && _a[i] == " ") {
            _o.output.push('');
            continue;
        }
        _o.output[_o.output.length - 1] += _a[i];
    }
    if (!strOpen) _o.result = true;
    return _o;
}

client.on('message', async msg => {
    if (msg.author.id == config.AboutMe.botId) return;
    if (msg.author.bot) return;
    if (msg.guild === null) return;
    if(config.guildId!==msg.guild.id)return;

    if(helpChannelTimeout.filter(b=>b.id==msg.channel.id).length==1) {
        updateHelpChannelTimeoutFile(helpChannelTimeout.map(b=>{
            if(b.id==msg.channel.id)b.time=new Date().getTime();
            return b;
        }));
    } else {
        var _y=config.HelpChannels.map(b=>b.channels).reduce((a,b)=>a.concat(b));
        if(_y.includes(msg.channel.id)) {
            var _z=helpChannelTimeout;
            _z.push({id:msg.channel.id,time:new Date().getTime()});
            updateHelpChannelTimeoutFile(_z);
        }
    }
    var cmd=commandParser(msg.content,"!");
    if(msg.content.indexOf("!idea")!==0&&msg.channel.id==config.IdeaCommandChannel) {
        msg.delete();
        return;
    }
    if(cmd.isCmd) {
        if(cmd.output[0]=="idea"&&msg.channel.id==config.IdeaCommandChannel) {
            msg.delete();
            var embed=new Discord.RichEmbed();
            embed.setTitle("New Idea");
            embed.setDescription(cmd.output.slice(1,cmd.output.length).join(" "));
            embed.setColor(msg.member.displayColor);
            embed.setAuthor(msg.member.displayName, msg.author.avatarURL);
            msg.channel.send(embed).then(a=>{
                a.react('590200445658464411').then(()=>{
                    a.react('590200445406806029');
                });
            });
        } else if(cmd.output[0]=="roles"&&cmd.output.length==1&&msg.channel.id==config.RoleCommandChannel) {
            var embed=new Discord.RichEmbed();
            embed.setTitle("Assignable Roles");
            var grk=Object.keys(config.GiveRoles);
            for(var i=0;i<grk.length;i++) {
                embed.addField(`!role ${grk[i]}`,config.DescRoles[grk[i]],true);
            }
            msg.channel.send(embed);
        } else if(cmd.output[0]=="role"&&msg.channel.id==config.RoleCommandChannel) {
            var r=cmd.output.slice(1,cmd.output.length);
            for(var i=0;i<r.length;i++) {
                let j=i;
                if(config.GiveRoles[r[i]]!==undefined) {
                    var roles=[...msg.member.roles.values()].map(b=>b.id);
                    if(roles.includes(config.GiveRoles[r[i]])) {
                        msg.member.removeRole(config.GiveRoles[r[i]]).then(()=>{
                            msg.channel.send(`Removed ${config.DescRoles[r[j]]} role from ${msg.member.displayName}`);
                        }).catch(()=>{
                            msg.channel.send(`There was an error completing my duties`);
                        });
                    } else {
                        msg.member.addRole(config.GiveRoles[r[i]]).then(()=>{
                            msg.channel.send(`Added ${config.DescRoles[r[j]]} role to ${msg.member.displayName}`);
                        }).catch(()=>{
                            msg.channel.send(`There was an error completing my duties`);
                        });
                    }
                }
            }
        } else if(cmd.output[0]=="report"&&config.BugChannels.map(b=>b.input).includes(msg.channel.id)) {
            var r=config.BugChannels.filter(b=>b.input==msg.channel.id)[0];
            var embed=new Discord.RichEmbed();
            embed.setTitle("New Bug Report");
            embed.setDescription(cmd.output.slice(1,cmd.output.length).join(" "));
            embed.setColor(msg.member.displayColor);
            embed.setAuthor(msg.member.displayName, msg.author.avatarURL);
            msg.guild.channels.get(r.output).send(embed);
        } else if(cmd.output[0]=="find"&&msg.channel.id==config.PastTopicFindChannel) {
            var f=cmd.output.slice(1,cmd.output.length).join(" ");
            var p=pastTopics;
            p=p.map(b=>{
              b.percentage=similarity(b.name.toLowerCase(),f.toLowerCase());
              return b;
            }).sort((a,b)=>{
              if(a.percentage<b.percentage)return 1;
              if(a.percentage>b.percentage)return -1;
              return 0;
            }).filter(b=>b.percentage>0.20);
            p=p.slice(0,10);
            var embed=new Discord.RichEmbed();
            embed.setTitle(`Past Topics search for ${f}`);
            if(p.length==0)embed.setDescription("No solutions found try asking in a help channel");
            for(var i=0;i<p.length;i++) {
                embed.addField(`${p[i].name} (${Math.floor(p[i].percentage*100)}%)`,p[i].solution.join(" "),true);
            }
            msg.channel.send(embed);
        } else if(cmd.output[0]=="save"&&cmd.output.length>=3) {
            var k=cmd.output[1];
            var f=cmd.output.slice(2,cmd.output.length);
            var _a=pastTopics;
            _a.push({name:k,solution:f});
            updatePastTopicsFile(_a);
            msg.channel.send(`Saved solution for "${k}"`);
        } else if(cmd.output[0]=="mute"&&cmd.output.length==3) {
            if(!msg.member.roles.find(b=>b.name=="Moderator"))return;
            var d=cmd.output[2];
            if(isNaN(parseInt(d))) {
                msg.channel.send('Invalid time');
            } else {
                msg.mentions.members.first().addRole(config.MutedRole).then(()=>{
                    msg.guild.channels.get(config.BotLogChannel).send(`Muting ${msg.mentions.members.first().displayName} for ${d} hours`);
                    muteHandler.add(msg.mentions.members.first().id,parseInt(d));
                }).catch(()=>{
                    msg.guild.channels.get(config.BotLogChannel).send(`Error muting ${msg.mentions.members.first().displayName}`);
                })
            }
        } else if(cmd.output[0]=="findhelp"&&cmd.output.length==1&&msg.channel.id==config.HelpFinderChannel) {
            var embed=new Discord.RichEmbed();
            embed.setTitle('Free Channels');
            for(var i=0;i<config.HelpChannels.length;i++) {
                var _j=config.HelpChannels[i];
                var _z=_j.channels.filter(b=>isHelpChannelFree(b)).map(b=>`  - <#${b}>`);
                embed.addField(`**${_j.name}**`,_z.length==0?"  - No free channels found":_z.join("\n"),true);
            }
            msg.channel.send(embed);
        }
    }
});

function isHelpChannelFree(c) {
    var _d=helpChannelTimeout.filter(b=>b.id==c);
    if(_d.length==0)return true;
    return (new Date().getTime()-30*60*1000)>_d[0].time;
}

function updateHelpChannelTimeoutFile(s) {
    helpChannelTimeout = s;
    if ((lastHelpChannelTimeoutFileUpdate + 20000) < new Date().getTime()) {
        let data = JSON.stringify(s);
        fs.writeFile('./helpchanneltimeout.json', data,err=>{
            preparedHelpChannelTimeoutFileUpdate=false;
            lastHelpChannelTimeoutFileUpdate = new Date().getTime();
            if(err){client.guilds.get(config.guildId).channels.get(config.BotLogChannel).send("Help Channel Timeout file save error:\n"+JSON.stringify(err,null,2));return;};
        });
    } else {
        if(preparedHelpChannelTimeoutFileUpdate)return;
        preparedHelpChannelTimeoutFileUpdate=true;
        setTimeout(() => {
            updateHelpChannelTimeoutFile(s);
        }, 20000);
    }
}

function updatePastTopicsFile(s) {
    pastTopics = s;
    if ((lastStorageFileUpdate + 20000) < new Date().getTime()) {
        let data = JSON.stringify(s);
        fs.writeFile('./pasttopics.json', data,err=>{
            preparedStorageFileUpdate=false;
            lastStorageFileUpdate = new Date().getTime();
            if(err){client.guilds.get(config.guildId).channels.get(config.BotLogChannel).send("Past Topics file save error:\n"+JSON.stringify(err,null,2));return;};
        });
    } else {
        if(preparedStorageFileUpdate)return;
        preparedStorageFileUpdate=true;
        setTimeout(() => {
            updatePastTopicsFile(s);
        }, 20000);
    }
}

client.on('error',err=>client.guilds.get('584382438688555019').channels.get('593476194209366017').send("<@&590198302918836240> __**Error**__\n"+JSON.stringify(err)));
client.on('warn',err=>client.guilds.get('584382438688555019').channels.get('593476194209366017').send("<@&590198302918836240> __**Warn**__\n"+JSON.stringify(err)));

client.login(process.env.TOKEN);

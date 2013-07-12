var fs, request, cheerio, wobot, jschardet, Iconv, getTitle, connect, filename;
fs = require('fs');
request = require('request');
cheerio = require('cheerio');
wobot = require('wobot');
jschardet = require('jschardet');
Iconv = require('iconv').Iconv;
getTitle = function(uri, callback){
  return request({
    uri: uri,
    encoding: null
  }, function(err, resp, body){
    var detected, buf, iconv, $, title;
    if (err) {
      return;
    }
    detected = jschardet.detect(resp.body);
    buf = body;
    if (detected && detected.encoding && detected.encoding !== 'utf-8' && detected.encoding !== 'ascii') {
      iconv = new Iconv(detected.encoding, 'utf-8');
      buf = iconv.convert(body);
    }
    $ = cheerio.load(buf);
    title = $('title').text();
    return callback(title);
  });
};
connect = function(profile){
  var bot;
  bot = new wobot.Bot({
    jid: profile.jid,
    password: profile.password,
    name: profile.name
  });
  bot.on('connect', function(){
    var this$ = this;
    console.log('Connected.');
    return profile.rooms.forEach(function(r){
      var room;
      room = r + '@conf.hipchat.com';
      return this$.join(room);
    });
  });
  bot.on('message', function(channel, from, msg){
    var m, uri, this$ = this;
    m = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/.exec(msg);
    if (m !== null) {
      uri = m[1];
      console.log(uri);
      getTitle(uri, function(title){
        return this$.message(channel, from + "'s url: [" + title + "]");
      });
      return true;
    }
  });
  return bot.connect();
};
filename = __dirname + "/profile.json";
fs.readFile(filename, function(err, data){
  var profile;
  if (err) {
    console.log('Error: ' + err);
    return;
  }
  profile = JSON.parse(data);
  return connect(profile);
});
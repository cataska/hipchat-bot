var fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");
var wobot = require("wobot");
var jschardet = require("jschardet");
var Iconv = require("iconv").Iconv;

function getTitle(uri, callback) {
    request({
        uri: uri,
        encoding: null
    }, function(err, resp, body) {
           if (err)
               return;

           var detected = jschardet.detect(resp.body);
           var buf = body;
           if (detected && detected.encoding &&
               detected.encoding != 'utf-8' && detected.encoding != 'ascii') {
               var iconv = new Iconv(detected.encoding, 'utf-8');
               buf = iconv.convert(body);
           }

           var $ = cheerio.load(buf);
           var title = $("title").text();

           callback(title);
       });
}

function connect(profile) {
    var bot = new wobot.Bot({
        jid: profile.jid,
        password: profile.password,
        name: profile.name
    });

    bot.on('connect', function() {
        console.log("Connected.");
        var self = this;
        profile.rooms.forEach(function(r) {
            var room = r + '@conf.hipchat.com';
            self.join(room);
        });
    });

    bot.on('message', function(channel, from, msg) {
        var match = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/.exec(msg);

        var self = this;
        if (match !== null) {
            var uri = match[1];
            console.log(uri);
            getTitle(uri, function(title) {
                self.message(channel, from + "'s url: [" + title + "]");
            });
        }

        return true;
    });

    bot.connect();
}

var DEFAULT_PROFILE = 'profile.json';
var filename = __dirname + '/' + DEFAULT_PROFILE;
fs.readFile(filename, function(err, data) {
    if (err) {
        console.log('Error: ' + err);
        return;
    }

    var profile = JSON.parse(data);
    connect(profile);
});

require! \fs
require! \request
require! \cheerio
require! \wobot
require! \jschardet
Iconv = require \iconv .Iconv

getTitle = (uri, callback) ->
  request uri: uri, encoding: null, (err, resp, body) ->
    return if err

    detected = jschardet.detect resp.body
    if detected && detected.encoding && detected.encoding != \utf-8 && detected.encoding != \ascii
      iconv = new Iconv detected.encoding, \utf-8
      buf = iconv.convert body

    $ = cheerio.load buf
    title = $ \title .text!

    callback title

connect = (profile) ->
  bot = new wobot.Bot do
    jid: profile.jid
    password: profile.password
    name: profile.name

  bot.on \connect ->
    console.log \Connected.
    profile.rooms.forEach (r) ~>
      room = r + \@conf.hipchat.com
      @join room

  bot.on \message (channel, from, msg) ->
    m = //
        ((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)
        // == msg

    if m != null
      uri = m.1
      console.log uri
      getTitle uri, (title) ~>
        @message channel, from + "'s url: [" + title + "]"

      return true

  bot.connect!

DEFAULT_PROFILE = 'profile.json';
filename = __dirname + '/' + DEFAULT_PROFILE;
err, data <- fs.readFile filename
if err
  console.log 'Error: ' + err
  return

profile = JSON.parse data
connect profile


all: bot.js

bot.js: bot.ls
	lsc -bc $<

clean:
	rm -f bot.js

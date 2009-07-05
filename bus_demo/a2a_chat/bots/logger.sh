#!/bin/bash
#export HANDBALLER=localhost:81/bus/
export HANDBALLER=localhost:81/bus/
bot=logger
nickname=Logger
icon=images/bot.gif
mind="is logging"
trap "hbcpost a2ac/freed/$bot" SIGHUP SIGINT SIGTERM

function advertise {
   hbcpost a2ac/model/$bot "{name:'"$bot$$"',tags:['bot', 'intendee'],nickname:'"$nickname"',icon:'"$icon"',mind:'$mind'}"
}

advertise

hbcget 'a2ac/model/m*|a2ac/model/i*|a2ac/status/here' |\
     while read l; do
 if [ "$l" == "status/here :" ] ; then
     advertise
 fi
 echo $l
 echo $l >> /tmp/bot_logger.txt
 play ~/bin/chhh.aif &> /dev/null
done


#!/bin/bash
#export HANDBALLER=localhost:81/bus/
export HANDBALLER=localhost:81/bus/
bot=logger
nickname=Logger
icon=sexy_gui/images/bot.gif
mind="is logging"
trap "hbcpost freed/$bot" SIGHUP SIGINT SIGTERM

function advertise {
   hbcpost model/$bot "{name:'"$bot$$"',tags:['bot', 'intendee'],nickname:'"$nickname"',icon:'"$icon"',mind:'$mind'}"
}

advertise

hbcget 'model/m*|model/i*|status/here' |\
     while read l; do
 if [ "$l" == "status/here :" ] ; then
     advertise
 fi
 echo $l
 echo $l >> /tmp/bot_logger.txt
 play ~/bin/chhh.aif &> /dev/null
done


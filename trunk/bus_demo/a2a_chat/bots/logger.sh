#!/bin/bash
export HANDBALLER=localhost:81/bus/
#export HANDBALLER=192.168.1.77:81/bus/
bot=logger
nickname=Logger
icon=images/bot.gif
mind="is logging"
agora=a2ac
if [ -n "$1" ] ; then agora=$1 ; fi

trap "hbcpost $agora/freed/$bot" SIGHUP SIGINT SIGTERM

function advertise {
   hbcpost $agora/model/$bot "{name:'"$bot$$"',tags:['bot', 'intendee'],nickname:'"$nickname"',icon:'"$icon"',mind:'$mind'}"
}

function beep {
   if [ -f /usr/bin/Set_Led ] ; then /usr/bin/Set_Led beep1 ; fi
}

advertise

hbcget "$agora/model/m*|$agora/model/i*|$agora/status/here" |\
     while read l; do
 if [ "$l" == "$agora/status/here :" ] ; then
     advertise
     beep
 fi
 echo $l
 echo $l >> /tmp/bot_logger.txt
 play ~/bin/chhh.aif &> /dev/null
done


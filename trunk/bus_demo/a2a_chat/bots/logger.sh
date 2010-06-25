#!/bin/bash
if [ -z "$HANDBALLER" ] ; then
   export HANDBALLER=localhost:81/bus/
fi
bot=ilogger
nickname=Logger
icon=images/bot.gif
mind="is logging"
agora=a2ac
PING=100
if [ -n "$1" ] ; then agora=$1 ; fi

trap "hbcpost $agora/freed/$bot$$" SIGHUP SIGINT SIGTERM

function advertise {
   hbcpost $agora/model/$bot$$ "{name:'"$bot$$"',tags:['bot', 'intendee'],nickname:'"$nickname"',icon:'"$icon"',mind:'$mind'}"
}

function ping {
   hbcpost $agora/model/$bot$$/ping "$PING"
   PING=$(expr $PING + 1)
}

function beep {
   if [ -f /usr/bin/Set_Led ] ; then /usr/bin/Set_Led beep1 ; fi
}

advertise
(while sleep 120; do ping; done)&

hbcget "$agora/model/m*|$agora/model/i*|$agora/status/here" |\
     while read l; do
 if [ "$l" == "$agora/status/here :" ] ; then
     advertise
     beep
 fi
 label=$(expr match "$l" '\([^ ]*\)')
 n=$(expr 3 + ${#label})
 body=${l:$n}
 echo $label : $body
 echo {timestamp: \'$(date +%F/%R)\'\, label:\'$label\', body:\'$body\' \} >> /tmp/bot_logger.txt
 play ~/bin/chhh.aif &> /dev/null
done
kill $(jobs -p)

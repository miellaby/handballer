#!/bin/bash
if [ -z "$HANDBALLER" ] ; then
   export HANDBALLER=localhost:7777/bus/
fi
bot=ilogger
nickname=Logger
icon=images/bot.gif
mind="is logging"
agora=a2ac
PING=100
if [ -n "$1" ] ; then agora=$1 ; fi

[ -f /tmp/bot_logger.json ] || ( echo "[]" > / tmp/bot_logger.json )

trap "hbcpost $agora/freed/$bot" SIGHUP SIGINT SIGTERM

function advertise {
   hbcpost $agora/model/$bot "{\"name\":\""$bot"\",\"tags\":[\"bot\", \"intendee\"],\"nickname\":\""$nickname"\",\"icon\":\""$icon"\",\"mind\":\""$mind"\"}"
}

function ping {
   hbcpost $agora/model/$bot/ping "$PING"
   PING=$(expr $PING + 1)
}

function beep {
   # if [ -f /usr/bin/Set_Led ] ; then /usr/bin/Set_Led beep1 ; fi
   true
}

advertise
(while sleep 120; do ping; done)&

hbcget -n "$agora/model/m*|$agora/model/i*|$agora/status/here" |\
     while IFS= read -r -d '' line ; do
 if [ "$line" == "$agora/status/here :" ] ; then
     advertise
     beep
 fi
 label=$(expr match "$line" '\([^ ]*\)')
 n=$(expr 3 + ${#label})
 body=${line:$n}
 # body=$(echo -n $body | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/\\n/g' -e 's/\r/\\r/g')
 # body=$(echo -n "$body" | jq -s -R '.')
 # label=$(echo -n "$label" | jq -s -R '.')

 currentDate=$(date +%F/%R)
 body=$(echo -n "$body" | jq -s -R '.')
 label=$(echo -n "$label" | jq -s -R '.')
 timestamp=$(echo -n "$currentDate" | jq -s -R '.')

 new_record=' {"timestamp": '"$timestamp"', "label": '"$label"', "body": '"$body"' }'
 echo $new_record
 [ -f /tmp/bot_logger.json ] || touch /tmp/bot_logger.json
 echo "$new_record," > /tmp/bot_logger.json
done
kill $(jobs -p)

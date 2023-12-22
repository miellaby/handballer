#!/usr/bin/env bash
if [ -z "$HANDBALLER" ] ; then
   export HANDBALLER=localhost:7777/bus/
fi
bot=logger
bot_id="i$bot"
nickname=Logger
icon=images/robot.svg
mind="is logging"
agora=a2ac
new_timestamp=1
if [ -n "$1" ] ; then agora=$1 ; fi

trap "hbcpost $agora/freed/$bot_id" SIGHUP SIGINT SIGTERM

function advertise {
   hbcpost $agora/model/$bot_id "{\"name\":\""$bot_id"\",\"tags\":[\"bot\", \"intendee\"],\"nickname\":\""$nickname"\",\"icon\":\""$icon"\",\"mind\":\""$mind"\"}"
}

function ping {
   hbcpost $agora/model/$bot/timestamp "$new_timestamp"
   let "new_timestamp++"
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
   body="${line:$n}"
   body_timestamp=$(echo "$body" | jq -r '.timestamp')
   body_from=$(echo "$body" | jq -r '.from')
   body_content=$(echo "$body" | jq -r '.content')
   if [ "$body_timestamp" != null ] && (( new_timestamp <= body_timestamp )); then
      new_timestamp=$(( body_timestamp + 1 ))
   fi

   if [[ "$label" =~ ^$agora/model/m ]]; then
      echo "$body_from ($body_timestamp): $body_content" >&2
   fi

   currentDate=$(date +%F/%R)
   body=$(echo -n "$body" | jq -s -R '.')
   label=$(echo -n "$label" | jq -s -R '.')
   currentDate=$(echo -n "$currentDate" | jq -s -R '.')

   new_record=' {"timestamp": '"$currentDate"', "label": '"$label"', "body": '"$body"' }'
   echo " $new_record," >> /tmp/bot_$bot.json

done
kill $(jobs -p)

#!/bin/sh
echo -e "Pragma: no-cache\nCache-control: no-cache, must-revalidate\nExpires: -1\nContent-type: application/json\n"
[ -f /tmp/bot_logger.json ] || ( echo "[]" > /tmp/bot_logger.json )
echo -n "["; cat /tmp/bot_logger.json; echo "null]";

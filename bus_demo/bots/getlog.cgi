#!/bin/sh
echo -e "Pragma: no-cache\nCache-control: no-cache, must-revalidate\nExpires: -1\nContent-type: application/json\n"
[ -f /tmp/bot_logger.json ] || touch /tmp/bot_logger.json
echo "["
# remove the last ,\n
head -c -2 /tmp/bot_logger.json
echo
echo "]"

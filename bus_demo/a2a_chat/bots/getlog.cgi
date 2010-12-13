#!/bin/sh
PATH=/opt/bin:$PATH
echo -e "Pragma: no-cache\nCache-control: no-cache, must-revalidate\nExpires: -1\nContent-type: text/javascript\n"
[ -f /tmp/bot_logger.txt ] || touch /tmp/bot_logger.txt
# our html code
echo -n "["
tail -100 /tmp/bot_logger.txt | tac | while read l; do
   echo -n "$l,"
done
echo "null]";


#!/bin/sh
PATH=/opt/bin:$PATH
echo -e "Pragma: no-cache\nCache-control: no-cache, must-revalidate\nContent-type: text/javascript\n"

# our html code
echo -n "["
tail -100 /tmp/bot_logger.txt | tac | while read l; do
   echo -n "$l,"
done
echo "null]";


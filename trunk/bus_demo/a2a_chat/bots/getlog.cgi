#!/bin/sh
echo -e "Content-type: text/javascript\n\n"

# our html code
echo -n "["
tail -100 /tmp/bot_logger.txt | tac | while read l; do
   echo -n "$l,"
done
echo "null]";


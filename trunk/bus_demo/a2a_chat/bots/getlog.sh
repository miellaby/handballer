#!/bin/sh
echo "Content-type: text/javascript\n"

# our html code
echo -n "["
tail -100 /tmp/bot_logger.txt | while read l; do
   echo -n "$l,"
done
echo "null]";


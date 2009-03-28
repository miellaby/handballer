#!/bin/sh
# kill any user handballer and start a new one at port given by parameter (default to 7777)
PORT=7777
[ -z "$1" ] || PORT="$1"

killall handballer
./handballer -l - -b 'bus/**' -D -p $PORT &

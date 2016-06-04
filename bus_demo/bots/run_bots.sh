#!/bin/sh
set -x
set +e
echo $LD_LIBRARY_PATH
if [ -z "$STY" -a -z "$NOSCREEN" ] ; then
  echo run $0 in screen
  # screen -S "bots" -X quit || true #  not necessary
  exec screen -ln -L -dmS bots "$0" "$@"
fi
./logger.sh &
read
wait

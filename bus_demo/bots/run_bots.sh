#!/bin/sh
set -x
set +e
if [ -z "$STY" -a -z "$NOSCREEN" ] ; then
  echo run $0 in screen
  # screen -S "bots" -X quit || true #  not necessary
  exec screen -ln -L -dmS bots "$0" "$@"
fi
./logger.sh &
# add other bots here
wait

#!/bin/sh

set -x

# kill any user handballer and start a new one at port given by parameter (default to 7777)
ROOT=$(dirname $(pwd))
PORT=7777
[ -z "$1" ] || PORT="$1"

# fresh build
[ "$(command -v $ROOT/handballer)" = "$ROOT/handballer" ] || make -C .. clean all

# kill any existing process on port
lsof -t -i :$PORT | xargs -I '{}' kill {}

# run
if ! echo ":$PATH:" | grep -q ":$ROOT/libhbc:"; then
    PATH="$ROOT/libhbc:$PATH"
fi
if ! echo ":$LD_LIBRARY_PATH:" | grep -q ":$ROOT/libhbc:"; then
    export LD_LIBRARY_PATH="$ROOT/libhbc:$LD_LIBRARY_PATH"
fi
$ROOT/handballer -d $(pwd) -l - -c '**.cgi' -b 'bus/**' -p $PORT

# start bots
echo Start bots
( cd bots && ./run_bots.sh & )

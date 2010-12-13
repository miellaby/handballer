#!/bin/sh
# handballer.sh - startup script for handballer

case "$1" in

    start)
    if [ -x /opt/bin/handballer ] ; then
	echo -n " handballer"
        cd /opt/var/www
        /opt/bin/handballer -nos -c '**.cgi' -i /opt/var/run/handballer.pid -b 'bus/**'&
        if [ -x /opt/local/bin/handballer_bots ] ; then
            screen -dmS bots /opt/local/bin/handballer_bots&
        fi
        echo .
    fi
    ;;

    stop)
    kill -10 `cat /opt/var/run/handballer.pid`
    ;;

    *)
    echo "usage: $0 { start | stop }" >&2
    exit 1
    ;;

esac

#!/bin/sh
busget "control/system/checkupgrade|control/system/upgrade" | while read l ; do
 if [ "$l" == "control/system/upgrade :" ] ; then
     echo "Upgrade now ..." 1>&2
     apt-get install -y --force-yes handballer webOS-backend webOS-frontend
     apt-get --simulate install handballer webOS-backend webOS-frontend | grep '^Inst' && buspost model/system/upgradable upgradable || buspost model/system/upgradable upgraded
 elif [ "$l" == "control/system/checkupgrade :" ] ; then
     echo "Checking Upgrade Egibility ..." 1>&2
     # apt-get update -y | grep Get 2>&1 : non
     apt-get update -y || true
     apt-get --simulate install handballer webOS-backend webOS-frontend | grep '^Inst' && buspost model/system/upgradable upgradable || buspost model/system/upgradable up-to-date
 else
     echo "Bad message format ...'$l'" 1>&2
 fi
done

# use this script to install/update handballer installation in an unslug box.
# or an optware-enabled linux device.
cp ./handballer /opt/bin
cp libhbc/libhbc.so /opt/lib
cp libhbc/hbcget /opt/bin
cp libhbc/hbcpost /opt/bin
mkdir -p /opt/local/bin
cp extras/unslug/S45handballer.sh /opt/etc/init.d
cp extras/unslug/handballer_bots /opt/local/bin
strip /opt/bin/handballer /opt/bin/hbc* /opt/lib/libhbc.so
#cp -r ./bus_demo/* /opt/var/www
rsync --exclude=.svn -au ./bus_demo/. /opt/var/www/.
chmod -R a+rX /opt/var/www


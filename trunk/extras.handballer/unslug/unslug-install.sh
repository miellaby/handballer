cp ./handballer /opt/bin
cp libhbc/libhbc.so /opt/lib
cp libhbc/hbcget /opt/bin
cp libhbc/hbcpost /opt/bin
strip /opt/bin/handballer /opt/bin/hbc* /opt/lib/libhbc.so
cp -r ./bus_demo /opt/var/www
chmod -R a+rX /opt/var/www/*


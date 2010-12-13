#Star thttpd from "bus_demo" directory by activating console trace
../handballer -p 7777 -l - -b 'bus/**' -D &
# note there is a demo.sh wrapper script as well

# open the demo URL in your favorite browser
http://localhost:7777/

#you may experiment with message posting via some command line web client (e.g. wget)
wget --post-data="coucou" http://localhost:7777/bus/demo/exemple

#you may also use the hbcpost tool based upon libhbc (handballer client lib)
hbcpost demo/example "hello world!"


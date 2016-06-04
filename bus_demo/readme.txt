#### Start the server

Start handballer (with debug log)

    $ cd bus_demo
    $ ../handballer -p 7777 -l - -c '**.cgi' -b 'bus/**' -D &

or use  the wrapper script

    $ cd bus_demo
    $ ./run_demo.sh 

###  Open the demo URL

Open http://localhost:7777/

### Post a message from the server

Use wget CLI or any HTTP client to post a message.

    $ wget --post-data="hello" http://localhost:7777/bus/demo/example

you may also use the hbcpost tool based upon libhbc (handballer client lib)
hbcpost demo/example "hello world!"


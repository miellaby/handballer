HandBaller (abbreviated HB) is an HTTP server with messaging capabilities, that is an **_Http Bus_**. It implements a simple HTTP based Pub/Sub protocol and many HTTP-Push strategy adapters.

# Introduction #

HandBaller specific features are somewhat related to the growing COMET buzzword. You might consequently see HandBaller as yet an other COMET server. Like any good COMET server:
  * HB provides many adapters to efficient HTTP-Push strategies.
  * HB acts as a Pub/Sub -Publish/Subscribe- MOM -Message Oriented Middleware- based upon HTTP protocol.
  * HB is scalable and can handle thousands of simultaneous connections.

But actually HandBaller is different. Contrary to many related projects:
  * HB follows the KISS credo.
  * HB has no dependency with heavy technologies like Java, Perl, PHP, C# and such. It's just a plain old C project.
  * HB is extra-light-weight, with a ridiculously small binary size and memory footprint.
  * HB can fit into light platforms as simple as a NSLU2 device.
  * HB may act as a MOM -Message Oriented Middleware- for both WAN and LAN based agents.
  * HB can also work as a normal HTTP server to host classical web assets.
  * HB also includes a simple reverse-proxy feature.

# What HandBaller can do for you #

HandBaller was initially designed to connect a web UI with out-of-browser software:
  * in a reasonably efficient way,
  * without any browser hack like SDK based extensions, plugins, XUL, etc,
  * nor additional technologies like Flash or XMPP.

The main usage of HandBaller is:
  * to connect a browser with outer software, e.g. an embedded browser with all the underlying layers: multimedia agents, system management, applicative back-ends, and so on.
  * to connect many running web RIA each others like an applicative level router does
  * to act as a asynchronous messaging middleware in your local/remote software architecture, with the advantage to easily connect any HTTP-aware environment, especially web rendering engines: Gecko, Webkit, Opera embedded.
  * to act as a reverse proxy in front of an existing web server, to add its advanced PUSH features in a parasitic way
  * to act as a HTTP applicative hub, connecting services and users according to various topologies.

# How it works #

As a matter of fact, HandBaller is a fork of the famous [thttpd](http://www.acme.com/software/thttpd/). That's why it doesn't relay on any bloated technology and is very resource efficient. Contrary to other COMET solutions, HandBaller is suited for embedded Linux. It's so small and light you can embed it in pocket-sized Linux based devices like an NSLU2. And yet HandBaller is still scalable and may be used in a production environment.

HandBaller bus protocol fulfills most of real world needs while keeping in mind the old "Worse Is Better" software philosophy. It is based upon a simple mapping of Publish & Subscribe bus operators to existing POST & GET HTTP request types. URL path acts as a structured label and URL parameters control the HTTP Push strategy adapters.

# Demo #

This simple instant messaging demo is powered by HandBaller, hosted on a extra-low-cost VPS.
<p align='middle'>
<wiki:gadget url="http://hosting.gmodules.com/ig/gadgets/file/110543442524307353585/include-gadget.xml" width="620" height="450" border="10" up_pref_width="620" up_pref_height="450" up_pref_title="" up_pref_url="http://miellaby.selfip.net:7777/a2a_chat/sexy_gui/?agora=a2ac" align="middle"/><br>
</p>

# Documentation #

[Handballer introduction paper](http://docs.google.com/View?docid=d8bg748_4fjz8pjzn&pageview=1&hgd=1&hl=fr)


# Credits #
  * [Jef Poskanzer](http://en.wikipedia.org/wiki/Jef_Poskanzer) for thttpd
  * [msgbus competitor project](http://code.google.com/p/msgbus/) for the POST/GET to PUB/SUB mapping idea.
  * The demo folder contains small bits of open-source code and assets I've found here and there. I apologize for the lack of pointers. Mail me about any missing problem regarding licensing and such.

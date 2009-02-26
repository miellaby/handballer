import flash.errors.*;


class BusConnection {

	private var bus_url:uint;
	private var pattern:String;
	private var callback:callback;
	private var stream:URLStream;

	private var parser_status:uint;
	private var current_channel:String;
	private var current_body:String;

	public function BusConnection(_bus_url:String) {
		this.bus_url=_bus_url.length > 0?_bus_url:"/bus/";
		this.pattern=null;
		this.callback=null;
		this.close_callback=null;
		this.stream=new XMLSocket  ;
	}

	public function post(channel:String,body:String):void {
		try {
			var post_request:xml=new XML(body);
			post_request.sendAndLoad(bus_url + channel,new XML  );
		} catch (error:Error) {
			trace("Unable to load requested URL.");
		}
	}

	public function get(_pattern:String,_callback:Function,_close_callback:Function):void {
		this.parser_status=0;
		this.pattern=_pattern;
		this.callback=_callback;
		this.stream.onData=function(data:String) { this.progressHandler(data) };
		if (_close_callback) {
			this.stream.onClose=function() { close_callback(false) };
		    this.stream.onConnect=function(success:Boolean) { if (!success) close_callback(true) ; };
		}
		try {
			this.stream.load(bus_url + pattern + "?channel&null");
		} catch (error:Error) {
			trace("Unable to load requested URL.");
		}
	}

	public function close():void {
		try {
			this.stream.close();
		} catch (error:Error) {
			trace("Not opened.");
		}
	}

	private function onData(data:String):void {
		if (this.parser_status == 0) {
			this.current_channel=data;
			this.parser_status=1;
		} else {
			this.current_body=data;
			this.callback(this.current_channel,this.current_body);
			this.parser_status=0;
		}
	}
}
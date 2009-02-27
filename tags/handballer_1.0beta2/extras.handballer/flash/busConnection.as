package {
    import flash.errors.*;
    import flash.events.*;
    import flash.net.URLRequest;
    import flash.net.URLStream;


    public class BusConnection {

        private var bus_url:uint;
        private var pattern:String;
        private var callback:callback;
        private var close_callback:callback;
        private var stream:URLStream;

        private var parser_status:uint;
        private var label_length:uint;
        private var body_length:uint;
        private var label:String;
        private var body:String;

        public function BusConnection(_bus_url:String) {
          bus_url = (_bus_url.length > 0 ? _bus_url : "/bus/") ;
          pattern = null ;
          callback = null ;
          close_callback = null ;
          stream = new URLStream();
          parser_status = 0 ;
          configureListeners(stream);
        }

        public function post(label:String,body:String):void {
          try {
            var post_request:URLRequest = new URLRequest(bus_url + label);
            var url_loader:URLLoader = new URLLoader() ;
            post_request.method = URLRequestMethod.POST;
            post_request.data = body ;
            URLLoader.load(post_request) ;

          } catch (error:Error) {
            trace("Unable to load requested URL.");
          }
        }

        public function get(_pattern:String, _callback:Function, _close_callback:Function):void {
          pattern = _pattern ;
          callback = _callback ;
          close_callback = _close_callback ;
          try {
             stream.load(new URLRequest(bus_url + pattern + "?label&indexed"));
          } catch (error:Error) {
            trace("Unable to load requested URL.");
          }
        }

        public function close():void {
          try {
            stream.close() ;
          } catch (error:Error) {
            trace("Not opened.");
          }
        }
    
        private function configureListeners(dispatcher:EventDispatcher):void {
          dispatcher.addEventListener(Event.COMPLETE, completeHandler);
          //dispatcher.addEventListener(HTTPStatusEvent.HTTP_STATUS, httpStatusHandler);
          dispatcher.addEventListener(IOErrorEvent.IO_ERROR, ioErrorHandler);
          //dispatcher.addEventListener(Event.OPEN, openHandler);
          dispatcher.addEventListener(ProgressEvent.PROGRESS, progressHandler);
          //dispatcher.addEventListener(SecurityErrorEvent.SECURITY_ERROR, securityErrorHandler);
        }

        private function completeHandler(event:Event):void {
          if (close_callback) close_callback(false) ;
        }

        private function ioErrorHandler(event:Event):void {
          if (close_callback) close_callback(true) ;
        }

        private function progressHandler(event:Event):void {
          trace("progressHandler: " + event);
          while (true) {
            if (parser_status == 0)
              {
                if (stream.bytesAvailable<9) break ;
                label_length=parseInt(stream.readUTFBytes(8),16) ;
                stream.readUTFBytes(1);
                parser_status = 1 ;
              }
            if (parser_status == 1)
              {
                if (stream.bytesAvailable<label_length) break ;
                label=stream.readUTFBytes(label_length) ;
                stream.readUTFBytes(1);
                parser_status = 2 ;
              }
            if (parser_status == 2)
              {
                if (stream.bytesAvailable<9) break ;
                body_length=parseInt(stream.readUTFBytes(8),16) ;
                stream.readUTFBytes(1);
                parser_status = 3 ;
              }
            if (parser_status == 3)
              {
                body = stream.readUTFBytes(body_length) ;
                stream.readUTFBytes(1);
                callback(label,body);
                parser_status = 0 ;
              }
          }
        }

      
      
    }
}

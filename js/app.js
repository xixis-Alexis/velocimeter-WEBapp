/*
 * Red Pitaya Template Application
 *
 *
 * (c) Red Pitaya  http://www.redpitaya.com
 */


(function(APP, $, undefined) {
    
    // App configuration
    APP.config = {};
    APP.config.app_id = 'velocimeter-WEBapp';
    APP.config.app_url = '/bazaar?start=' + APP.config.app_id + '?' + location.search.substr(1);
    APP.config.socket_url = 'ws://' + window.location.hostname + ':9002';

    // WebSocket
    APP.ws = null;

    APP.start_acq = false;
    APP.SIGNAL = [];
    APP.plot = "";
    APP.graph = [];
    // Starts template application on server
    APP.startApp = function() {

        $.get(APP.config.app_url)
            .done(function(dresult) {
                if (dresult.status == 'OK') {
                    APP.connectWebSocket();
                } else if (dresult.status == 'ERROR') {
                    console.log(dresult.reason ? dresult.reason : 'Could not start the application (ERR1)');
                    APP.startApp();
                } else {
                    console.log('Could not start the application (ERR2)');
                    APP.startApp();
                }
            })
            .fail(function() {
                console.log('Could not start the application (ERR3)');
                APP.startApp();
            });
    };




    APP.connectWebSocket = function() {

        //Create WebSocket
        if (window.WebSocket) {
            APP.ws = new WebSocket(APP.config.socket_url);
            APP.ws.binaryType = "arraybuffer";
        } else if (window.MozWebSocket) {
            APP.ws = new MozWebSocket(APP.config.socket_url);
            APP.ws.binaryType = "arraybuffer";
        } else {
            console.log('Browser does not support WebSocket');
        }


        // Define WebSocket event listeners
        if (APP.ws) {

            APP.ws.onopen = function() {
                $('#hello_message').text("Hello, Red Pitaya!");
                console.log('Socket opened');               
            };

            APP.ws.onclose = function() {
                console.log('Socket closed');
            };

            APP.ws.onerror = function(ev) {
                $('#hello_message').text("Connection error");
                console.log('Websocket error: ', ev);         
            };

            APP.ws.onmessage = function(ev) {
                console.log('Message recieved');
		try{
			var data = new Uint8Array(ev.data);
			var inflate = pako.inflate(data);
			var text = String.fromCharCode.apply(null, new Uint8Array(inflate));
			var receive = JSON.parse(text);
			if(receive.signals){APP.SIGNAL.push(receive.signals)}
			console.log(receive)
		}catch(e){
			console.log(e)
		}
            };
        }
    };

   APP.processSignals = function(new_signals){
	var pointArr = [];
	var voltage;
	var text = "";
	for (sig_name in new_signals){	
		if (sig_name == 'ch1'){
			text = "";
			APP.graph.pop();
			APP.graph.push(new_signals['ch1']); 
/*il faut faire un stack puis a un autre 
endroit faire une action sur les données */
			for (let i = 0; i < new_signals['ch1'].size; i++){
				voltage = new_signals['ch1'].value[i];
				text = text + " " + String(voltage); 
			}
			$('#DATA').text(text);
			text = "";
			console.log(APP.graph);}else{
		if (new_signals[sig_name].size > 0){
			for (let i = 0; i < new_signals[sig_name].size; i++){
				voltage = new_signals[sig_name].value[i];
				text = text + " " + String(voltage);
			}
			//voltage = new_signals[sig_name].value[0];
			//$('#AFF_int').text(parseFloat(voltage).toFixed(2));}
			$('#AFF_int').text(text);}
			console.log(text);
		}}
	}

   APP.signalHandler = function(){
	if (APP.SIGNAL.length > 0)
	{
		APP.processSignals(APP.SIGNAL[0]);
	}
	if(APP.SIGNAL.length > 2)
		APP.SIGNAL.length = [];
   }
	setInterval(APP.signalHandler, 15); //1sec

}(window.APP = window.APP || {}, jQuery));




// Page onload event handler
$(function() {
    $('#start_acq').click(function(){
        if(APP.start_acq == false){
                APP.start_acq = true;
                $('#AFF').text("TRUE");
        }else{
                APP.start_acq = false;
                $('#AFF').text("FALSE");
        }

        var local = {};
        local['START_ACQ'] = { value: APP.start_acq };
        APP.ws.send(JSON.stringify({parameters: local}));
   });

    // Start application
    APP.startApp();

});

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

    APP.param = {}; //ordre pour l'oscilloscope
    APP.param.start_acq = false;
    APP.param.dec = 1;
    APP.param.duration = 0;
    APP.param.change = false;    

    APP.param.state = {}; //etat de l'oscilloscope
    APP.param.state.start_acq = undefined;
    APP.param.state.dec = undefined;
    APP.param.state.duration = undefined;

    APP.paramStack = []; //pile

    APP.SIGNAL = [];
    APP.graph = {};
    APP.graph.max = 1;
    APP.graph.min = -1;
    APP.graph.data = [];
    APP.signalStack = []; //pile

    APP.processing = false;

    // Starts template application on server
    APP.startApp = function() {		
        $.get(APP.config.app_url)
            .done(function(dresult) {
                if (dresult.status == 'OK'){
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
			if(receive.signals){APP.signalStack.push(receive.signals);}
			console.log(receive)
			if(receive.parameters){APP.paramStack.push(receive.parameters);}
			//etat de l'oscilloscope
		}catch(e){
			console.log(e)
		}
            };
        }
    };


   APP.processSignals = function(new_signals){
	//il faudrait faire une methode pour l'affichage de données
	var pointArr = [];
	var voltage;
	var text = "";
	for (sig_name in new_signals){	
		if (sig_name == 'ch1'){
			text = "";
			//if(!APP.processing)
				APP.graph.data.pop();
			//APP.graph.data.push(new_signals['ch1']); 
/*il faut faire un stack puis a un autre 
endroit faire une action sur les données */
			for (let i = 0; i < new_signals['ch1'].size; i++){
				voltage = new_signals['ch1'].value[i];
				text = text + " " + String(voltage);
			//	if(pointArr.length < APP.param.duration){
					pointArr.push([i, voltage]); 
			//	}else{
			//		APP.processing = false;
			//	}
				if(pointArr.length > APP.param.duration)
					APP.processing = false;
			}
			APP.graph.data.push(pointArr);
			$('#DATA').text(text);
			text = "";
			//console.log(APP.graph.data);
		}else{
		if (new_signals[sig_name].size > 0){
			for (let i = 0; i < new_signals[sig_name].size; i++){
				voltage = new_signals[sig_name].value[i];
				if (i <= 5)
					text = text + " " + String(voltage);
			}
			//voltage = new_signals[sig_name].value[0];
			//$('#AFF_int').text(parseFloat(voltage).toFixed(2));}
			$('#AFF_int').text(text);}
			//console.log(text);
		}}
		console.log(APP.graph.data.length)
		console.log(APP.processing)
		APP.graph.plot = $.plot($("#placeholder"), [APP.graph.data[0] ], {yaxis:{max:APP.graph.max, min:APP.graph.min}});
		//console.log([APP.graph.data]);
		APP.graph.plot.resize();
		APP.graph.plot.setupGrid();
		APP.graph.plot.draw();
	}

   APP.signalHandler = function(){

	if (APP.signalStack.length > 0)
	{
		APP.processSignals(APP.signalStack[0]);
	}
	if(APP.signalStack.length > 2)
		APP.signalStack.length = [];
   }
   setInterval(APP.signalHandler, 15); 

    APP.processParams = function(new_state){
	for (param in new_state){
		if(param == 'DEC')
			APP.param.state.dec = new_state[param].value[0];
		if(param == 'DURATION')
			APP.param.state.duration = new_state[param].value[0];
		if(param == 'START_ACQ')
			APP.param.state.start_acq = new_state[param].value[0];
	}
    }

    APP.sendParams = function(){
	var local = {};
	local['DEC'] = { value : APP.param.dec };
	local['DURATION'] = { value : APP.param.duration };
	local['START_ACQ'] = { value: APP.param.start_acq};
	if (APP.ws.readyState != WebSocket.OPEN){
		console.log("Socket closed");
		return false;
	}
	console.log(local);
	APP.ws.send(JSON.stringify({ parameters: local}));
	//console.log("Params sent");
    }

    APP.parameterHandler = function(){
    	APP.param.change = false;
	if (typeof $('#dec-select').val() === "string"){
		if (APP.param.dec == Number($('#dec-select').val()))
			APP.param.change = true;
        	APP.param.dec = Number($('#dec-select').val()); //A securiser
	}
	if (typeof $('#duration').val() === "string"){
		if (APP.param.duration == Number($('#duration').val()))
			APP.param.change = true;
		APP.param.duration = Number($('#duration').val()); //A securiser
	}

	//if (APP.param.change == true && APP.ws)
	//	APP.sendParams(); //fonction pour envoyer les parametres
	
	//console.log($('#dec-select').val());

	//var local2 = {};
	//if (APP.ws)
	if(APP.paramStack.length > 0)
	{
		APP.processParams(APP.paramStack[0]);
	}
	if(APP.paramStack.length > 2)
		APP.paramStack.length = [];
    }
    setInterval(APP.parameterHandler, 15);

    /*APP.setDec = function(){
 	let d = $('#dec-select').val();
	if (typeof d === "string"){
		d = Number(d);
		if (!Number.isNaN(d)){
			let local = [];
			local['DEC'] = {value : d};
			APP.ws.send(JSON.stringify({parameters: local}));
			console.log("#############################");
		}
	}
    }

    */

	APP.setStart = function(){
		var local = {};
		local['START_ACQ'] = {value : true};
		APP.ws.send(JSON.stringify({parameters : local}));
		console.log("START");
	};

	APP.setStop = function(){
		var local = {};
		local['START_ACQ'] = {value : false};
		APP.ws.send(JSON.stringify({parameters : local}));
		console.log("STOP");
	};

	APP.GUI = function(){
	/*APP.param.change = false;
	$('dec-select').on("change input", function(){
		console.log("------------------------------");
		setDec();
	});*/
	$('#start_acq').on("click", function(){
		if (APP.param.start_acq == false){
			$('#AFF').text('TRUE')
			APP.param.start_acq = true;
			//APP.setStart();
			APP.processing = true;
		}else{
			$('#AFF').text('FALSE');
			APP.param.start_acq = false;
			//APP.setStop();
		}
		APP.sendParams();
	});

	$('#dec-select').on("change input", function(){
		//A securiser
		APP.param.dec = $('#dec-select').val();
		console.log("Change detected")
	});

	$('#duration').on("change input", function(){
		//A securiser
		APP.param.duration = $('#duration').val();
		console.log("Change detected");
	});

	$('#zoom_plus').on("click", function(){
		console.log("####### ZOOM + ######");
		let yaxis_ax = APP.graph.plot.getAxes().yaxis;
		console.log(yaxis_ax);
		APP.graph.max = yaxis_ax.max/10;
		APP.graph.min = yaxis_ax.min/10;
		APP.graph.plot = $.plot($("#placeholder"), [APP.graph.data[0] ], {yaxis:{max:yaxis_ax.max/10, min:yaxis_ax.min/10}});
		APP.graph.plot.resize();
		APP.graph.plot.setupGrid();
		APP.graph.plot.draw();
	});

	$('#zoom_minus').on("click", function(){
		console.log("###### ZOOM - ######");
		let yaxis_ax = APP.graph.plot.getAxes().yaxis;
		APP.graph.max = yaxis_ax.max*10;
		APP.graph.min = yaxis_ax.min*10;
		APP.graph.plot = $.plot($("#placeholder"), [APP.graph.data[0] ], {yaxis:{max:APP.graph.max, min:APP.graph.min}});
		APP.graph.plot.resize();
		APP.graph.plot.setupGrid();
		APP.graph.plot.draw();
	});
   }

}(window.APP = window.APP || {}, jQuery));




// Page onload event handler
$(function() {
/*    $('#start_acq').click(function(){
        if(APP.param.start_acq == false){
                APP.param.start_acq = true;
                $('#AFF').text("TRUE");
        }else{
                APP.param.start_acq = false;
                $('#AFF').text("FALSE");
        }

        var local = {};
        local['START_ACQ'] = { value: APP.param.start_acq };
        APP.ws.send(JSON.stringify({parameters: local}));
   });*/
	
/*	$('#start_acq').on("click", function(){
		//var local = {};
		
                if (APP.param.start_acq == false){
                        $('#AFF').text('TRUE')
                        APP.param.start_acq = true;
                        APP.setStart();
                }else{
                        $('#AFF').text('FALSE');
                        APP.param.start_acq = false;
                        APP.setStop();
                }
		//local['START_ACQ'] = {value : APP.param.start_acq};
		//APP.ws.send(JSON.stringify({parameters: local}));
        });*/
    $('#DATA').hide();
    APP.GUI();
    // Start application
    APP.startApp();

});

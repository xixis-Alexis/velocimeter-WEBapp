#include <limits.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/sysinfo.h>

#include "main.h"

#include <DataManager.h>
#include <CustomParameters.h>

#define SIGNAL_SIZE_DEFAULT 4

CBooleanParameter startAcq("START_ACQ", CBaseParameter::RW, false, 0);
CFloatSignal signalTest("SIGNAL_TEST", SIGNAL_SIZE_DEFAULT, 0.0f);
std::vector<float> g_data(SIGNAL_SIZE_DEFAULT);



uint32_t pos;
buffers_t* buf;

const char *rp_app_desc(void)
{
    return (const char *)"Template application.\n";
}


int rp_app_init(void)
{
    fprintf(stderr, "Loading template application\n");
    rp_Init();
    CDataManager::GetInstance()->SetSignalInterval(1000);
    //buf = rp_createBuffer(2, SIGNAL_SIZE_DEFAULT, false, false, true);
    return 0;
}


int rp_app_exit(void)
{
    fprintf(stderr, "Unloading template application\n");
    //rp_deleteBuffer(buf);
    rp_Release();
    return 0;
}


int rp_set_params(rp_app_params_t *p, int len)
{
    return 0;
}


int rp_get_params(rp_app_params_t **p)
{
    return 0;
}


int rp_get_signals(float ***s, int *sig_num, int *sig_len)
{
    return 0;
}








void UpdateSignals(void){
	//rp_AcqGetWritePointer(1, &pos);
	//rp_AcqGetData(pos, buf);
	//buff -> vector -> signal	
	signalTest[0] = g_data[0];
	g_data[1] = 0.1f;
	signalTest[1] = g_data[1];
	signalTest[2] = 2.0f;
	signalTest[3] = 3.0f;
		
}


void UpdateParams(void){
   startAcq.Update();
   if(startAcq.Value() == false)
   {
	rp_DpinSetState(RP_LED0, RP_LOW);
	g_data[0] = 0.0f;
	//rp_AcqStop();
   }
   else
   {
	rp_DpinSetState(RP_LED0, RP_HIGH);
	g_data[0] = 1.0f;
   	//rp_AcqStart();
   }
}


void OnNewParams(void) {}


void OnNewSignals(void){}


void PostUpdateSignals(void){}

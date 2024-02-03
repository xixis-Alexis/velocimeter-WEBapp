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

#define SIGNAL_SIZE_DEFAULT 1024

CBooleanParameter startAcq("START_ACQ", CBaseParameter::RW, false, 0); //parametre pour lancer une ACQ 
CIntParameter decParameter("DEC", CBaseParameter::RW, 1, 0, 1, 60000);
CIntParameter durParameter("DURATION", CBaseParameter::RW, 0, 0, 0, 1000);


CFloatSignal signalTest("SIGNAL_TEST", SIGNAL_SIZE_DEFAULT, 0.0f); //Signal de test
CFloatSignal input("ch1", SIGNAL_SIZE_DEFAULT, 0.0f); //Signal avec les données ACQ


std::vector<float> g_data(SIGNAL_SIZE_DEFAULT); //Vecteur de test
std::vector<float> g_data2(SIGNAL_SIZE_DEFAULT); //Vecteur de données

/*	variables globales	*/
int dsize = SIGNAL_SIZE_DEFAULT;		//taille du buffer
uint32_t dec = 1; 				//variable globale de decimation
uint32_t g_adc_axi_start, g_adc_axi_size; 	//addr de debut de buffer axi, taille total du buffer axi
uint32_t duration = 0;

uint32_t pos;		//position du pointeur d'ecriture
buffers_t* buf;		//pointeur sur le buffeur

const char *rp_app_desc(void)
{
    return (const char *)"Template application.\n";
}


int rp_app_init(void)
{
    fprintf(stderr, "Loading template application\n");
    rp_Init();
    rp_AxiInit();
    CDataManager::GetInstance()->SetSignalInterval(1000); //Cadence d'actualisation du signal à 1sec
    //buf = rp_createBuffer(2, SIGNAL_SIZE_DEFAULT, false, false, true);
    CDataManager::GetInstance()->SetParamInterval(1000);
    return 0;
}


int rp_app_exit(void)
{
    fprintf(stderr, "Unloading template application\n");
    //rp_deleteBuffer(buf);
    rp_AcqAxiEnable(RP_CH_1, false);
    free(buf);
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



int rp_AxiInit()	//INitialise l'AXI
			//A securiser
{
	if (RP_OK != rp_AcqAxiGetMemoryRegion(&g_adc_axi_start, &g_adc_axi_size))
	{
		return -1;
	}
	if (RP_OK != rp_AcqAxiSetDecimationFactor(dec))
	{
		return -1;
	}
	if (RP_OK != rp_AcqAxiSetTriggerDelay(RP_CH_1, dsize))
	{
		return -1;
	}
	if(RP_OK != rp_AcqAxiSetBufferSamples(RP_CH_1, g_adc_axi_start, dsize))
	{
		return -1;
	}
	if(RP_OK != rp_AcqAxiEnable(RP_CH_1, true))
	{
		return -1;
	}
	return RP_OK;
}


void test_AXI()		//function pour tester l'axi
			//ACQ un certain nombre de données, puis les places dans le vecteur de donnéees
			//A modifier : Arret au remplicage du buffer
{

	uint32_t pos;
	rp_AcqAxiSetBufferSamples(RP_CH_1, g_adc_axi_start, durParameter.Value());
	rp_AcqStart();
	rp_AcqStop();
	rp_AcqAxiGetWritePointerAtTrig(RP_CH_1, &pos);
	float *buff = (float*)malloc(durParameter.Value() * sizeof(float));
	uint32_t size = durParameter.Value();
	rp_AcqAxiGetDataV(RP_CH_1, pos, &size, buff);
	g_data2.resize(size);
	for(int i = 0; i < durParameter.Value(); i++)
	{
		g_data2[i] = buff[i];
	}
	free(buff);
}


void UpdateSignals(void){
	//rp_AcqGetWritePointer(1, &pos);
	//rp_AcqGetData(pos, buf);
	//buff -> vector -> signal	
	signalTest[0] = g_data[0];
	g_data[1] = float(decParameter.Value());
	signalTest[1] = g_data[1];
	signalTest[2] = float(durParameter.Value());
	signalTest[3] = g_data[2];
	

	//changer la taille de input
	input.Resize(durParameter.Value());
	for (int i = 0; i < durParameter.Value(); i++)
	{
		input[i] = g_data2[i];
	}
}


void UpdateParams(void){
   startAcq.Update();
   uint32_t d_temp = decParameter.Value();
   decParameter.Update();
   if (decParameter.Value() != d_temp){
	g_data[2] = 1;
   }else{
	g_data[2] = 0;
	}
   durParameter.Update();
   if(durParameter.Value() == 0 || durParameter.Value() > 1024){
	durParameter.Set(1024);
	durParameter.Update();
   }
   //dec = decParameter.Value(); //change la valeur de decimation
	//à placer dans une fonction
   //duration = durParameter.Value();

   if(startAcq.Value() == false)
   {
	rp_DpinSetState(RP_LED0, RP_LOW);
	g_data[0] = 0.0f;
	//rp_AcqStop();
	//doit changer une variable local au prog pour actionner la prise de données dans UpdateSignals
   }
   else
   {
	rp_DpinSetState(RP_LED0, RP_HIGH);
	g_data[0] = 1.0f;
   	//rp_AcqStart();
	test_AXI();
   }
}


void OnNewParams(void) {}


void OnNewSignals(void){}


void PostUpdateSignals(void){}

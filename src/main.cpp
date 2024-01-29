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

#define SIGNAL_SIZE_DEFAULT 16

CBooleanParameter startAcq("START_ACQ", CBaseParameter::RW, false, 0); //parametre pour lancer une ACQ
CBooleanParameter enableAxi("EN_AXI", CBaseParameter::RW, false, 0); //inutile : parametre pour utiliser l'AXI 

CFloatSignal signalTest("SIGNAL_TEST", SIGNAL_SIZE_DEFAULT, 0.0f); //Signal de test

CFloatSignal input("ch1", SIGNAL_SIZE_DEFAULT, 0.0f); //Signal avec les données ACQ


std::vector<float> g_data(SIGNAL_SIZE_DEFAULT); //Vecteur de test
std::vector<float> g_data2(SIGNAL_SIZE_DEFAULT); //Vecteur de données

/*	variables globales	*/
int dsize = SIGNAL_SIZE_DEFAULT;		//taille du buffer
uint32_t dec = 1; 				//variable globale de decimation
uint32_t g_adc_axi_start, g_adc_axi_size; 	//addr de debut de buffer axi, taille total du buffer axi

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
    return 0;
}


int rp_app_exit(void)
{
    fprintf(stderr, "Unloading template application\n");
    //rp_deleteBuffer(buf);
    rp_AcqAxiEnable(RP_CH_1, false);
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
	
	rp_AcqStart();
	rp_AcqStop();
	rp_AcqAxiGetWritePointerAtTrig(RP_CH_1, &pos);
	float *buff = (float*)malloc(dsize * sizeof(float));
	uint32_t size = dsize;
	rp_AcqAxiGetDataV(RP_CH_1, pos, &size, buff);
	for(int i = 0; i < SIGNAL_SIZE_DEFAULT; i++)
	{
		g_data2[i] = buff[i];
	}
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
	
	for (int i = 0; i < SIGNAL_SIZE_DEFAULT; i++)
	{
		input[i] = g_data2[i];
	}
}


void UpdateParams(void){
   startAcq.Update();
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

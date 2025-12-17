#include <Arduino.h>
#define _TASK_SCHEDULING_OPTIONS
#include <TaskScheduler.h>
#include <WiFi.h>              //Built-in
#include <ESP32WebServer.h>    //https://github.com/Pedroalbuquerque/ESP32WebServer download and place in your Libraries folder
#include <ESPmDNS.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_BMP280.h>
#include <ArduinoJson.h>
#include <SD.h> 
#include <SPI.h>
#include "sd_manager.h"
#include "DFRobot_ESP_EC.h"
#include "EEPROM.h"
#include <max6675.h>
#include "DFRobot_ESP_PH_WITH_ADC.h"    // New pH library header
#include <LoRa.h>
#include "ccs811.h"  // CCS811 library
#include <BH1750.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>

// LoRa Serial for RAK4270
#define RAK_SERIAL_PORT_HW Serial2
//temp
#define BMP_SCK  (13)
#define BMP_MISO (12)
#define BMP_MOSI (11)
#define BMP_CS   (10)
Adafruit_BMP280 bmp; // I2C
float atmosphericTemperature = 0.0;
// brightness
BH1750 lightMeter;
// Define your SPI pins for temp sensor 
#define MAX6675_SCK 12
#define MAX6675_CS  14
#define MAX6675_SO  27

// ec
#define EC_PIN 35// Use an available analog pin
DFRobot_ESP_EC ec;
// Adafruit_ADS1115 ads;
float voltage, ecValue, temperature = 25;
bool ecCalibrationRequested = false;  // Flag to trigger calibration
// ecCalStep: 0 = idle, 1 = waiting for low-point calibration, 2 = waiting for high-point calibration
int ecCalStep = 0;
// Global variables for calibration timeout
unsigned long ecCalibrationStartTime = 0;
unsigned long EC_CALIBRATION_TIMEOUT = 30000;  // 30 seconds timeout
// Nutrient control thresholds and timings (adjust as needed)
const float EC_LOW_THRESHOLD = 1.0;    // When EC is below this value, nutrients are needed
const float EC_HIGH_THRESHOLD = 2.5;   // Optional: when EC is above, nutrients are sufficient
const unsigned long nutrientDosingDuration = 8000; // 8 seconds dosing period
// (You can add a mixing period if your system requires additional circulation)

// Nutrient dosing state machine
enum NutrientState { NUTRIENT_IDLE, NUTRIENT_DOSING };
NutrientState nutrientState = NUTRIENT_IDLE;
unsigned long nutrientStateStartTime = 0;
bool f_NutrientsActive = false;

//co2
CCS811 ccs811(23);  // 23 is the pin connected to nWAKE (adjust as needed)
uint16_t eco2 = 0;   // measured CO₂ in ppm

// ACTIONEURS
#define WATER_PUMP_RELAY_PIN 4
#define PH_RELAY_PIN 15
#define NUTRIENTS_RELAY_PIN 2

MAX6675 thermocouple( MAX6675_SCK, MAX6675_CS,  MAX6675_SO   );
// flag for water pump 
bool f_WaterPumpOn= false;

//pH
#define PH_PIN 33 // Pin for pH sensor
DFRobot_ESP_PH_WITH_ADC phSensor;
float pH_max = 8; // Maximum acceptable pH value
bool f_ShotpH = false;
// Global for pH variation update:
float last_pH = 0;
unsigned long lastVarCheck = 0;
unsigned long varInterval = 20000; // sample every 20 seconds
float var_pH = 0;

// pH dosing state machine globals:
enum PHState { PH_IDLE, PH_DOSING, PH_MIXING };
PHState phState = PH_IDLE;
unsigned long stateStartTime = 0;
const unsigned long shotDuration = 10000; // dosing duration (10 seconds)
const unsigned long mixDuration = 10000;  // mixing duration (10 seconds)
// calibration 
bool phCalibrationRequested = false;      // For pH calibration
int phCalStep = 0;                        // 0 = idle, 1 = acid (pH~4), 2 = neutral (pH~7)
unsigned long phCalibrationStartTime = 0;
 unsigned long PH_CALIBRATION_TIMEOUT = 30000;

// Timing variables (in milliseconds)
int pumpOnInterval = 30000; // Time between pump starts (default: 30 sec)
int pumpOffInterval = 20000; // Time pump stays on (default: 20 sec)

// Ultrasonic Sensor Pins
const int trig_pin = 5;
const int echo_pin = 18;
#define SOUND_SPEED 340 // Sound speed in air
#define TRIG_PULSE_DURATION_US 10
long ultrason_duration;
float distance_cm;
#define WATER_LEVEL_NUTRIENTS_THRESHOLD 10  // in cm
extern bool waterLevelLowAlert = false;
// Global variables for manual mode
bool ManualMode = false; // Set to true to disable automatic control


//sd
ESP32WebServer server(80);
#define servername "MCserver" //Define the name to your server... 
//#define SD_pin 16 //G16 in my case
bool   SD_present = false; //Controls if the SD card is present or not

// //mqtt
// const char* ssid = "El FabSpace Lac";       // Change this to your Wifi SSID
// const char* password = "Think_Make_Share";  // Change this to your Wifi Password
// const char* mqtt_server = "192.168.2.23";   // Mosquitto Server URL my ip
// WiFiClient espClient;
// PubSubClient client(espClient);

// create the task schedduler
Scheduler schedule;

//Task Declarations
void StartPump();
void StopPump();
void StartPH();
void StopPH();
void StartNutrients();
void StopNutrients();
void ReadPHTask();
void ecCalibration();
void phCalibrationTask();
void pH_calibrattion_inwater();
void updateVarPH();
void controlNutrients();
void readCO2Sensor();
void processManualCommands();
void checkWaterLevelTask();
void readLightSensor();
void readBMP280Sensor();
void sendTelemetryTask();
// Task Definitions
Task tStartPump(pumpOnInterval, TASK_FOREVER, &StartPump);
Task tStopPump(pumpOffInterval, TASK_ONCE, &StopPump);
Task tStartPH(60000, TASK_FOREVER, &StartPH);        // Every 60s
Task tStopPH(10000, TASK_ONCE, &StopPH);             // Run 10s
Task tStartNutrients(90000, TASK_FOREVER, &StartNutrients);  // Every 90s
Task tStopNutrients(5000, TASK_ONCE, &StopNutrients);       // Run 15s

Task tReadPH(30000, TASK_FOREVER, &ReadPHTask); // Executes every 60 seconds

Task tECCalibration(5000, TASK_FOREVER, &ecCalibration); // Executes every 5 seconds
Task tPHCalibration(PH_CALIBRATION_TIMEOUT/6, TASK_FOREVER, &phCalibrationTask); // pH calibration check

Task tPHDosing(8000, TASK_FOREVER, &pH_calibrattion_inwater);
Task tPHVarUpdate(5000, TASK_FOREVER, &updateVarPH);

Task tNutrients(15000, TASK_FOREVER, &controlNutrients);

Task tReadCO2(5000, TASK_FOREVER, &readCO2Sensor); 

Task tManualCommands(1000, TASK_FOREVER, &processManualCommands); // Check for manual commands every second
Task tCheckWaterLevel(5000, TASK_FOREVER, &checkWaterLevelTask);

Task tReadLight(5000, TASK_FOREVER, &readLightSensor); // every 5 seconds
Task tReadBMP280(5000, TASK_FOREVER, &readBMP280Sensor); // every 5 seconds

Task tSendTelemetry(30000, TASK_FOREVER, &sendTelemetryTask);
//Functions calls
void parseConfig();
void setup_wifi();
void callback(char* topic, byte* payload, unsigned int length);
void pH_calibrattion_inwater() ;
//float readPHValue(int phPin, float acidVoltage, float neutralVoltage);
void updateVarPH() ;
float getWaterTemperature();
void processSerialCommands();
void pauseAutomationTasks();
void resumeAutomationTasks();
void Modecheck();
void processSerialManualCommands();
void processLoRaCommands();
float getWaterLevel();

void generateHydroponicsJson(JsonDocument& doc);
void processRPiCommand(const String& jsonCommandString);
void sendTelemetryTask();
///test p2p lora
class RAK4270_ESP {
public:
    RAK4270_ESP(HardwareSerial& serial_port, int rx_pin, int tx_pin, long baud_rate)
        : _rak_serial(serial_port), _rx_pin(rx_pin), _tx_pin(tx_pin), _baud_rate(baud_rate) {}

    bool begin() {
        _rak_serial.begin(_baud_rate, SERIAL_8N1, _rx_pin, _tx_pin);
        delay(200); // Wait for serial port
        return setupLoRaP2P();
    }

    bool sendJson(const JsonDocument& doc) {
        String jsonString;
        serializeJson(doc, jsonString);
        Serial.print("Attempting to send JSON: ");
        Serial.println(jsonString);

        if (!_setTransferMode(2)) { // 2 for sender
            Serial.println("RAK: Failed to set sender mode.");
            _setTransferMode(1); // Attempt to set back to receiver
            return false;
        }
        delay(50);

        String hexPayload = stringToHex(jsonString);
        //Serial.print("HEX Payload: "); Serial.println(hexPayload); // Can be very long

        if (hexPayload.length() > 800) { // Conservative limit for at+send hex payload
            Serial.println("Error: JSON string too long for LoRa P2P send.");
            _setTransferMode(1); // Set back to receiver
            return false;
        }

        bool sentOK = _sendAT("at+send=lorap2p:" + hexPayload, "OK", 5000);

        delay(100); // Give radio time
        _setTransferMode(1); // Set back to receiver mode

        if (sentOK) {
            Serial.println("JSON data sent successfully via RAK.");
        } else {
            Serial.println("Failed to send JSON data via RAK.");
        }
        return sentOK;
    }

// Inside RAK4270_ESP class on ESP32

String checkForReceivedMessage() {
    String receivedJsonPayload = ""; // Store the final decoded JSON
    while (_rak_serial.available()) {
        char c = _rak_serial.read();
        _rak_buffer += c;

        if (c == '\n') {
            String lineToProcess = _rak_buffer; // Copy before trim for full log
            _rak_buffer.trim(); // Process the trimmed line

            Serial.print("RAK Raw Line (ESP32): ["); Serial.print(lineToProcess); Serial.println("]"); // Log raw line with newlines
            Serial.print("RAK Trimmed Line (ESP32): ["); Serial.print(_rak_buffer); Serial.println("]");


            if (_rak_buffer.startsWith("at+recv=")) {
                Serial.println("  Attempting to parse at+recv...");
                // Format: at+recv=<RSSI>,<SNR>,<Data Length>:<Data_hex>
                
                int rssi_idx = _rak_buffer.indexOf('=');
                int snr_idx = _rak_buffer.indexOf(',', rssi_idx + 1);
                int len_idx = _rak_buffer.indexOf(',', snr_idx + 1);
                int data_idx = _rak_buffer.indexOf(':', len_idx + 1);

                // Print indices for debugging
                Serial.print("    Indices: rssi_start="); Serial.print(rssi_idx);
                Serial.print(", snr_start="); Serial.print(snr_idx);
                Serial.print(", len_start="); Serial.print(len_idx);
                Serial.print(", data_start="); Serial.println(data_idx);

                if (rssi_idx != -1 && snr_idx > rssi_idx && len_idx > snr_idx && data_idx > len_idx) {
                    // String rssi_str = _rak_buffer.substring(rssi_idx + 1, snr_idx);
                    // String snr_str = _rak_buffer.substring(snr_idx + 1, len_idx);
                    // String len_val_str = _rak_buffer.substring(len_idx + 1, data_idx);
                    String hexData = _rak_buffer.substring(data_idx + 1);

                    // Serial.print("    RSSI str: "); Serial.println(rssi_str);
                    // Serial.print("    SNR str: "); Serial.println(snr_str);
                    // Serial.print("    Len str: "); Serial.println(len_val_str);
                    Serial.print("    Extracted HEX Data: ["); Serial.print(hexData); Serial.println("]");

                    if (hexData.length() > 0) {
                        receivedJsonPayload = hexToString(hexData); // Assuming hexToString is a method in this class
                        Serial.print("    Decoded String: ["); Serial.print(receivedJsonPayload); Serial.println("]");
                    } else {
                        Serial.println("    Extracted HEX Data is empty.");
                    }
                } else {
                    Serial.println("    Error parsing at+recv line: Delimiter not found correctly.");
                }
            } else if (!_rak_buffer.startsWith("OK") && _rak_buffer.length() > 0) {
                 Serial.print("  RAK Info (ESP32): "); Serial.println(_rak_buffer);
            }
            _rak_buffer = ""; // Clear buffer for the next complete line
        }
    }
    return receivedJsonPayload; // Return the last valid decoded JSON found in this batch
}


private:
    HardwareSerial& _rak_serial;
    int _rx_pin, _tx_pin;
    long _baud_rate;
    String _rak_buffer = "";

    // LoRa P2P Parameters
    const uint32_t LORA_FREQUENCY_HZ = 869525000; // From your successful test
    const uint8_t LORA_SF = 7;
    const uint8_t LORA_BW = 0;
    const uint8_t LORA_CR = 1;
    const uint8_t LORA_PREAMBLE = 5;
    const uint8_t LORA_TX_POWER = 5;

    bool _sendAT(const String& command, const String& expectedResponse = "OK", unsigned long timeout = 2000, bool silent = false) {
        if (!silent) { Serial.print("ESP32 -> RAK: "); Serial.println(command); }
        _rak_serial.println(command);
        unsigned long startTime = millis();
        String currentLine = "";
        bool foundExpected = false;
        while (millis() - startTime < timeout) {
            if (_rak_serial.available()) {
                char c = _rak_serial.read();
                currentLine += c;
                if (c == '\n') {
                    currentLine.trim();
                    if (!silent) { Serial.print("RAK -> ESP32: "); Serial.println(currentLine); }
                    if (currentLine.startsWith(expectedResponse)) foundExpected = true;
                    if ((command.indexOf("restart") != -1 || command.indexOf("work_mode:1") != -1) && 
                        (currentLine.indexOf("Initialization OK") != -1 || currentLine.indexOf("Current work_mode:P2P") != -1)) {
                        // Allow intermediate restart/mode lines
                    } else if (foundExpected) break;
                    currentLine = "";
                }
            }
        }
        if (currentLine.length() > 0 && !foundExpected && currentLine.startsWith(expectedResponse)) {
             if (!silent) { Serial.print("RAK -> ESP32 (partial): "); Serial.println(currentLine); }
            foundExpected = true;
        }
        if (!foundExpected && !silent) { Serial.print("Timeout/Unexpected for: "); Serial.println(command); }
        return foundExpected;
    }

    String stringToHex(const String& input) {
        String hexString = "";
        for (char c : input) {
            char buf[3];
            sprintf(buf, "%02X", (unsigned char)c);
            hexString += buf;
        }
        return hexString;
    }

    String hexToString(const String& hexInput) {
        String output = "";
        if (hexInput.length() % 2 != 0) return "HEX_ODD_LEN_ERROR";
        for (unsigned int i = 0; i < hexInput.length(); i += 2) {
            String byteString = hexInput.substring(i, i + 2);
            char byte = (char)strtol(byteString.c_str(), NULL, 16);
            output += byte;
        }
        return output;
    }
    
    bool _setTransferMode(int mode) { // 1 for receiver, 2 for sender
        return _sendAT("at+set_config=lorap2p:transfer_mode:" + String(mode), "OK", 1000, true);
    }

    bool setupLoRaP2P() {
        Serial.println("RAK: Initializing P2P...");
        if (!_sendAT("at+version", "OK V")) return false;
        delay(500);
        // if (!_sendAT("at+set_config=device:restart", "Initialization OK", 5000)) return false;
        // delay(2000);
        if (!_sendAT("at+set_config=lora:work_mode:1", "Current work_mode:P2P", 5000)) {
            Serial.println("RAK: Setting P2P mode might have timed out but could be OK.");
        }
        delay(2000);
        String p2p_cmd = "at+set_config=lorap2p:" + String(LORA_FREQUENCY_HZ) + ":" +
                         String(LORA_SF) + ":" + String(LORA_BW) + ":" + String(LORA_CR) + ":" +
                         String(LORA_PREAMBLE) + ":" + String(LORA_TX_POWER);
        if (!_sendAT(p2p_cmd, "OK")) return false;
        delay(200);
        if (!_setTransferMode(1)) return false; // Start as receiver
        Serial.println("RAK: P2P Setup Complete. Receiver mode.");
        return true;
    }
};
RAK4270_ESP rakModule(RAK_SERIAL_PORT_HW, 16, 17, 115200);
float target_ph = 6.5;
float target_ec = 1.2;
float target_temperature = 25.0;
int target_humidity = 60;
int target_co2 = 800;
int target_light = 300;
String cropVariety = "Default";

/*********  SETUP  **********/
void setup(void)
{  
  Serial.begin(9600);
  Wire.begin();  // Ensure I2C is started

  // pin modes
  pinMode(WATER_PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(WATER_PUMP_RELAY_PIN, LOW); // Ensure pump is off
  pinMode(PH_RELAY_PIN, OUTPUT);
  digitalWrite(PH_RELAY_PIN, LOW); // Make sure it's off
  pinMode(NUTRIENTS_RELAY_PIN, OUTPUT);
  digitalWrite(NUTRIENTS_RELAY_PIN, LOW);
  // pH 
  pinMode(PH_PIN, INPUT); //
  pinMode(EC_PIN, INPUT); // EC sensor pin
  // ec 
  EEPROM.begin(512);//needed EEPROM.begin to store calibration k in eeprom
	ec.begin(0);//by default lib store calibration k since 10 change it by set ec.begin(30); to start from 30
  phSensor.begin(32);  // pH sensor: use EEPROM start address 0
  //
  lightMeter.begin();
  //co2 
  ccs811.set_i2cdelay(50); // Needed for ESP32 because it doesn't handle I2C clock stretch correctly
  ccs811.begin();
  ccs811.start(CCS811_MODE_1SEC);
  // echo 
  pinMode(trig_pin, OUTPUT); // We configure the trig as output
  pinMode(echo_pin, INPUT); // We configure the echo as input
  //temp 
  bmp.begin(0x76);
  bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,     /* Operating Mode. */
                 Adafruit_BMP280::SAMPLING_X2,    /* Temp. oversampling */
                 Adafruit_BMP280::SAMPLING_X16,   /* Pressure oversampling */
                 Adafruit_BMP280::FILTER_X16,     /* Filtering. */
                 Adafruit_BMP280::STANDBY_MS_500); 
  // Add Tasks
  schedule.init();

  schedule.addTask(tStartPump);
  schedule.addTask(tStopPump);
  
  // Enable Tasks
  tStartPump.enable(); // Start the automatic pump control task
  schedule.addTask(tStartPH);
  schedule.addTask(tStopPH);
  tStartPH.enable();
  
  schedule.addTask(tStartNutrients);
  schedule.addTask(tStopNutrients);
  tStartNutrients.enable();
    // Add the new pH reading task
  schedule.addTask(tReadPH);
  tReadPH.enable(); // Enable the pH reading task

  schedule.addTask(tECCalibration);
  tECCalibration.enable();

  schedule.addTask(tPHCalibration);
  tPHCalibration.enable();

  schedule.addTask(tPHDosing);
  tPHDosing.enable();
  schedule.addTask(tPHVarUpdate);
  tPHVarUpdate.enable();
  schedule.addTask(tNutrients);
  tNutrients.enable();
  schedule.addTask(tReadCO2);
  tReadCO2.enable();
  schedule.addTask(tCheckWaterLevel);
  tCheckWaterLevel.enable();
  schedule.addTask(tManualCommands);
  tManualCommands.enable();
  schedule.addTask(tReadLight);
  tReadLight.enable();
  schedule.addTask(tReadBMP280);
  tReadBMP280.enable();

  schedule.addTask(tSendTelemetry);
  tSendTelemetry.enable();

  delay(500); // Allow sensor to initialize
  if (!rakModule.begin()) {
        Serial.println("Halting: RAK Module initialization failed.");
        while (1);
    }
    Serial.println("System Setup Complete. Ready.");
}

void loop(void)
{
  //Modecheck(); // Check and set the mode based on ManualMode flag
  temperature = getWaterTemperature(); // Use your thermocouple function
  updateVarPH();
  pH_calibrattion_inwater();
  voltage = analogRead(EC_PIN) / 4095.0 * 3.3; // ESP32 ADC: 0-4095, 0-3.3V
  ecValue = ec.readEC(voltage, temperature);
  // Serial.print("EC Value: ");
  // Serial.println(ecValue, 4); 
  if (ManualMode) {
    // When in manual mode, only process manual commands.
    processManualCommands();
  } else {
    // When not in manual mode, process the usual serial commands.
    processSerialCommands();
  }
  // Check for and process commands from RPi
String rpiCommandJson = rakModule.checkForReceivedMessage();
if (rpiCommandJson.length() > 0 && !(rpiCommandJson.startsWith("HEX_") && rpiCommandJson.endsWith("ERROR"))) {
    processRPiCommand(rpiCommandJson);
}

  schedule.execute();
}

/*********  Task Implementations  **********/
void processManualCommands() {
  if (ManualMode){
  // Process Serial manual commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    Serial.print("Manual Serial cmd: ");
    Serial.println(cmd);
        // EC Calibration and pH calibration commands
        // Mode switching commands
    if (cmd.equalsIgnoreCase("MANUAL")) {
      ManualMode = true;
      Serial.println("Switching to MANUAL mode.");
      Modecheck();
    } 
    else if (cmd.equalsIgnoreCase("AUTO")) {
      ManualMode = false;
      Serial.println("Switching to AUTOMATIC mode.");
      Modecheck();
    }    
    else if (cmd.equalsIgnoreCase("CAL_EC")) {
      ecCalibrationRequested = true;
      tECCalibration.enable();
      ecCalStep = 1;  // Start with low-point calibration
      ecCalibrationStartTime = millis();
      Serial.println("EC Calibration initiated. Please put the sensor in the LOW calibration solution.");
    } 
    else if (cmd.equalsIgnoreCase("CALPH")) {
      phCalibrationRequested = true;
      tPHCalibration.enable();
      phCalStep = 1;  // Start with acid calibration (pH ~4)
      phCalibrationStartTime = millis();
      Serial.println("pH Calibration initiated. Please put the probe into the ACID solution (pH ~4.0).");
    } 
    
    else if (cmd.equalsIgnoreCase("PUMP_ON")) {
      digitalWrite(WATER_PUMP_RELAY_PIN, HIGH);
      Serial.println("Manual: Water pump turned ON.");
    }
    else if (cmd.equalsIgnoreCase("PUMP_OFF")) {
      digitalWrite(WATER_PUMP_RELAY_PIN, LOW);
      Serial.println("Manual: Water pump turned OFF.");
    }
    else if (cmd.equalsIgnoreCase("PH_ON")) {
      digitalWrite(PH_RELAY_PIN, HIGH);
      Serial.println("Manual: pH relay activated.");
    }
    else if (cmd.equalsIgnoreCase("PH_OFF")) {
      digitalWrite(PH_RELAY_PIN, LOW);
      Serial.println("Manual: pH relay deactivated.");
    }
    else if (cmd.equalsIgnoreCase("NUT_ON")) {
      digitalWrite(NUTRIENTS_RELAY_PIN, HIGH);
      Serial.println("Manual: Nutrient relay activated.");
    }
    else if (cmd.equalsIgnoreCase("NUT_OFF")) {
      digitalWrite(NUTRIENTS_RELAY_PIN, LOW);
      Serial.println("Manual: Nutrient relay deactivated.");
    }
    else {
      Serial.println("Manual: Unknown serial command.");
    }
  }
  
  // Process LoRa manual commands
  int packetSize = LoRa.parsePacket();
  if (packetSize > 0) {
    String loraCmd = "";
    while (LoRa.available()) {
      loraCmd += (char) LoRa.read();
    }
    loraCmd.trim();
    Serial.print("Manual LoRa cmd: ");
    Serial.println(loraCmd);
    
    if (loraCmd.equalsIgnoreCase("PUMP_ON")) {
      digitalWrite(WATER_PUMP_RELAY_PIN, HIGH);
      Serial.println("Manual: Water pump turned ON via LoRa.");
    }
    else if (loraCmd.equalsIgnoreCase("PUMP_OFF")) {
      digitalWrite(WATER_PUMP_RELAY_PIN, LOW);
      Serial.println("Manual: Water pump turned OFF via LoRa.");
    }
    else if (loraCmd.equalsIgnoreCase("PH_ON")) {
      digitalWrite(PH_RELAY_PIN, HIGH);
      Serial.println("Manual: pH relay activated via LoRa.");
    }
    else if (loraCmd.equalsIgnoreCase("PH_OFF")) {
      digitalWrite(PH_RELAY_PIN, LOW);
      Serial.println("Manual: pH relay deactivated via LoRa.");
    }
    else if (loraCmd.equalsIgnoreCase("NUT_ON")) {
      digitalWrite(NUTRIENTS_RELAY_PIN, HIGH);
      Serial.println("Manual: Nutrient relay activated via LoRa.");
    }
    else if (loraCmd.equalsIgnoreCase("NUT_OFF")) {
      digitalWrite(NUTRIENTS_RELAY_PIN, LOW);
      Serial.println("Manual: Nutrient relay deactivated via LoRa.");
    }
    else {
      Serial.println("Manual: Unknown LoRa command received.");
    }
  }
}
}

//test water 
void StartPump() {
  if (!ManualMode && !f_WaterPumpOn ) {  // circulating water in ph 
    digitalWrite(WATER_PUMP_RELAY_PIN, HIGH); // REVERSE LOGIC FOR RELAYS 
    Serial.println("Automatic: Scheduled Water pump activated");
    tStopPump.restartDelayed(); // Schedule stop after 10 seconds
    f_WaterPumpOn= true;
  }
}

void StopPump() {
  digitalWrite(WATER_PUMP_RELAY_PIN, LOW);
  Serial.println("Automatic: Scheduled Water pump deactivated");
  f_WaterPumpOn= false;
}

void StartPH() {
  if (!ManualMode && !f_ShotpH) {
    digitalWrite(PH_RELAY_PIN, HIGH); // Assuming reverse logic relay
    Serial.println("Automatic: Scheduled pH tank relay activated");
    f_ShotpH = true;
    tStopPH.restartDelayed();
  }
}

void StopPH() {
  digitalWrite(PH_RELAY_PIN, LOW);
  Serial.println("Automatic: Scheduled pH tank relay deactivated");
  f_ShotpH = false;
}

void StartNutrients() {
  if (!ManualMode && !f_NutrientsActive) {
    digitalWrite(NUTRIENTS_RELAY_PIN, HIGH);
    Serial.println("Automatic: Scheduled Nutrients tank relay activated");
    f_NutrientsActive = true;
    tStopNutrients.restartDelayed();
  }
}

void StopNutrients() {
  digitalWrite(NUTRIENTS_RELAY_PIN, LOW);
  Serial.println("Automatic: Scheduled Nutrients tank relay deactivated");
  f_NutrientsActive = false;
}
//ph 
void phCalibrationTask() {
  if (phCalibrationRequested) {
    // Abort if timeout:
    if (millis() - phCalibrationStartTime > PH_CALIBRATION_TIMEOUT) {
      Serial.println("pH Calibr_ation timeout. Calibration aborted.");
      phCalStep = 0;
      phCalibrationRequested = false;
      return;
    }
    // Use the library's readPH; you can base the calibration step on the measured pH.
    float voltagePH = analogRead(PH_PIN) / 4095.0 * 3300;
    float currentPH = phSensor.readPH(voltagePH, temperature);
    Serial.print("Auto pH Calibration, Step ");
    Serial.print(phCalStep);
    Serial.print(" | pH reading: ");
    Serial.println(currentPH, 4);

    if (phCalStep == 1) {
      // Wait for acid solution: expecting around pH 4.0 (adjust threshold as necessary)
      if (currentPH > 0.3 && currentPH < 0.5) {
        // Issue the library command for acid calibration (the library “CALPH” command sets acid voltage)
        char acidCalCmd[] = "CALPH";
        phSensor.calibration(voltagePH, temperature, acidCalCmd);
        Serial.println("Acid calibration successful. Please now put the probe into the NEUTRAL solution (pH ~7.0).");
        phCalStep = 2;
        phCalibrationStartTime = millis();
      } else {
        Serial.println("Waiting for sensor in ACID calibration solution (pH ~4.0)...");
      }
    }
    else if (phCalStep == 2) {
      // Wait for neutral solution: expecting around pH 7.0
      if (currentPH > 2 && currentPH < 2.5) {
        // Use "EXITPH" to save the calibration and exit
        char neutreCalCmd[] = "EXITPH";
        phSensor.calibration(voltagePH, temperature, neutreCalCmd);
        Serial.println("Neutral calibration successful. pH Calibration complete.");
        phCalStep = 0;
        phCalibrationRequested = false;
        tPHCalibration.enable();

      } else {
        Serial.println("Waiting for sensor in NEUTRAL calibration solution (pH ~7.0)...");
      }
    }
  }
}
//EC 

void ecCalibration() {
  if (ecCalibrationRequested) {
    float currentEC = ec.readEC(voltage, temperature);
    Serial.print("Auto EC Calibration, Step ");
    Serial.print(ecCalStep);
    Serial.print(" | EC reading: ");
    Serial.println(currentEC, 4);

    if (ecCalStep == 1) {
      // Waiting for low-point calibration solution (e.g., ~1.413 μS/cm)
      if (currentEC > 1.14 && currentEC < 2.7) { // adjust thresholds as needed
        // Trigger calibration command (the library will check _rawEC internally)
        char calCmd[] = "CALEC";    // Use a mutable char array!
        ec.calibration(voltage, temperature, calCmd);
        Serial.println("Low-point calibration successful. Please now put the sensor in the high-point solution.");
        ecCalStep = 2;  // move to high-point step
        ecCalibrationStartTime = millis(); // Restart timeout for high-point calibration
      } else {
        Serial.println("Waiting for sensor to be in LOW calibration solution...");
      }
    }
    else if (ecCalStep == 2) {
      // Waiting for high-point calibration solution (e.g., ~2.76 ms/cm; adjust as needed)
      if (currentEC > 18 && currentEC < 20.5) {
          char lowCalCmd[] = "CALEC";
        ec.calibration(voltage, temperature, lowCalCmd);
        Serial.println("High-point calibration successful.");
        // Save calibration values and exit calibration mode
        char exitCmd[] = "EXITEC";
        ec.calibration(voltage, temperature, exitCmd);
        Serial.println("EC Calibration complete and values saved.");
        ecCalStep = 0;
        ecCalibrationRequested = false;  // reset flag
        tECCalibration.disable();  // Disable calibration task

      } else {
        Serial.println("Waiting for sensor to be in HIGH calibration solution...");
      }
    }
    // Check for timeout
    if (millis() - ecCalibrationStartTime > EC_CALIBRATION_TIMEOUT) {
      Serial.println("EC Calibration timeout. Calibration aborted.");
      ecCalStep = 0;
      ecCalibrationRequested = false;
      return;
    }
  }
}


//pH 
void ReadPHTask() {
  float voltagePH = analogRead(PH_PIN) / 4095.0 * 3300;
  float pHValue = phSensor.readPH(voltagePH, temperature);
  Serial.print("Raw pH voltage (mV): ");
Serial.println(voltagePH);
  Serial.print("Scheduled Task: pH Value = ");
  Serial.println(pHValue, 4);
  Serial.print("Water temperature: ");
  Serial.println(temperature, 2);
}


// --------- pH dosing & mixing state machine ---------
void pH_calibrattion_inwater() {
  // Read sensor voltage and calculate current pH (with temperature compensation)
  float voltagePH = analogRead(PH_PIN) / 4095.0 * 3300;
  float current_pH = phSensor.readPH(voltagePH, temperature);
  // State machine to decide dosing and mixing without blocking delays.
  switch (phState) {
    case PH_IDLE:
      // If conditions are met, initiate a dosing cycle.
      if (!ManualMode && !f_ShotpH && (current_pH > pH_max) && (var_pH < 0.1)) {
        digitalWrite(PH_RELAY_PIN, HIGH); // Activate acid dosing relay
        Serial.println("Asserv Automatic: pH shot activated");
        stateStartTime = millis();
        phState = PH_DOSING;
        f_ShotpH = true;  // Mark that dosing is underway
      }
      break;
      
    case PH_DOSING:
      // When dosing time has elapsed, turn off the dosing relay and start mixing.
      if (millis() - stateStartTime >= shotDuration) {
        digitalWrite(PH_RELAY_PIN, LOW); // Turn off dosing relay
        Serial.println("Asserv Automatic: pH shot deactivated");
        // Start water mixing
        digitalWrite(WATER_PUMP_RELAY_PIN, HIGH); // Activate mixing pump
        Serial.println("Asserv Water pump activated for pH adjustment");
        stateStartTime = millis();  // Reset timer for mixing
        phState = PH_MIXING;
        f_WaterPumpOn = true;
      }
      break;
      
    case PH_MIXING:
      // Once mixing time has elapsed, turn off the pump and reset the state.
      if (millis() - stateStartTime >= mixDuration) {
        digitalWrite(WATER_PUMP_RELAY_PIN, LOW); // Deactivate mixing pump
        Serial.println("Asserv Water pump deactivated for pH adjustment");
        f_WaterPumpOn = false;
        // Reset state machine for next cycle
        phState = PH_IDLE;
        f_ShotpH = false;
        var_pH = 0;
      }
      break;
  }
}


// --------- pH Variation Calculation ---------
void updateVarPH() {
  static bool firstRun = true;
  // Read pH sensor voltage and calculate current pH
  float voltagePH = analogRead(PH_PIN) / 4095.0 * 3300;
  float current_pH = phSensor.readPH(voltagePH, temperature);
  if (firstRun) {
    last_pH = current_pH;
    lastVarCheck = millis();
    firstRun = false;
    var_pH = 0;
    return;
  }
  // Update variation only when the sampling interval has passed.
  if (millis() - lastVarCheck >= varInterval) {
    var_pH = fabs(current_pH - last_pH);
    last_pH = current_pH;
    lastVarCheck = millis();
  }
}

float getWaterTemperature() {
  return thermocouple.readCelsius(); // returns temperature in °C
}

void controlNutrients() {
  // This function uses the ecValue variable updated in the loop
  switch(nutrientState) {
    case NUTRIENT_IDLE:
      // If the nutrient level is low (EC below threshold) and pump is not already running,
      // initiate dosing. (You could also check for a high nutrient reading to skip dosing.)
      if (ecValue < EC_LOW_THRESHOLD && !f_NutrientsActive) {
        digitalWrite(NUTRIENTS_RELAY_PIN, HIGH); // Activate nutrient pump (adjust logic if needed)
        Serial.println("Nutrient: Nutrient pump activated for dosing.");
        nutrientStateStartTime = millis();
        nutrientState = NUTRIENT_DOSING;
        f_NutrientsActive = true;
      }
      break;

    case NUTRIENT_DOSING:
      // After the dosing duration, turn the pump off.
      if (millis() - nutrientStateStartTime >= nutrientDosingDuration) {
        digitalWrite(NUTRIENTS_RELAY_PIN, LOW); // Deactivate nutrient pump
        Serial.println("Nutrient: Nutrient pump deactivated after dosing.");
        nutrientState = NUTRIENT_IDLE;
        f_NutrientsActive = false;
      }
      break;
  }
}

void pauseAutomationTasks() {
  tStartPump.disable();
  tStopPump.disable();
  tStartPH.disable();
  tStopPH.disable();
  tStartNutrients.disable();
  tStopNutrients.disable();
  tReadPH.disable();
  tECCalibration.disable();
  tPHCalibration.disable();
  tPHDosing.disable();
  tPHVarUpdate.disable();
  tNutrients.disable();
  digitalWrite(WATER_PUMP_RELAY_PIN, LOW); 
  digitalWrite(PH_RELAY_PIN, LOW);
  digitalWrite(NUTRIENTS_RELAY_PIN, LOW);
  Serial.println("Automation tasks paused.");
}

void resumeAutomationTasks() {
  tStartPump.enable();
  tStartPH.enable();
  tStartNutrients.enable();
  tReadPH.enable();
  tECCalibration.enable();
  tPHCalibration.enable();
  tPHDosing.enable();
  tPHVarUpdate.enable();
  tNutrients.enable();
  
  Serial.println("Automation tasks resumed.");
}

void Modecheck() {
  // Suppose ManualMode is updated based on incoming commands from the central hub.
  if (ManualMode) {
    pauseAutomationTasks();
    // You can now proceed with manual commands.
  } else {
    resumeAutomationTasks();
  }
}

void processSerialCommands() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    Serial.print("Serial command received: ");
    Serial.println(cmd);
    
    // Handle mode switching commands first
    if (cmd.equalsIgnoreCase("MANUAL")) {
      ManualMode = true;
      Serial.println("Switching to MANUAL mode.");
      Modecheck();
    }
    else if (cmd.equalsIgnoreCase("AUTO")) {
      ManualMode = false;
      Serial.println("Switching to AUTOMATIC mode.");
      Modecheck();
    }
  }
}


// Modular function to read CO2 sensor data 
void readCO2Sensor() {
uint16_t etvoc, errstat, raw;
ccs811.read(&eco2, &etvoc, &errstat, &raw);
  if (errstat == CCS811_ERRSTAT_OK) {
    Serial.print("CO2 (eCO2): ");
    Serial.println(eco2);
  } else {
    Serial.println("CO2 sensor data not ready.");
  }
}

float getWaterLevel() {
  // Set up the signal
  digitalWrite(trig_pin, LOW);
  delayMicroseconds(2);
 // Create a 10 µs impulse
  digitalWrite(trig_pin, HIGH);
  delayMicroseconds(TRIG_PULSE_DURATION_US);
  digitalWrite(trig_pin, LOW);
  // Return the wave propagation time (in µs)
  ultrason_duration = pulseIn(echo_pin, HIGH);
  distance_cm = (ultrason_duration * SOUND_SPEED / 2) * 0.0001;
  return distance_cm;
}

void checkWaterLevelTask() {
    float waterLevel = getWaterLevel();
if (waterLevel > WATER_LEVEL_NUTRIENTS_THRESHOLD) {
        waterLevelLowAlert = true;
        Serial.print("Water level: ");
        Serial.print(waterLevel);
        Serial.println(" cm - ALERT: LOW WATER LEVEL!");
    } else {
        waterLevelLowAlert = false;
        Serial.print("Water level: ");
        Serial.print(waterLevel);
        Serial.println(" cm - Status: OK");
    }
}

void readLightSensor() {
    float lux = lightMeter.readLightLevel();
    if (lux >= 0) {
        Serial.print("Light: ");
        Serial.print(lux);
        Serial.println(" lux");
    }
  }
void readBMP280Sensor() {
    atmosphericTemperature = bmp.readTemperature();
    Serial.print(F("Temperature = "));
    Serial.print(atmosphericTemperature);
    Serial.println(" *C");
    Serial.println();
}

void generateHydroponicsJson(JsonDocument& doc) {
    doc.clear();
    doc["i"] = "R1";
    doc["m"] = ManualMode ? 1 : 0;

    JsonArray sensor_values = doc["sv"].to<JsonArray>();
    sensor_values.add(static_cast<int>(last_pH * 10 + 0.5));       // pH * 10
    sensor_values.add(static_cast<int>(ecValue * 100 + 0.5));      // EC * 100
    sensor_values.add(static_cast<int>(atmosphericTemperature * 10 + 0.5)); // Air Temp * 10
    sensor_values.add(eco2);                                       // CO2
    sensor_values.add(lightMeter.readLightLevel());                 // Light value

    JsonArray sensor_setpoints = doc.createNestedArray("ss");
    sensor_setpoints.add(static_cast<int>(target_ph * 10 + 0.5));
    sensor_setpoints.add(static_cast<int>(target_ec * 100 + 0.5));
    sensor_setpoints.add(static_cast<int>(target_temperature * 10 + 0.5));
    sensor_setpoints.add(target_co2);
    sensor_setpoints.add(target_light);

    JsonArray actuator_values = doc.createNestedArray("av");
    actuator_values.add(digitalRead(WATER_PUMP_RELAY_PIN) == HIGH ? 1 : 0);
    actuator_values.add(digitalRead(PH_RELAY_PIN) == HIGH ? 1 : 0);
    actuator_values.add(digitalRead(NUTRIENTS_RELAY_PIN) == HIGH ? 1 : 0);

    doc["x"] = waterLevelLowAlert ? 1 : 0;
}


void processRPiCommand(const String& jsonCommandString) {
    Serial.print("ESP32: Processing RPi Command: ");
    Serial.println(jsonCommandString);

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, jsonCommandString);

    if (error) {
        Serial.print("ESP32: deserializeJson() failed: "); Serial.println(error.f_str());
        return;
    }

    if (!doc.containsKey("md")) {
        Serial.println("ESP32: Received command from RPi without 'md' (mode) field.");
        return;
    }
    
    int mode_received = doc["md"];

    if (mode_received == 0) { // Auto mode
        ManualMode = false;
        Serial.println("ESP32: Switching to AUTO mode.");
        if (doc.containsKey("cv")) {
            cropVariety = doc["cv"].as<String>();
        }
        if (doc.containsKey("sp")) {
            JsonArray sp = doc["sp"];
            if (!sp.isNull() && sp.size() >= 6) {
                target_ph = sp[0].as<int>() / 10.0;
                target_ec = sp[1].as<int>() / 100.0;
                target_temperature = sp[2].as<int>() / 10.0;
                target_humidity = sp[3].as<int>();
                target_co2 = sp[4].as<int>();
                target_light = sp[5].as<int>();
                Serial.print("ESP32: Updated Setpoints - Crop: "); Serial.println(cropVariety);
                // Print other setpoints for confirmation
            } else {
                Serial.println("ESP32: Auto mode 'sp' (setpoints) field present but invalid or incomplete. Using previous setpoints.");
            }
        } else {
             Serial.println("ESP32: Auto mode command received without 'cv' or 'sp'. Mode switched, using previous setpoints.");
        }
        // TODO: Implement ESP32 auto control logic based on new setpoints
    } else if (mode_received == 1) { // Manual mode
        ManualMode = true;
        Serial.println("ESP32: Switching to/confirming MANUAL mode.");
        if (doc.containsKey("act")) {
            JsonObject act = doc["act"];
            if (act.containsKey("wp")) {
                digitalWrite(WATER_PUMP_RELAY_PIN, act["wp"].as<int>() == 1 ? HIGH : LOW);
                Serial.print("  WP: "); Serial.println(act["wp"].as<int>() == 1 ? "ON" : "OFF");
            }
            if (act.containsKey("phr")) {
                digitalWrite(PH_RELAY_PIN, act["phr"].as<int>() == 1 ? HIGH : LOW);
                Serial.print("  PHR: "); Serial.println(act["phr"].as<int>() == 1 ? "ON" : "OFF");
            }
            if (act.containsKey("nr")) {
                digitalWrite(NUTRIENTS_RELAY_PIN, act["nr"].as<int>() == 1 ? HIGH : LOW);
                Serial.print("  NR: "); Serial.println(act["nr"].as<int>() == 1 ? "ON" : "OFF");
            }
        } else {
            Serial.println("ESP32: Manual mode command received, but no 'act' (actuators) field. Mode switched.");
        }
    } else {
        Serial.println("ESP32: Received unknown mode from RPi.");
    }
}
void sendTelemetryTask() {
    StaticJsonDocument<200> telemetryDoc;
    generateHydroponicsJson(telemetryDoc);
    rakModule.sendJson(telemetryDoc);
}

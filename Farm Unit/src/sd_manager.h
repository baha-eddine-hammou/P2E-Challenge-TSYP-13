#ifndef SD_MANAGER_H
#define SD_MANAGER_H

#include <Arduino.h>
#include <SD.h>
#include <ESP32WebServer.h>

// These externs must be defined in your main sketch
extern ESP32WebServer server;
extern bool SD_present;
extern String webpage;

// Initialize SD card (call in setup)
void SD_init(uint8_t sdPin);

// HTTP endpoint handlers
void SD_dir();
void File_Upload();
void handleFileUpload();

// File operations
void printDirectory(const char* dirname, uint8_t levels);
void SD_file_download(const String& filename);
void SD_file_delete(const String& filename);

// HTML helper functions
void SendHTML_Header();
void SendHTML_Content();
void SendHTML_Stop();

// Error reporting
void ReportSDNotPresent();
void ReportFileNotPresent(const String& target);
void ReportCouldNotCreateFile(const String& target);

// Utility
String file_size(int bytes);

#endif // SD_MANAGER_H
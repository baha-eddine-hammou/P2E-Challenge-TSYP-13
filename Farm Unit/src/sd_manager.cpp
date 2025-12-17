#include "sd_manager.h"
#include <SPI.h>
#include <CSS.h> // for append_page_header(), append_page_footer()

void SD_init(uint8_t sdPin) {
    if (!SD.begin(sdPin)) {
        Serial.println(F("SD card initialization failed"));
        SD_present = false;
    } else {
        Serial.println(F("SD card initialized"));
        SD_present = true;
    }
}

void SD_dir() {
    if (!SD_present) {
        ReportSDNotPresent();
        return;
    }

    // Handle download and delete commands
    if (server.args() > 0) {
        String arg = server.arg(0);
        if (arg.startsWith("download_")) {
            SD_file_download(arg.substring(9));
            return;
        } else if (arg.startsWith("delete_")) {
            SD_file_delete(arg.substring(7));
            return;
        }
    }

    File root = SD.open("/");
    if (!root) {
        SendHTML_Header();
        webpage = "<h3>Cannot open root directory</h3>";
        append_page_footer();
        SendHTML_Content();
        SendHTML_Stop();
        return;
    }

    root.rewindDirectory();
    SendHTML_Header();
    webpage += F("<table align='center'><tr><th>Name</th><th>Type</th><th>Size</th><th>Actions</th></tr>");
    printDirectory("/", 0);
    webpage += F("</table>");
    append_page_footer();
    SendHTML_Content();
    SendHTML_Stop();
    root.close();
}

void File_Upload() {
    append_page_header();
    webpage += F("<h3>Select File to Upload</h3>");
    webpage += F("<form action='/fupload' method='post' enctype='multipart/form-data'>");
    webpage += F("<input type='file' name='fupload'>");
    webpage += F("<button type='submit'>Upload</button>");
    webpage += F("</form><br><a href='/'>Back</a>");
    append_page_footer();
    server.send(200, "text/html", webpage);
    webpage = "";
}

void handleFileUpload() {
    HTTPUpload& upload = server.upload();
    static File uploadFile;

    if (upload.status == UPLOAD_FILE_START) {
        String filename = upload.filename;
        if (!filename.startsWith("/")) filename = "/" + filename;
        SD.remove(filename);
        uploadFile = SD.open(filename, FILE_WRITE);
    } else if (upload.status == UPLOAD_FILE_WRITE) {
        if (uploadFile) uploadFile.write(upload.buf, upload.currentSize);
    } else if (upload.status == UPLOAD_FILE_END) {
        if (uploadFile) {
            uploadFile.close();
            append_page_header();
            webpage += F("<h3>Upload successful</h3><a href='/'>Back</a>");
            append_page_footer();
            server.send(200, "text/html", webpage);
            webpage = "";
        } else {
            ReportCouldNotCreateFile("upload");
        }
    }
}

void printDirectory(const char* dirname, uint8_t levels) {
    File dir = SD.open(dirname);
    if (!dir || !dir.isDirectory()) return;

    File file = dir.openNextFile();
    while (file) {
        webpage += "<tr><td>" + String(file.name()) + "</td>";
        webpage += "<td>" + String(file.isDirectory() ? "Dir" : "File") + "</td>";
        webpage += "<td>" + (file.isDirectory() ? String("—") : file_size(file.size())) + "</td>";

        if (!file.isDirectory()) {
            String name = String(file.name());
            webpage += "<td>";
            webpage += "<form method='post' style='display:inline'>";
            webpage += "<button name='download_' value='" + name + "'>Download</button></form>";
            webpage += "<form method='post' style='display:inline'>";
            webpage += "<button name='delete_' value='" + name + "'>Delete</button></form>";
            webpage += "</td>";
        } else {
            webpage += "<td>—</td>";
        }

        webpage += "</tr>";
        if (file.isDirectory() && levels > 0) printDirectory(file.name(), levels - 1);
        file.close();
        file = dir.openNextFile();
    }
    dir.close();
}

void SD_file_download(const String& filename) {
    if (!SD_present) { ReportSDNotPresent(); return; }
    File file = SD.open("/" + filename);
    if (file) {
        server.sendHeader("Content-Type", "application/octet-stream");
        server.sendHeader("Content-Disposition", "attachment; filename=" + filename);
        server.streamFile(file, "application/octet-stream");
        file.close();
    } else {
        ReportFileNotPresent("download");
    }
}

void SD_file_delete(const String& filename) {
    if (!SD_present) { ReportSDNotPresent(); return; }
    if (SD.remove("/" + filename)) {
        append_page_header();
        webpage += "<h3>Deleted " + filename + "</h3><a href='/'>Back</a>";
        append_page_footer();
        server.send(200, "text/html", webpage);
        webpage = "";
    } else {
        ReportFileNotPresent("delete");
    }
}

void SendHTML_Header() {
    server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    server.sendHeader("Pragma", "no-cache");
    server.sendHeader("Expires", "-1");
    server.setContentLength(CONTENT_LENGTH_UNKNOWN);
    server.send(200, "text/html", "");
    append_page_header();
    server.sendContent(webpage);
    webpage = "";
}

void SendHTML_Content() {
    server.sendContent(webpage);
    webpage = "";
}

void SendHTML_Stop() {
    server.sendContent("");
    server.client().stop();
}

void ReportSDNotPresent() {
    SendHTML_Header();
    webpage += F("<h3>No SD card present</h3><a href='/'>Back</a>");
    append_page_footer();
    SendHTML_Content();
    SendHTML_Stop();
}

void ReportFileNotPresent(const String& target) {
    SendHTML_Header();
    webpage += "<h3>File not found: " + target + "</h3><a href='/'>Back</a>";
    append_page_footer();
    SendHTML_Content();
    SendHTML_Stop();
}

void ReportCouldNotCreateFile(const String& target) {
    SendHTML_Header();
    webpage += "<h3>Could not create file: " + target + "</h3><a href='/'>Back</a>";
    append_page_footer();
    SendHTML_Content();
    SendHTML_Stop();
}

String file_size(int bytes) {
    if (bytes < 1024) return String(bytes) + " B";
    if (bytes < 1024 * 1024) return String(bytes / 1024.0, 2) + " KB";
    if (bytes < (size_t)1024 * 1024 * 1024) return String(bytes / 1024.0 / 1024.0, 2) + " MB";
    return String(bytes / 1024.0 / 1024.0 / 1024.0, 2) + " GB";
}
# P2E-Challenge-TSYP-13 SIGHT ENSIT 
# 🌱 Hydro Firma

Hydro Firma is a smart hydroponic farming solution developed for the **TSYP13 Challenge** P2E **SIGHT – TEMS – SSIT**.  
The system integrates IoT, LoRa communication, Node-RED dashboards, and computer vision to monitor and manage hydroponic farms efficiently.

---

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [The Problem: Polycrisis in Agriculture](#the-problem-polycrisis-in-agriculture)
3. [Our Solution: HydroFirma](#our-solution-hydrofirma)
4. [Key Features](#key-features)
5. [Technical Architecture](#technical-architecture)
    - [Hardware Components](#hardware-components)
    - [Software & Communication Stack](#software--communication-stack)
    - [AI-Powered Pest Detection](#ai-powered-pest-detection)
6. [Repository Structure](#repository-structure)
7. [Getting Started: Setup & Installation](#getting-started-setup--installation)
    - [Prerequisites](#prerequisites)
    - [Hardware Setup](#hardware-setup)
    - [Software Configuration](#software-configuration)
8. [Usage](#usage)
9. [Humanitarian Impact & SDGs](#humanitarian-impact--sdgs)
10. [Business Viability](#business-viability)
11. [Meet the Team](#meet-the-team)
12. [Acknowledgments](#acknowledgments)

---


# HydroFirma: An AI-Powered Smart Hydroponics Ecosystem
<img width="500" height="500" alt="Copy of logo hydrofirma  (1)" src="https://github.com/user-attachments/assets/352fafc5-fc7a-4b1b-887f-53dae13e2183" />


**Empowering farmers in arid regions with an intelligent, water-efficient, and affordable agricultural platform.**



## 1. Project Overview

We live in an era of cascading crises—climate change, resource depletion, and economic instability—collectively termed a "polycrisis." At the heart of these challenges lies agriculture. **HydroFirma** is an integrated, technology-driven solution designed to build resilience in one of the world's most fundamental systems. It is an all-in-one smart hydroponics platform that systematically dismantles the interconnected challenges of water scarcity, soil degradation, pest infestation, and energy dependence.

This project was developed for the **P2E Challenge TSYP 13**, embodying a market-driven solution engineered not merely as a technological novelty, but as a targeted intervention to empower farmers and communities.

## 2. The Problem: Polycrisis in Agriculture

In arid regions like Tunisia, the agricultural sector faces an existential threat:
*   **Catastrophic Water Scarcity:** Agriculture consumes over 80% of freshwater, while resources fall below 500 m³ per person annually.
*   **Soil Degradation:** Unsustainable irrigation has led to erosion and salinity, degrading nearly 40% of arable land.
*   **Pest Infestations:** Warmer climates accelerate the spread of pests, threatening crop yields and food security.
*   **Energy & Cost Barriers:** High operational costs for pumping and machinery make small-scale farming increasingly unsustainable.
*   **Connectivity Issues:** Rural farms often lack reliable internet, rendering most "smart" solutions ineffective.

## 3. Our Solution: HydroFirma

HydroFirma confronts this multifaceted crisis head-on. It is a modular, scalable, and affordable hydroponics ecosystem that leverages IoT, AI, and renewable energy.


By operating as a soilless, closed-loop system, it eradicates reliance on degraded land and **reduces water consumption by up to 90%**. Its intelligent architecture provides farmers with real-time data and automated control, ensuring optimal growth conditions while minimizing resource waste.

## 4. Key Features

*   **💧 Drastic Water Reduction:** Closed-loop hydroponic system minimizes water loss to evaporation.
*   **🧠 Intelligent & Connected:** A central hub monitors and controls multiple farm units, providing a unified dashboard for data-driven insights.
*   **🛰️ Offline First Communication:** Utilizes **LoRa P2P** technology, ensuring robust, long-range communication without reliance on Wi-Fi or cellular networks.
*   **🐞 AI-Powered Pest Detection:** An integrated camera and Computer Vision model detects early signs of pests and disease, enabling proactive, targeted intervention and reducing pesticide use.
*   **☀️ Energy Independence:** Fully compatible with solar panels, enabling off-grid operation and drastically lowering operational costs.
*   **🔧 Modular & Affordable:** Designed to scale from a small family plot to a medium-sized commercial farm, making advanced technology accessible to all.

## 5. Technical Architecture

HydroFirma is built on a distributed network of low-cost, powerful hardware and open-source software.

### Hardware Components

*   **Farm Unit Controller:** **ESP32** for real-time data processing, actuator control, image capture, and LoRa communication.
*   **Central Hub:** **Raspberry Pi 4** for data aggregation, running the AI model, hosting the dashboard, and managing the network.
*   **Communication Module:** **RAK4270 LoRa Module** for reliable, long-range, low-power P2P communication.
*   **Sensors:** Industrial-grade probes for pH, EC, water temperature, and environmental sensors for CO2, light, ambient temperature, and humidity.
*   **Actuators:** 12V DC pumps for nutrient/pH dosing, a main circulation pump

### Software & Communication Stack

*   **Firmware:** C++ on the ESP32, using the `TaskScheduler` library for non-blocking, cooperative multitasking.
*   **Data Protocol:** JSON for structured, lightweight data exchange over LoRa.
*   **Backend (Central Hub):**
    *   **Messaging:** **Mosquitto MQTT Broker** for decoupled, real-time communication between services.
    *   **Data Pipeline:** A Python script bridges LoRa packets to MQTT topics.
    *   **Dashboard & UI:** **Node-RED** for creating a low-code, powerful, and real-time visualization dashboard.

### AI-Powered Pest Detection

The pest detection module is an optional add-on designed for maximum efficiency.
*   **Image Capture:** The ESP32-CAM periodically captures high-resolution images of the crops.
*   **Inference:** Images are sent to the Raspberry Pi, which runs a **PyTorch-based Computer Vision model**.
*   **Pipeline:** The model uses **OpenCV** for color segmentation and morphological operations to isolate leaves. A **ResNet50** backbone then analyzes each leaf to identify anomalies and calculate a "health score."
*   **Alerts:** If a potential issue is detected, an alert is sent to the farmer via the dashboard.

## 6. Repository Structure

The project is composed of three main modules:

1. **Farm Unit (IoT Node)**
2. **Central Hub (Raspberry Pi + Node-RED)**
3. **Plant Health Monitoring System (Camera-Based)**

## 7. Getting Started: Setup & Installation

### Prerequisites

*   **Hardware:**
    *   1x Raspberry Pi 4 (2GB or more)
    *   1x ESP32-CAM Board
    *   2x RAK4270 LoRa Modules
    *   Required sensors and actuators (see full list in the report).
    *   Appropriate power supplies (5V and 12V) or a solar setup.
*   **Software:**
    *   [Arduino IDE](https://www.arduino.cc/en/software) with ESP32 board support.
    *   [Raspberry Pi OS](https://www.raspberrypi.com/software/) flashed on an SD card.
    *   Python 3.x installed on the Raspberry Pi.

### Hardware Setup

1.  **Farm Unit (ESP32):**
    *   Connect all sensors and the RAK4270 module to the ESP32-CAM according to the schematics in the project report.
    *   Ensure all components are securely wired.
2.  **Central Hub (Raspberry Pi):**
    *   Connect the RAK4270 module to the Raspberry Pi's GPIO pins (UART).

### Software Configuration

1.  **Farm Unit Firmware (`Room_Unit.ino`):**
    *   Open the `.ino` file in the Arduino IDE.
    *   Install the required libraries (e.g., `TaskScheduler`, `ArduinoJson`, etc.) via the Library Manager.
    *   Select the correct board ("AI Thinker ESP32-CAM").
    *   Upload the firmware to your ESP32-CAM.
2.  **Central Hub Setup (Raspberry Pi):**
    *   **Install MQTT Broker:**
        ```bash
        sudo apt update && sudo apt install mosquitto mosquitto-clients -y
        sudo systemctl enable mosquitto
        ```
    *   **Install Python Dependencies:**
        ```bash
        pip install paho-mqtt pyserial
        ```
    *   **Install Node-RED:**
        ```bash
        bash <(curl -sL https://raw.githubusercontent.com/node-red/linux-installers/master/deb/update-nodejs-and-nodered)
        ```
        Follow the prompts to install Node-RED and required nodes (`node-red-dashboard`).
    *   **Run the LoRa-MQTT Bridge:**
        ```bash
        python Central_Unit/Lora_Mqtt_Bridge.py
        ```
    *   **Import Node-RED Flow:**
        *   Navigate to your Raspberry Pi's IP address on port `1880`.
        *   Go to the menu -> Import and paste the contents of `Central_Unit/node_red_flow.json`.
        *   Deploy the flow.

## 8. Usage

1.  Power on both the Farm Unit and the Central Hub.
2.  The Farm Unit will begin collecting sensor data and transmitting it via LoRa.
3.  The LoRa-MQTT bridge on the Raspberry Pi will receive the data and publish it to the appropriate MQTT topics.
4.  Open the Node-RED dashboard in your browser (`http://<RASPBERRY_PI_IP>:1880/ui`) to see real-time data visualizations and control the actuators.

## 9. Humanitarian Impact & SDGs

HydroFirma is fundamentally a humanitarian project designed to build resilient communities. It directly contributes to the following UN Sustainable Development Goals:

*   **SDG 2 (Zero Hunger):** Enhances crop productivity and resilience.
*   **SDG 6 (Clean Water):** Promotes radical water efficiency in agriculture.
*   **SDG 7 (Clean Energy):** Integrates renewable energy for sustainable operations.
*   **SDG 13 (Climate Action):** Fosters climate-smart agriculture and strengthens resilience against drought.

## 10. Business Viability

HydroFirma is designed not just as a proof-of-concept but as a viable business. Our model focuses on:
*   **Hardware Sales:** Low-margin, modular kits to ensure accessibility.
*   **Subscription Service:** A tiered monthly fee for access to the AI platform, advanced analytics, and alerts.
*   **Target Market:** Underserved small-to-medium farmers in arid, remote, and off-grid regions.

Financial projections indicate a **74.4% ROI** within the first year, with a **payback period of just 1.3 years**.

## 12. Acknowledgments

We would like to extend our gratitude to the organizers of the **P2E Challenge TSYP 13**, as well as our mentors and partners at **IEEE Tunisia Section** and **Orange Digital Center** for their invaluable support, resources, and guidance throughout this project.

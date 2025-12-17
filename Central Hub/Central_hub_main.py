# rpi_lora_mqtt_bridge.py
import serial
import time
import threading
import json
import paho.mqtt.client as mqtt

# --- RAK4270_RPi Class ---    
class RAK4270_RPi:
    def __init__(self, port, baud_rate):
        self.port = port
        self.baud_rate = baud_rate
        self.serial = None
        self.buffer = ""
        self.stop_thread = False
        self.listener_thread = None
        self.LORA_FREQUENCY_HZ = 869525000
        self.LORA_SF = 7
        self.LORA_BW = 0
        self.LORA_CR = 1
        self.LORA_PREAMBLE = 5
        self.LORA_TX_POWER = 5
        self.mqtt_client = None # MQTT client instance

    def _string_to_hex(self, s):
        return ''.join([hex(ord(c))[2:].zfill(2) for c in s]).upper()

    def _hex_to_string(self, hex_s):
        try:
            if len(hex_s) % 2 != 0: return "HEX_ODD_LEN_ERROR"
            return bytes.fromhex(hex_s).decode('utf-8', errors='replace')
        except ValueError: return "HEX_DECODE_ERROR"
        except Exception as e: return f"HEX_EXCEPTION_ERROR: {e}"

    def _send_at(self, command, expected_response_start="OK", timeout=2.0, silent_success=False, max_lines=10):
        # ... (Your working _send_at method) ...
        if self.serial is None or not self.serial.is_open: return False
        if not silent_success: print(f"RPi -> RAK: {command.strip()}")
        self.serial.reset_input_buffer()
        self.serial.write(command.encode('utf-8') + b'\r\n')
        start_time = time.time(); full_response = ""; lines_received = 0; found_expected = False; current_line = ""
        while (time.time() - start_time) < timeout:
            if self.serial.in_waiting > 0:
                try:
                    byte = self.serial.read(1);
                    if byte:
                        char = byte.decode('utf-8', errors='replace'); current_line += char
                        if char == '\n':
                            line_proc = current_line.strip(); full_response += line_proc + "\n"; lines_received += 1
                            if not silent_success or "ERROR:" in line_proc: print(f"RAK -> RPi: {line_proc}")
                            if line_proc.startswith(expected_response_start): found_expected = True
                            if ("restart" in command or "work_mode:1" in command) and ("Initialization OK" in line_proc or "Current work_mode:P2P" in line_proc):
                                if "Initialization OK" in line_proc and ("P2P" in full_response or "work_mode:1" in command or "restart" in command): found_expected = True
                            elif "ERROR:" in line_proc: found_expected = False; break
                            if found_expected and not ("restart" in command or "work_mode:1" in command): break
                            current_line = ""
                except Exception as e: print(f"RPi-RAK: Err reading serial: {e}"); return False
            if found_expected: break
            if lines_received >= max_lines and not silent_success and not ("restart" in command or "work_mode:1" in command): break
            time.sleep(0.01)
        if not found_expected and current_line.strip().startswith(expected_response_start):
            if not silent_success: print(f"RAK -> RPi (partial_end): {current_line.strip()}")
            found_expected = True
        if not found_expected:
            if not silent_success or "ERROR:" in full_response:
                print(f"Timeout/Unexpected for '{command.strip()}', Expected: '{expected_response_start}'")
                print(f"RAK RPi Full Buffer:\n{full_response.strip() if full_response.strip() else '(empty)'}")
        return found_expected


    def begin(self):
        # ... (Your working begin method) ...
        try:
            self.serial = serial.Serial(self.port, self.baud_rate, timeout=0.1)
            print(f"RPi-RAK: Opened serial port {self.port}")
            time.sleep(1); self.serial.reset_input_buffer()
            if self.serial.in_waiting > 0: print(f"RPi-RAK Initial buffer: {self.serial.read(self.serial.in_waiting).decode('utf-8', errors='replace')}")
            return self._setup_lora_p2p()
        except serial.SerialException as e: print(f"RPi-RAK: Serial Error: {e}"); return False

    def _setup_lora_p2p(self):
        # ... (Your working _setup_lora_p2p method) ...
        print("RPi-RAK: Initializing P2P...")
        if not self._send_at("at+version", "OK V"): return False
        time.sleep(0.5)
        if not self._send_at("at+set_config=lora:work_mode:1", "Current work_mode:P2P", timeout=5.0):
             print("RPi-RAK: Setting P2P mode - expected string might not have been fully caught, but AT command likely succeeded if no ERROR.")
        time.sleep(2.0)
        p2p_cmd = (f"at+set_config=lorap2p:{self.LORA_FREQUENCY_HZ}:{self.LORA_SF}:{self.LORA_BW}:"
                   f"{self.LORA_CR}:{self.LORA_PREAMBLE}:{self.LORA_TX_POWER}")
        if not self._send_at(p2p_cmd, "OK"): return False
        time.sleep(0.2)
        if not self._send_at("at+set_config=lorap2p:transfer_mode:1", "OK"): return False
        print("RPi-RAK: P2P Setup Complete. Receiver mode.")
        return True

    def _set_transfer_mode(self, mode):
        # print(f"RPi-RAK: Attempting to set transfer_mode to {mode}") # Can be noisy
        time.sleep(0.05) 
        # self.serial.reset_input_buffer() # Often good before critical commands
        success = self._send_at(f"at+set_config=lorap2p:transfer_mode:{mode}", 
                                expected_response_start="OK", timeout=1.5, silent_success=True) # Keep silent for frequent use
        # if not success: print(f"RPi-RAK: FAILED to set transfer_mode to {mode}.")
        return success

    def send_json_payload(self, json_data_obj):
        # ... (Your working send_json_payload method) ...
        json_string = json.dumps(json_data_obj, separators=(',', ':')) 
        # print(f"RPi: Attempting to send JSON via LoRa: {json_string}")

        if not self._set_transfer_mode(2): 
            print("RPi-RAK: Critical - Failed to set sender mode. Aborting send.")
            self._set_transfer_mode(1); return False
        
        hex_payload = self._string_to_hex(json_string)
        MAX_HEX_PAYLOAD_CHARS_FOR_AT_CMD = 235 
        if len(hex_payload) > MAX_HEX_PAYLOAD_CHARS_FOR_AT_CMD:
            print(f"Error: HEX Payload ({len(hex_payload)} chars) exceeds AT cmd limit ({MAX_HEX_PAYLOAD_CHARS_FOR_AT_CMD} chars).")
            self._set_transfer_mode(1); return False

        sent_ok = self._send_at(f"at+send=lorap2p:{hex_payload}", "OK", timeout=5.0, silent_success=True) # Make send silent too
        
        time.sleep(0.1) 
        self._set_transfer_mode(1) 
        # if sent_ok: print("RPi-RAK: JSON LoRa send reported OK by RAK.")
        # else: print("RPi-RAK: JSON LoRa send reported FAILED by RAK.")
        return sent_ok

    def _listen_loop(self, mqtt_telemetry_topic): # Pass MQTT client and topic
        print("RPi-RAK: Listener thread started.")
        while not self.stop_thread:
            line_buffer = ""
            if self.serial and self.serial.is_open:
                try:
                    while self.serial.in_waiting > 0:
                        byte = self.serial.read(1)
                        if byte:
                            char = byte.decode('utf-8', errors='replace'); line_buffer += char
                            if char == '\n': break 
                    if line_buffer.endswith('\n'):
                        line = line_buffer.strip()
                        if line.startswith("at+recv="):
                            try:
                                parts = line.split(':'); params_part_full = parts[0]; data_hex = parts[1]
                                params_part = params_part_full.split('=')[1]; params = params_part.split(',')
                                # rssi = params[0]; snr = params[1] # Available if needed
                                
                                compact_json_string = self._hex_to_string(data_hex)
                                if not (compact_json_string.startswith("HEX_") and "ERROR" in compact_json_string):
                                    verbose_json_string = self.reconstruct_to_verbose_json(compact_json_string)
                                    if verbose_json_string and self.mqtt_client:
                                        self.mqtt_client.publish(mqtt_telemetry_topic, verbose_json_string, qos=0)
                                        print(f"RPi-MQTT: Published telemetry to {mqtt_telemetry_topic}")
                                    # else: print(f"RPi-RAK: Reconstructed to: {verbose_json_string}") # For direct print
                                else:
                                    print(f"RPi-RAK: Error decoding HEX from ESP32: {compact_json_string}")
                            except Exception as e_parse: print(f"RPi-RAK: Error parsing at+recv: {e_parse} on line: {line}")
                        # elif line: print(f"RPi-RAK Raw (other): {line}") 
                except serial.SerialException as se: print(f"RPi-RAK: SerialException: {se}"); self.stop_thread = True; break
                except Exception as e_read: print(f"RPi-RAK: Error in listener: {e_read}")
            time.sleep(0.05)
        print("RPi-RAK: Listener thread stopped.")

    def start_listening(self, mqtt_client, mqtt_telemetry_topic):
        if self.listener_thread and self.listener_thread.is_alive(): return
        self.mqtt_client = mqtt_client # Store MQTT client
        self.stop_thread = False
        self.listener_thread = threading.Thread(target=self._listen_loop, args=(mqtt_telemetry_topic,), daemon=True)
        self.listener_thread.start()

    def stop_listening(self):
        # ... (Same stop_listening method)
        print("RPi-RAK: Attempting to stop listener thread...")
        self.stop_thread = True
        if self.listener_thread and self.listener_thread.is_alive(): self.listener_thread.join(timeout=2.0)
        if self.serial and self.serial.is_open: print("RPi-RAK: Closing serial port."); self.serial.close()
        print("RPi-RAK: Listener resources released.")

    def reconstruct_to_verbose_json(self, compact_json_string):
        try:
            compact_data = json.loads(compact_json_string)
            verbose_data = {}
            verbose_data["room_id"] = compact_data.get("i", "ESP_Room_Unknown") 
            verbose_data["mode"] = "auto" if compact_data.get("m") == 0 else "manual"

            verbose_sensors = {}
            compact_sv = compact_data.get("sv", []) 
            compact_ss = compact_data.get("ss", [])
            
            sensor_details = [
                {"name": "pH", "key_v": "ph_v", "key_sp": "ph_sp", "scale": 10.0, "unit": ""},
                {"name": "EC", "key_v": "ec_v", "key_sp": "ec_sp", "scale": 100.0, "unit": ""},
                {"name": "air_temperature", "key_v": "at_v", "key_sp": "at_sp", "scale": 10.0, "unit": "C"},
                {"name": "CO2", "key_v": "co2_v", "key_sp": "co2_sp", "scale": 1.0, "unit": "ppm"},
                {"name": "light", "key_v": "lt_v", "key_sp": "lt_sp", "scale": 1.0, "unit": ""}
            ]

            for i, detail in enumerate(sensor_details):
                s_obj = {}
                if i < len(compact_sv): s_obj["value"] = compact_sv[i] / detail["scale"] if detail["scale"] != 1.0 else compact_sv[i]
                if i < len(compact_ss): s_obj["setpoint"] = compact_ss[i] / detail["scale"] if detail["scale"] != 1.0 else compact_ss[i]
                if s_obj: verbose_sensors[detail["name"]] = s_obj
            
            if verbose_sensors: verbose_data["sensors"] = verbose_sensors

            verbose_actuators = {}
            compact_av = compact_data.get("av", [])
            actuator_names_map = {"wp": "WATER_PUMP", "phr": "PH_RELAY", "nr": "NUTRIENTS_RELAY"} # Assuming ESP sends compact keys for actuators too
            # If ESP sends av as array: [wp_state, phr_state, nr_state]
            actuator_keys_ordered = ["wp", "phr", "nr"] 
            for i, key_compact in enumerate(actuator_keys_ordered):
                if i < len(compact_av) and key_compact in actuator_names_map:
                     verbose_actuators[actuator_names_map[key_compact]] = "ON" if compact_av[i] == 1 else "OFF"
            if verbose_actuators: verbose_data["actuator_status"] = verbose_actuators
            
            verbose_data["alerts"] = {"code": compact_data.get("x", 0)}
            return json.dumps(verbose_data, indent=2)
        except Exception as e:
            print(f"RPi-RAK: Error reconstructing verbose JSON: {e}")
            return None

# --- MQTT Configuration ---
MQTT_BROKER = "localhost" # Or your MQTT broker IP/hostname
MQTT_PORT = 1883
MQTT_TELEMETRY_TOPIC = "hydroponics/room1/telemetry_verbose" # RPi publishes ESP32 data here
MQTT_COMMAND_TOPIC_AUTO = "hydroponics/room1/command/auto"
MQTT_COMMAND_TOPIC_MANUAL_ACTUATOR = "hydroponics/room1/command/actuator" # e.g., actuator/wp payload "ON"

mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id="RPiLoRaBridge")
rpi_rak_device = None # Global for RAK device

# --- MQTT Callbacks ---
def on_mqtt_connect(client, userdata, flags, rc):
    if rc == 0:
        print("RPi-MQTT: Connected to MQTT Broker.")
        client.subscribe(MQTT_COMMAND_TOPIC_AUTO)
        print(f"RPi-MQTT: Subscribed to {MQTT_COMMAND_TOPIC_AUTO}")
        client.subscribe(MQTT_COMMAND_TOPIC_MANUAL_ACTUATOR + "/#") # Subscribe to all subtopics like /wp, /phr
        print(f"RPi-MQTT: Subscribed to {MQTT_COMMAND_TOPIC_MANUAL_ACTUATOR}/#")
    else:
        print(f"RPi-MQTT: Failed to connect, return code {rc}")

def on_mqtt_message(client, userdata, msg):
    global rpi_rak_device
    payload_str = msg.payload.decode()
    print(f"RPi-MQTT: Received message on topic '{msg.topic}': {payload_str}")

    if not rpi_rak_device:
        print("RPi-MQTT: RAK device not initialized, cannot send LoRa command.")
        return

    compact_lora_payload = None
    if msg.topic == MQTT_COMMAND_TOPIC_AUTO:
        try:
            # Node-RED will send the full setpoints JSON for auto mode
            data = json.loads(payload_str) 
            compact_lora_payload = {
                "md": 0, # auto mode
                "cv": data.get("crop_variety", "Unknown"),
                "sp": [
                    int(data.get("setpoints", {}).get("pH", 6.5) * 10),
                    int(data.get("setpoints", {}).get("EC", 1.2) * 100),
                    int(data.get("setpoints", {}).get("temperature", 25) * 10),
                    int(data.get("setpoints", {}).get("humidity", 60)),
                    int(data.get("setpoints", {}).get("CO2", 800)),
                    int(data.get("setpoints", {}).get("light", 300))
                ]
            }
        except Exception as e:
            print(f"RPi-MQTT: Error parsing auto command JSON: {e}")

    elif msg.topic.startswith(MQTT_COMMAND_TOPIC_MANUAL_ACTUATOR + "/"):
        actuator_name_full = msg.topic.split('/')[-1].upper() # e.g., WP -> WATER_PUMP
        actuator_state_str = payload_str.upper()
        
        # Map full names to compact keys used in LoRa JSON
        actuator_compact_map = { "WATER_PUMP": "wp", "PH_RELAY": "phr", "NUTRIENTS_RELAY": "nr" }
        compact_key = actuator_compact_map.get(actuator_name_full)

        if compact_key:
            compact_lora_payload = {
                "md": 1, # manual mode
                "act": {
                    # Initialize all to a default (e.g., 0 for OFF)
                    # Then update the specific one
                    "wp": 0, "phr": 0, "nr": 0 
                }
            }
            compact_lora_payload["act"][compact_key] = 1 if actuator_state_str == "ON" else 0
        else:
            print(f"RPi-MQTT: Unknown actuator name: {actuator_name_full}")

    if compact_lora_payload:
        print(f"RPi-MQTT: Sending LoRa command: {compact_lora_payload}")
        rpi_rak_device.send_json_payload(compact_lora_payload)
    else:
        print(f"RPi-MQTT: No LoRa payload to send for topic {msg.topic}")


# --- Main RPi Application ---
if __name__ == "__main__":
    RAK_SERIAL_PORT_RPI = '/dev/ttyUSB0'  # <<<--- ADJUST THIS
    rpi_rak_device = RAK4270_RPi(RAK_SERIAL_PORT_RPI, 115200)

    mqtt_client.on_connect = on_mqtt_connect
    mqtt_client.on_message = on_mqtt_message
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start() # Start a background thread for MQTT
    except Exception as e:
        print(f"RPi-MQTT: Could not connect to MQTT broker: {e}")
        exit()

    if rpi_rak_device.begin():
        rpi_rak_device.start_listening(mqtt_client, MQTT_TELEMETRY_TOPIC)
        print("RPi LoRa-MQTT Bridge is running. Node-RED can now interact. Press Ctrl+C to exit.")
        try:
            while True:
                time.sleep(10) # Keep main thread alive, can do other tasks here if needed
        except KeyboardInterrupt:
            print("\nRPi: Shutting down bridge...")
        finally:
            mqtt_client.loop_stop()
            mqtt_client.disconnect()
            rpi_rak_device.stop_listening()
    else:
        print("RPi: Failed to initialize RAK4270 device.")
        mqtt_client.loop_stop()
        mqtt_client.disconnect()

    print("RPi script finished.")
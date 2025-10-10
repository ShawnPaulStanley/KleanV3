#include <WiFi.h>
#include <HTTPClient.h>

// ============== USER CONFIGURATION ==============
const char* ssid = "#_#";
const char* password = "Jj#2308$";
// CHANGED: Updated server URL to match our Flask API endpoint
const char* serverName = "http://10.109.242.75:5000/api/dustbin/status";

const int trigPin = 27;
const int echoPin = 26;
const float fullThresholdCm = 25.0; // Bin is full if distance is LESS than this
const int requiredReadings = 5;     // Consecutive readings needed to trigger "full" status
// ==============================================

#define SOUND_SPEED 0.0343

// Global variables
bool isBinFull = false;      // State variable to track if the bin is full
int fullReadingCount = 0;    // Counter for consecutive full readings
// ADDED: Battery level simulation (you can connect to actual battery monitoring)
int batteryLevel = 100;

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// MODIFIED: Updated to send both full and empty status
void sendDustbinStatus(String status, float distance) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    // Calculate capacity percentage based on distance
    int capacityPercentage;
    if (distance < fullThresholdCm) {
      capacityPercentage = 90 + random(0, 10); // 90-100% when full
    } else if (distance < fullThresholdCm * 2) {
      capacityPercentage = 40 + random(0, 44); // 40-84% when partial
    } else {
      capacityPercentage = random(0, 39); // 0-39% when empty
    }

    // CHANGED: Updated JSON payload to match Flask API expectations
    String jsonPayload = "{";
    jsonPayload += "\"dustbin_id\": \"001\","; // Use your preferred dustbin ID
    jsonPayload += "\"status\": \"" + status + "\",";
    jsonPayload += "\"battery_level\": " + String(batteryLevel) + ",";
    jsonPayload += "\"capacity_percentage\": " + String(capacityPercentage);
    jsonPayload += "}";

    Serial.println("Sending: " + jsonPayload);
    
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("HTTP POST successful, response code: ");
      Serial.println(httpResponseCode);
      Serial.println("Response: " + response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected. Cannot send update.");
  }
}

void loop() {
  // --- Measure Distance ---
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH);
  float distanceCm = duration * SOUND_SPEED / 2;

  Serial.print("Distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");

  // --- Main Logic with Consecutive Reading Counter ---
  bool isReadingLow = (distanceCm < fullThresholdCm && distanceCm > 0);

  if (isReadingLow) {
    fullReadingCount++; // Increment the counter for a low reading

    // If we've reached the required number of readings and the bin isn't already marked as full
    if (fullReadingCount >= requiredReadings && !isBinFull) {
      isBinFull = true; // Update state to full
      Serial.println("Threshold reached! Dustbin is confirmed FULL.");
      sendDustbinStatus("full", distanceCm); // Send the update to the server
    }
  } else {
    // The reading is not low, so the sequence is broken
    if (isBinFull) {
      isBinFull = false; // Update state to not full
      Serial.println("Dustbin is no longer full.");
      // ADDED: Send empty status when dustbin becomes empty
      sendDustbinStatus("empty", distanceCm);
    }
    fullReadingCount = 0; // Reset the counter
  }
  
  // ADDED: Simulate battery drain (optional)
  if (random(0, 100) < 1) { // 1% chance per cycle
    batteryLevel = max(70, batteryLevel - 1);
  }
  
  delay(2000); // Wait 2 seconds before the next measurement
}
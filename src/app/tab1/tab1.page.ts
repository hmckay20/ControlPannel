import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonToggle, IonLabel, IonItem } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { fetchWeatherApi } from 'openmeteo';
import { KasaService } from '../services/kasa.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    CommonModule,
    FormsModule,
    IonToggle,
    HttpClientModule,
    IonLabel,
    IonItem
  ],
  providers:[KasaService],
})
export class Tab1Page {

  todayWeather: any = {};  // To store today's hourly weather data
  nextDaysWeather: any = {};  // To store next 6 days' daily weather data
  currentWeather: any = {};
  currentTime: any;
  currentDate: any;
  currentState: string = 'Unknown';
  deviceIds: string[] = [
    '8006A64843AFF7C73CEDB6A5E0C4B3A8227F0A41', // Device 1
    '8006565E452EACD2C78FD8A67A03B2432280B141', // Device 2
    '800616AC49755ACF446114F8C19728FB2280D5F8', // Device 3
  ];
  currentStates: { [key: string]: string } = {}; // Store the state (On/Off) for each device
  constructor(private kasaService: KasaService) {}
  intervalId: any;
  weatherIntervalId: any; // For weather data polling


  params = {
    latitude: 41.236880,
    longitude: -96.070200,
    current: ["temperature_2m", "relative_humidity_2m", "precipitation"],
    daily: ["temperature_2m_max", "temperature_2m_min", "sunset"],
    timezone: "auto",
    temperature_unit: "fahrenheit",
  };
  url = "https://api.open-meteo.com/v1/forecast";

  // Helper function to generate a range of timestamps
  range(start: number, stop: number, step: number) {
    return Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);
  }

  // Fetch and process weather data
  async getWeatherData() {
    try {
      const responses = await fetchWeatherApi(this.url, this.params);

      // Process the first location
      const response = responses[0];
      const current = response.current()!;
      const daily = response.daily()!;
      const utcOffsetSeconds = response.utcOffsetSeconds();

      // Extract today's hourly weather using range
      this.currentWeather = { 
      current: {
        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
        temperature2m: current.variables(0)!.value(),
        relativeHumidity2m: current.variables(1)!.value(),
        precipitation: current.variables(2)!.value(),
      }
    }
      // Extract the next 6 days' daily weather using range
      this.nextDaysWeather = {
        daily: {
          time: this.range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map(
            (t) => new Date((t + utcOffsetSeconds) * 1000)
          ),
          temperature2mMax: daily.variables(0)!.valuesArray(),
          temperature2mMin: daily.variables(1)!.valuesArray(),
          sunset: daily.variables(2)!.valuesArray(),
        },
      };
      const now = new Date();

      // Get the full current date
      
      // Get the full current time


    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  }

  updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString();
    this.currentDate = now.toLocaleDateString();
  }
  ngOnInit() {
    this.getWeatherData();  // Fetch the weather data when the component initializes
    this.updateTime();
    
    // Set intervals to update time and weather data
    setInterval(() => this.updateTime(), 1000);
    
    // Poll weather data every hour (3600000 milliseconds = 1 hour)
    this.weatherIntervalId = setInterval(() => this.getWeatherData(), 3600000);
    this.startPolling();
    this.authenticateAndFetchStates(); 

  }
 // Authenticate and fetch the current state of each device
 authenticateAndFetchStates(): void {
  this.kasaService.authenticateKasa('unique-device-id').subscribe(() => {
    this.deviceIds.forEach((deviceId) => {
      this.getCurrentState(deviceId);
    });
  });
}

// Get the current state of a specific device
getCurrentState(deviceId: string): void {
  this.kasaService.getDeviceState(deviceId).subscribe((response: any) => {
    const relayState = JSON.parse(response.result.responseData).system.get_sysinfo.relay_state;
    this.currentStates[deviceId] = relayState === 1 ? 'On' : 'Off';
  });
}

// Toggle a specific device
toggleDevice(deviceId: string): void {
  const newState = this.currentStates[deviceId] === 'On' ? 0 : 1;
  this.kasaService.controlDevice(deviceId, newState).subscribe(() => {
    this.getCurrentState(deviceId); // Refresh state after the action
  });
}

// Polling method to continuously check device states
startPolling(): void {
  this.intervalId = setInterval(() => {
    this.deviceIds.forEach((deviceId) => {
      this.getCurrentState(deviceId); // Fetch the state of each device every X seconds
    });
  }, 600000); // Poll every 10 seconds (adjust the interval as needed)
}

// Stop polling when the component is destroyed
ngOnDestroy(): void {
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }
}
}
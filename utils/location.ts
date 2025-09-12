export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  address?: string;
}

export class LocationService {
  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const locationData = await this.reverseGeocode(latitude, longitude);
            resolve(locationData);
          } catch (_error) {
            resolve({ latitude, longitude, city: "Your Location", address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}` });
          }
        },
        (error) => {
          console.warn(`Location error: ${error.message}`);
          reject(new Error(`Unable to get location: ${error.message}. Please enable location services.`));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      );
    });
  }

  static async reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1&accept-language=en`,
        { headers: { 'User-Agent': 'beautybook-next-app' } }
      );
      if (!response.ok) throw new Error("Geocoding failed");
      const data = await response.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || data.address?.suburb || data.address?.neighbourhood || "Current Location";
      return { latitude, longitude, city, address: data.display_name || "Unknown location" };
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return { latitude, longitude };
    }
  }
}

import { useState, useEffect } from "react";
import type { WeatherState } from "@/types";

function wmoCondition(code: number): string {
  if (code === 0) return "clear sky";
  if (code <= 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code <= 48) return "foggy";
  if (code <= 55) return "drizzle";
  if (code <= 65) return "rain";
  if (code <= 75) return "snow";
  if (code <= 82) return "showers";
  if (code <= 95) return "thunderstorm";
  return "—";
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherState>(() => ({
    temp: null,
    condition: "",
    location: "",
    status:
      typeof navigator !== "undefined" && navigator.geolocation
        ? "loading"
        : "error",
  }));

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const [wRes, gRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
            ),
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            ),
          ]);
          const wData = await wRes.json();
          const gData = await gRes.json();
          const city =
            gData.address?.city ||
            gData.address?.town ||
            gData.address?.village ||
            gData.address?.county ||
            "—";
          setWeather({
            temp: Math.round(wData.current.temperature_2m),
            condition: wmoCondition(wData.current.weather_code),
            location: city,
            status: "ok",
          });
        } catch {
          setWeather((w) => ({ ...w, status: "error" }));
        }
      },
      () => setWeather((w) => ({ ...w, status: "denied" })),
      { timeout: 10000 }
    );
  }, []);

  return weather;
}

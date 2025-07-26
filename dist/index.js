// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
async function getCityCoordinates(cityName) {
  try {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    const response = await fetch(geocodeUrl);
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      throw new Error("City not found");
    }
    const result = data.results[0];
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      city: result.name,
      country: result.country_code?.toUpperCase() || result.country || "N/A"
    };
  } catch (error) {
    throw new Error(`Failed to get coordinates for ${cityName}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
function getWeatherIcon(weatherCode, isDay) {
  const iconMap = {
    0: { day: "01d", night: "01n" },
    // Clear sky
    1: { day: "01d", night: "01n" },
    // Mainly clear
    2: { day: "02d", night: "02n" },
    // Partly cloudy
    3: { day: "03d", night: "03n" },
    // Overcast
    45: { day: "50d", night: "50n" },
    // Fog
    48: { day: "50d", night: "50n" },
    // Depositing rime fog
    51: { day: "09d", night: "09n" },
    // Light drizzle
    53: { day: "09d", night: "09n" },
    // Moderate drizzle
    55: { day: "09d", night: "09n" },
    // Dense drizzle
    61: { day: "10d", night: "10n" },
    // Slight rain
    63: { day: "10d", night: "10n" },
    // Moderate rain
    65: { day: "10d", night: "10n" },
    // Heavy rain
    71: { day: "13d", night: "13n" },
    // Slight snow
    73: { day: "13d", night: "13n" },
    // Moderate snow
    75: { day: "13d", night: "13n" },
    // Heavy snow
    95: { day: "11d", night: "11n" },
    // Thunderstorm
    96: { day: "11d", night: "11n" },
    // Thunderstorm with slight hail
    99: { day: "11d", night: "11n" }
    // Thunderstorm with heavy hail
  };
  const icons = iconMap[weatherCode] || { day: "01d", night: "01n" };
  return isDay ? icons.day : icons.night;
}
function getWeatherDescription(weatherCode) {
  const descriptions = {
    0: "clear sky",
    1: "mainly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "fog",
    48: "depositing rime fog",
    51: "light drizzle",
    53: "moderate drizzle",
    55: "dense drizzle",
    61: "slight rain",
    63: "moderate rain",
    65: "heavy rain",
    71: "slight snow fall",
    73: "moderate snow fall",
    75: "heavy snow fall",
    95: "thunderstorm",
    96: "thunderstorm with slight hail",
    99: "thunderstorm with heavy hail"
  };
  return descriptions[weatherCode] || "unknown";
}
async function registerRoutes(app2) {
  app2.get("/api/weather", async (req, res) => {
    try {
      const { city, lat, lon } = req.query;
      let latitude;
      let longitude;
      let cityName;
      let countryCode;
      if (city) {
        const geoData = await getCityCoordinates(city);
        latitude = geoData.latitude;
        longitude = geoData.longitude;
        cityName = geoData.city;
        countryCode = geoData.country;
      } else if (lat && lon) {
        latitude = parseFloat(lat);
        longitude = parseFloat(lon);
        cityName = "Current Location";
        countryCode = "N/A";
      } else {
        return res.status(400).json({ message: "Either city name or coordinates (lat, lon) are required" });
      }
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`);
      }
      const weatherData = await weatherResponse.json();
      const current = weatherData.current;
      const daily = weatherData.daily;
      const formatTime = (timeString) => {
        const date = new Date(timeString);
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        });
      };
      const getVisibility = (weatherCode, humidity) => {
        if (weatherCode >= 45 && weatherCode <= 48) return 2;
        if (weatherCode >= 51 && weatherCode <= 65) return 5;
        if (weatherCode >= 71 && weatherCode <= 75) return 3;
        if (humidity > 80) return 8;
        return 10;
      };
      const calculateDewPoint = (temp, humidity) => {
        const a = 17.27;
        const b = 237.7;
        const alpha = a * temp / (b + temp) + Math.log(humidity / 100);
        return b * alpha / (a - alpha);
      };
      const response = {
        city: cityName,
        country: countryCode,
        temperature: Math.round(current.temperature_2m),
        description: getWeatherDescription(current.weather_code),
        icon: getWeatherIcon(current.weather_code, current.is_day === 1),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        pressure: Math.round(current.pressure_msl),
        visibility: getVisibility(current.weather_code, current.relative_humidity_2m),
        uvIndex: Math.round(daily.uv_index_max[0] || 0),
        sunrise: formatTime(daily.sunrise[0]),
        sunset: formatTime(daily.sunset[0]),
        cloudCover: current.cloud_cover,
        dewPoint: Math.round(calculateDewPoint(current.temperature_2m, current.relative_humidity_2m))
      };
      res.json(response);
    } catch (error) {
      console.error("Weather API error:", error);
      if (error instanceof Error && error.message.includes("City not found")) {
        res.status(404).json({ message: "City not found. Please check the spelling and try again." });
      } else {
        res.status(500).json({
          message: error instanceof Error ? error.message : "Failed to fetch weather data"
        });
      }
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(5e3, "127.0.0.1", () => {
    console.log("Server running at http://127.0.0.1:5000");
  });
})();

import axios from "axios";

// ✅ Get current + 5-day forecast together
export async function getWeatherForecast(city) {
  try {
    const key = process.env.WEATHER_API;
    console.log("🔑 WEATHER_API Key:", key);

    // Current weather
    const urlCurr = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=metric`;
    const curr = await axios.get(urlCurr);

    // 5-day forecast
    const urlFore = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${key}&units=metric`;
    const fore = await axios.get(urlFore);

    // ✅ Define severity ranking for weather descriptions
    const severityRank = {
      'clear sky': 1,
      'few clouds': 2,
      'scattered clouds': 3,
      'broken clouds': 4,
      'shower rain': 5,
      'light rain': 6,
      'moderate rain': 7,
      'heavy intensity rain': 8,
      'very heavy rain': 9,
      'extreme rain': 10
    };

    // ✅ Group forecast entries by date
    const groupedForecast = {};
    fore.data.list.forEach(item => {
      const date = item.dt_txt.split(" ")[0];
      if (!groupedForecast[date]) {
        groupedForecast[date] = [];
      }
      groupedForecast[date].push(item);
    });

    // ✅ Pick the strongest condition per day (up to 5 days)
    const forecast = Object.entries(groupedForecast)
      .slice(0, 5)
      .map(([date, entries]) => {
        let topItem = entries[0];
        entries.forEach(item => {
          const currentRank = severityRank[item.weather[0].description] || 0;
          const topRank = severityRank[topItem.weather[0].description] || 0;
          if (currentRank > topRank) topItem = item;
        });

        return {
          date: topItem.dt_txt,
          temp: Math.round(topItem.main.temp),
          feels_like: Math.round(topItem.main.feels_like),
          humidity: topItem.main.humidity,
          wind_speed: topItem.wind.speed,
          pressure: topItem.main.pressure,
          desc: topItem.weather[0].description,
          icon: topItem.weather[0].icon
        };
      });

    // ✅ Return both current and forecast data
    return {
      current: {
        ...curr.data,
        main: {
          ...curr.data.main,
          feels_like: Math.round(curr.data.main.feels_like),
          temp: Math.round(curr.data.main.temp)
        }
      },
      forecast
    };

  } catch (error) {
    console.error("❌ Error fetching weather:", error);
    throw error;
  }
}

// ✅ Only current weather for AI Chatbot (used in processUserMessage)
export async function getWeather(city) {
  try {
    const key = process.env.WEATHER_API;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=metric`;
    const res = await axios.get(url);

    return {
      temp: Math.round(res.data.main.temp),
      desc: res.data.weather[0].description
    };

  } catch (error) {
    console.error("❌ Error fetching current weather:", error);
    throw error;
  }
}

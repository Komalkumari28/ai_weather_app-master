import axios from "axios";

export async function processUserMessage(message, city) {
  console.log("🔔 processUserMessage called with:", { message, city });
  console.log("🔑 OPENROUTER_API_KEY exists:", !!process.env.OPENROUTER_API_KEY);
  
  // Check if API key exists
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("⚠️ No OpenRouter API key found, using fallback response");
    return `Hello from ${city}! I'm your weather assistant. You can ask me about:\n  - Current weather\n  - 5-day forecast\n  - Latest news\n  - Popular attractions\n  - General information about the city`;
  }

  // Helper: detect if the message is about weather
  const isWeatherQuery = (msg) => /weather|temperature|forecast|rain|humidity|wind|pressure|cloud|sun|hot|cold|climate|storm|snow|heat|chill|degree|celsius|fahrenheit|sunny|rainy|cloudy|windy|humid|dry|wet|stormy|fog|mist|drizzle|showers|clear|overcast/i.test(msg);

  let response;
  try {
    if (isWeatherQuery(message)) {
      // Get weather data for weather-related queries
      const weatherResponse = await axios.get(`http://localhost:5000/api/forecast?city=${city}`);
      const weatherData = weatherResponse.data;
      if (!weatherData) {
        return `I'm having trouble getting the weather data for ${city}. Please try again in a moment.`;
      }
      const weatherContext = {
        current: {
          temp: weatherData.current.main.temp,
          feels_like: weatherData.current.main.feels_like,
          humidity: weatherData.current.main.humidity,
          wind: weatherData.current.wind.speed,
          pressure: weatherData.current.main.pressure,
          condition: weatherData.current.weather[0].description
        },
        forecast: weatherData.forecast.map(day => ({
          date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }),
          temp: day.temp,
          condition: day.desc
        }))
      };
      console.log("📤 Sending request to OpenRouter API with weather context...");
      response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a friendly weather assistant. When discussing weather:\n  - Provide natural, conversational responses\n  - Include relevant weather details in a friendly way\n  - Give practical advice based on the weather (e.g., 'You might want to carry an umbrella')\n  - If asked about future weather, focus on the forecast data provided\n  - Keep responses concise but informative\n  - Always use the provided weather data to answer questions`
            },
            {
              role: "user",
              content: `Here's the weather data for ${city}:\nCurrent: ${JSON.stringify(weatherContext.current)}\nForecast: ${JSON.stringify(weatherContext.forecast)}\n\nUser query: \"${message}\". Please provide a natural, conversational response about the weather.`
            }
          ],
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Weather Chat App"
          },
        }
      );
    } else {
      // General assistant for non-weather queries
      console.log("📤 Sending request to OpenRouter API (general assistant)...");
      response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful, friendly assistant for users in ${city}. Answer questions naturally and conversationally. If the user asks about the weather, you may say you can provide weather updates if asked.`
            },
            {
              role: "user",
              content: message
            }
          ],
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Weather Chat App"
          },
        }
      );
    }

    console.log("✅ Response from OpenRouter:", response.data);

    // Extract the reply text from response
    const botReply = response.data.choices?.[0]?.message?.content;
    if (!botReply) {
      console.log("⚠️ No reply content in response");
      return `I'm having trouble generating a response right now. Could you try asking about the weather, news, or attractions in ${city}?`;
    }

    console.log("💬 Bot reply:", botReply);
    return botReply;
  } catch (err) {
    console.error("❌ Error in processUserMessage:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    return `I'm having trouble connecting right now. Would you like to know about the weather, news, or attractions in ${city}?`;
  }
}

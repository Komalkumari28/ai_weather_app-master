import express from "express";
import axios from "axios";
import dotenv from "dotenv";

import Chat from "../models/Chat.js";
import { getWeatherForecast } from "../services/weatherService.js";
import { getNews } from "../services/newsService.js";
import { getSuggestion } from "../services/aiService.js";
import { processUserMessage } from "../services/chatService.js";

dotenv.config();

const router = express.Router();

// ✅ Forecast by City Name
router.get("/forecast", async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: "City not provided" });

  try {
    const { current, forecast } = await getWeatherForecast(city);
    res.json({ current, forecast });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

// ✅ Forecast by Coordinates
router.get("/forecast-by-coords", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "Coordinates missing" });

  try {
    const key = process.env.WEATHER_API;
    const urlCurr = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    const urlFore = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;

    const [curr, fore] = await Promise.all([axios.get(urlCurr), axios.get(urlFore)]);

    const forecast = fore.data.list.slice(0, 5).map(item => ({
      date: item.dt_txt,
      temp: item.main.temp,
      feels_like: item.main.feels_like,
      humidity: item.main.humidity,
      wind_speed: item.wind.speed,
      desc: item.weather[0].description
    }));

    res.json({ current: curr.data, forecast });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weather by coordinates" });
  }
});

// ✅ News by City
router.get("/news", async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: "City not provided" });

  try {
    const news = await getNews(city);
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// ✅ Suggestion by City
router.get("/suggestion", async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: "City not provided" });

  try {
    const { current } = await getWeatherForecast(city);
    const suggestion = getSuggestion(city, current.main.temp, current.weather[0].description);
    res.json({ suggestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch suggestion" });
  }
});

// ✅ AI Chat with save
router.post("/chat", async (req, res) => {
  const { message, city } = req.body;
  if (!message) return res.status(400).json({ error: "Message not provided" });
  if (!city) return res.status(400).json({ error: "City not provided" });

  try {
    console.log("📥 Received chat request:", { message, city });
    const aiReply = await processUserMessage(message, city);
    console.log("📤 Sending chat response:", aiReply);
    res.json({ response: aiReply });
  } catch (err) {
    console.error("❌ AI chat error:", err);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// ✅ Get chats by city name
router.get("/chat", async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: "Name not provided" });

  try {
    const chats = await Chat.find({ name });
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// ✅ Simple AI chat demo
router.post("/chatService", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message not provided" });

  res.json({ reply: `You asked: "${message}". AI will respond soon!` });
});

export default router;

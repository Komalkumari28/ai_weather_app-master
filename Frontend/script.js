const searchInput = document.querySelector(".search-bar input");
const searchBtn = document.querySelector(".search-bar button");
const locationBtn = document.querySelector(".location-btn");
const messageInput = document.querySelector(".chat-input input");
const sendBtn = document.querySelector(".chat-input button");
const chatbox = document.querySelector(".chat-box");

let currentCity = "";

// Event Listeners
sendBtn.addEventListener("click", handleSend);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});

searchBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  if (city) {
    currentCity = city;
    fetchAllData(city);
  }
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetch(`http://localhost:5000/api/forecast-by-coords?lat=${latitude}&lon=${longitude}`)
          .then(res => res.json())
          .then(data => {
            if (!data.current || !data.current.name) {
              addBotMsg("❌ Couldn't get your location weather. Try searching manually.");
              return;
            }
            currentCity = data.current.name;
            fetchAllData(currentCity);
          })
          .catch(err => {
            console.error("Location fetch error:", err);
            addBotMsg("❌ Couldn't get your location weather. Try searching manually.");
          });
      },
      (error) => {
        console.error("Geolocation error:", error);
        addBotMsg("❌ Please allow location access or search manually.");
      }
    );
  } else {
    addBotMsg("❌ Geolocation is not supported.");
  }
});

function fetchAllData(city) {
  Promise.all([
    new Promise(resolve => fetchWeather(city, resolve)),
    new Promise(resolve => fetchSuggestion(city, resolve)),
    new Promise(resolve => fetchNews(city, (newsMsg, newsItems) => resolve({ newsMsg, newsItems })))
  ])
    .then(([weatherMsg, suggestionMsg, { newsMsg, newsItems }]) => {
      addBotMsg(weatherMsg);
      addBotMsg(suggestionMsg);
      addBotMsg(newsMsg);
      newsItems.forEach(item => addBotMsg(item));
      showWelcomeMessage(city);
    })
    .catch(err => {
      console.error("❌ Error fetching data:", err);
      addBotMsg("❌ Failed to fetch data.");
    });
}

function showWelcomeMessage(city) {
  setTimeout(() => {
    addBotMsg(`🌸 Welcome to ${city}! Here's what you can ask me:
      <ul>
        <li>What's the current weather?</li>
        <li>Show me the 5-day forecast</li>
        <li>What's the latest news?</li>
        <li>What are the popular attractions?</li>
        <li>Tell me about the city</li>
      </ul>
      💬 How can I assist you about ${city}?`);
  }, 1500);
}

async function handleSend() {
  const message = messageInput.value.trim();
  if (!message) return;

  addUserMsg(message);
  messageInput.value = "";

  if (!currentCity) {
    addBotMsg("⚠️ Please search a city first to enable weather/news/chat.");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, city: currentCity })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }

    if (data.response) {
      addBotMsg(data.response);
    } else {
      throw new Error("No response from AI");
    }
  } catch (err) {
    console.error("❌ Chat error:", err);
    addBotMsg(`I'm having trouble connecting right now. Would you like to know about the weather, news, or attractions in ${currentCity}?`);
  }
}

function addUserMsg(msg) {
  const div = document.createElement("div");
  div.className = "msg user";
  div.innerHTML = `<i class="fas fa-user"></i> ${msg}`;
  chatbox.appendChild(div);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function addBotMsg(msg) {
  const div = document.createElement("div");
  div.className = "msg bot";
  div.innerHTML = `<i class="fas fa-robot"></i> ${msg}`;
  chatbox.appendChild(div);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function fetchWeather(city, cb) {
  fetch(`http://localhost:5000/api/forecast?city=${city}`)
    .then(res => res.json())
    .then(data => {
      const current = data.current;
      const weatherInfo = document.querySelector(".weather-info");

      weatherInfo.querySelector("h2").textContent = `${current.name}, ${current.sys.country}`;
      const today = new Date();
      weatherInfo.querySelector("p").textContent = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const mainTempRow = weatherInfo.querySelector(".main-temp-row");
      mainTempRow.innerHTML = `
        <span class="weather-icon animated-icon">${getWeatherIcon(current.weather[0].description)}</span>
        <h1>${Math.round(current.main.temp)}°C</h1>
      `;

      weatherInfo.querySelector("p:nth-of-type(2)").textContent = current.weather[0].description;

      const stats = weatherInfo.querySelector(".stats");
      stats.innerHTML = `
        <div><i class="fas fa-droplet animated-icon"></i><br>Humidity<br><strong>${current.main.humidity}%</strong></div>
        <div><i class="fas fa-wind animated-icon"></i><br>Wind<br><strong>${current.wind.speed} km/h</strong></div>
        <div><i class="fas fa-temperature-high animated-icon"></i><br>Feels Like<br><strong>${Math.round(current.main.feels_like)}°C</strong></div>
        <div><i class="fas fa-gauge animated-icon"></i><br>Pressure<br><strong>${current.main.pressure} hPa</strong></div>
      `;

      const daysContainer = document.querySelector(".forecast .days");
      daysContainer.innerHTML = '';
      data.forecast.forEach(day => {
        const date = new Date(day.date);
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card animated-card';
        dayCard.innerHTML = `
          <div>${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          <div class="weather-icon animated-icon">${getWeatherIcon(day.desc)}</div>
          <div>${Math.round(day.temp)}°C</div>
          <div>${day.desc}</div>
        `;
        daysContainer.appendChild(dayCard);
      });

      const sunrise = new Date(current.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const sunset = new Date(current.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const weatherMsg = `
        <b>Weather details for ${city}:</b><br>
        <ul>
          <li><b>Temperature:</b> ${Math.round(current.main.temp)}°C</li>
          <li><b>Feels like:</b> ${Math.round(current.main.feels_like)}°C</li>
          <li><b>Humidity:</b> ${current.main.humidity}%</li>
          <li><b>Wind:</b> ${current.wind.speed} km/h</li>
          <li><b>Pressure:</b> ${current.main.pressure} hPa</li>
          <li><b>Condition:</b> ${current.weather[0].description}</li>
          <li><b>Sunrise:</b> ${sunrise}</li>
          <li><b>Sunset:</b> ${sunset}</li>
        </ul>
      `;
      cb(weatherMsg);
    })
    .catch(err => {
      console.error("Weather fetch error:", err);
      cb("❌ Failed to get weather.");
    });
}

function getWeatherIcon(description) {
  const desc = description.toLowerCase();
  if (desc.includes("rain")) return "🌧️";
  if (desc.includes("cloud")) return "☁️";
  if (desc.includes("clear")) return "☀️";
  if (desc.includes("snow")) return "❄️";
  if (desc.includes("thunder")) return "⛈️";
  if (desc.includes("mist") || desc.includes("fog")) return "🌫️";
  return "🌤️";
}

function fetchSuggestion(city, cb) {
  fetch(`http://localhost:5000/api/suggestion?city=${city}`)
    .then(res => res.json())
    .then(data => {
      const suggestionMsg = `<i class="fas fa-robot"></i> 💡 Top attractions in ${city}:<br><div>${data.suggestion}</div>`;
      cb(suggestionMsg);
    })
    .catch(err => {
      console.error("Suggestion fetch error:", err);
      cb("❌ Failed to get suggestions.");
    });
}

function fetchNews(city, cb) {
  fetch(`http://localhost:5000/api/news?city=${city}`)
    .then(res => res.json())
    .then(newsList => {
      chatbox.querySelectorAll(".news-section").forEach(section => section.remove());
      let newsMsg = `<i class="fas fa-robot"></i> 📰 Latest news in ${city}:`;
      let newsItems = [];
      if (!newsList || newsList.length === 0) {
        newsMsg = `<i class="fas fa-robot"></i> 📰 No news found for ${city}.`;
      } else {
        newsList.forEach(news => {
          const item = `<div class="news-title">${news.title || "No title"}</div><div class="news-description">${news.description || "No description available"}</div><div class="news-meta">${news.link ? `<a href="${news.link}" target="_blank">Read more</a>` : "Link not available"}</div>`;
          newsItems.push(item);
        });
      }
      cb(newsMsg, newsItems);
    })
    .catch(err => {
      console.error("News fetch error:", err);
      cb("❌ Failed to get news.", []);
    });
}

function setupForecastCarousel() {
  const daysContainer = document.querySelector('.forecast .days');
  const leftArrow = document.querySelector('.forecast .left-arrow');
  const rightArrow = document.querySelector('.forecast .right-arrow');
  const cardWidth = 148;
  const visibleCards = 4;
  const totalCards = daysContainer.children.length;
  let currentIndex = 0;
  const maxIndex = Math.max(0, totalCards - visibleCards);

  function updateCarousel() {
    daysContainer.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    leftArrow.disabled = currentIndex === 0;
    rightArrow.disabled = currentIndex === maxIndex;
    leftArrow.style.opacity = currentIndex === 0 ? '0.5' : '1';
    rightArrow.style.opacity = currentIndex === maxIndex ? '0.5' : '1';
  }

  leftArrow.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  });
  rightArrow.addEventListener('click', () => {
    if (currentIndex < maxIndex) {
      currentIndex++;
      updateCarousel();
    }
  });
  updateCarousel();
}

document.addEventListener('DOMContentLoaded', setupForecastCarousel);

import axios from "axios";

export async function getNews(city) {
  const url = `https://newsdata.io/api/1/news?apikey=${process.env.NEWS_API}&q=${city}&language=en`;
  const res = await axios.get(url);
  return res.data.results.slice(0, 5); // latest 5 news
}

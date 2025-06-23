// Free heuristic-based suggestions
export function getSuggestion(city, temp, desc) {
  let msg = `Weather in ${city}: `;
  if (temp > 30) msg += "It's hot — carry water. ";
  if (desc.includes("rain")) msg += "Carry an umbrella. ";
  if (temp < 15) msg += "Wear warm clothes. ";
  return msg;
}

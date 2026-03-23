function formatPlaces(places = []) {
  return places
    .slice(0, 40)
    .map((place, index) => {
      const distance = Number.isFinite(place.distanceFromCenter)
        ? `${Math.round(place.distanceFromCenter)}m`
        : "Unknown distance";

      return `${index + 1}. ${place.name} | ${place.category} | ${distance} | ${place.address}`;
    })
    .join("\n");
}

function buildPrompt(request, places) {
  const placesText = formatPlaces(places);

  return `You are an expert date planner.

Create a date plan based on the following user preferences.

USER:
- Budget: ${request.budget}${request.currency}
- Location: ${request.locationName}
- Mood: ${request.mood}
- Ideas: ${request.ideasForLLM}

AVAILABLE PLACES:
${placesText}

INSTRUCTIONS:
- Select 2 to 4 stops
- Create a logical and enjoyable flow
- Write a very short summary
- Mix variety when possible (e.g cafe, activity, restaurant)
- Prefer places that are reasonably close to each other
- Stay within budget
- Use ONLY places from the AVAILABLE PLACES list above
- NEVER invent, rename, or substitute a place
- Keep the exact name, category, address, latitude, and longitude of each selected place from the provided data
- If there are not enough good options, use fewer stops rather than inventing new ones
- If the list is empty, return an empty stops array

IMPORTANT: Every stop in the JSON must match one place from AVAILABLE PLACES exactly.

OUTPUT FORMAT (JSON):
{
  "title": "...",
  "summary": "...",
  "stops": [
    {
      "name": "...",
      "description": "...",
      "reason": "...",
      "category": "...",
      "address": "...",
      "latitude": 0,
      "longitude": 0,
      "order": 1,
      "estimatedPrice": 0
    }
  ]
}`;
}

module.exports = {
  buildPrompt,
};
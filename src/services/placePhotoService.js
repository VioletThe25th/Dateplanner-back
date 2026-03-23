

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PHOTOS_BASE_URL = "https://places.googleapis.com/v1";

async function fetchPlacePhotoUrl(stop) {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY in environment variables");
  }

  const query = buildQuery(stop);
  const body = {
    textQuery: query,
    maxResultCount: 5,
    languageCode: "en",
  };

  // If we already have coordinates, bias the search around them.
  if (isFiniteNumber(stop?.latitude) && isFiniteNumber(stop?.longitude)) {
    body.locationBias = {
      circle: {
        center: {
          latitude: stop.latitude,
          longitude: stop.longitude,
        },
        radius: 500,
      },
    };
  }

  const response = await fetch(TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": [
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.photos",
      ].join(","),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places Text Search failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const places = Array.isArray(data.places) ? data.places : [];

  if (places.length === 0) {
    return null;
  }

  const bestPlace = chooseBestPlace(stop, places);
  const photoName = bestPlace?.photos?.[0]?.name;

  if (!photoName) {
    return null;
  }

  // Place Photos (New): /v1/NAME/media?maxWidthPx=...
  return `${PHOTOS_BASE_URL}/${photoName}/media?maxWidthPx=1200&key=${GOOGLE_PLACES_API_KEY}`;
}

function buildQuery(stop) {
  const name = safeTrim(stop?.name);
  const address = safeTrim(stop?.address);

  if (name && address) {
    return `${name}, ${address}`;
  }

  return name || address || "";
}

function chooseBestPlace(stop, places) {
  const stopName = normalize(stop?.name);
  const stopAddress = normalize(stop?.address);
  const stopLat = stop?.latitude;
  const stopLon = stop?.longitude;

  const scoredPlaces = places.map((place) => {
    let score = 0;

    const placeName = normalize(place?.displayName?.text);
    const placeAddress = normalize(place?.formattedAddress);

    if (placeName && stopName) {
      if (placeName === stopName) {
        score += 100;
      } else if (placeName.includes(stopName) || stopName.includes(placeName)) {
        score += 60;
      }
    }

    if (placeAddress && stopAddress) {
      if (placeAddress === stopAddress) {
        score += 80;
      } else if (placeAddress.includes(stopAddress) || stopAddress.includes(placeAddress)) {
        score += 40;
      }
    }

    if (
      isFiniteNumber(stopLat) &&
      isFiniteNumber(stopLon) &&
      isFiniteNumber(place?.location?.latitude) &&
      isFiniteNumber(place?.location?.longitude)
    ) {
      const distanceMeters = haversineMeters(
        stopLat,
        stopLon,
        place.location.latitude,
        place.location.longitude
      );

      if (distanceMeters <= 50) {
        score += 50;
      } else if (distanceMeters <= 150) {
        score += 30;
      } else if (distanceMeters <= 300) {
        score += 15;
      }
    }

    if (Array.isArray(place?.photos) && place.photos.length > 0) {
      score += 25;
    }

    return { place, score };
  });

  scoredPlaces.sort((a, b) => b.score - a.score);
  return scoredPlaces[0]?.place ?? null;
}

function normalize(value) {
  return safeTrim(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

module.exports = {
  fetchPlacePhotoUrl,
};
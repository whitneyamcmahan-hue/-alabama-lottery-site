// Address -> Alabama state legislators who can act on lottery/gambling bills.
//
// Step 1: Census Geocoder (free, no API key, US government service) turns an
//         address into lat/lng AND state house/senate district numbers.
// Step 2: If an OPENSTATES_API_KEY is configured, we use it to resolve those
//         districts to actual legislator names, party, and contact info.
//         Free key: https://open.pluralpolicy.com/accounts/signup/
// Step 3: If no key is set (or Open States is unreachable), we fall back to
//         just returning the district numbers plus a link to the official
//         Alabama Legislature lookup, so the feature still works out of the box.

const CENSUS_URL =
  "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";

async function geocodeAndGetDistricts(address) {
  const url = new URL(CENSUS_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("layers", "all");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Census geocoder responded ${res.status}`);
  const data = await res.json();

  const match = data?.result?.addressMatches?.[0];
  if (!match) return null;

  const geographies = match.geographies || {};
  const senate = geographies["State Legislative Districts - Upper"]?.[0];
  const house = geographies["State Legislative Districts - Lower"]?.[0];

  return {
    matchedAddress: match.matchedAddress,
    lat: match.coordinates.y,
    lng: match.coordinates.x,
    senateDistrict: senate?.SLDUST || null,
    houseDistrict: house?.SLDLST || null,
  };
}

async function lookupOpenStates(lat, lng) {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://v3.openstates.org/people.geo");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lng", lng);

  const res = await fetch(url.toString(), {
    headers: { "X-API-KEY": apiKey },
  });
  if (!res.ok) return null;
  const data = await res.json();

  return (data.results || [])
    .filter((p) => p.jurisdiction?.name === "Alabama")
    .map((p) => ({
      name: p.name,
      party: p.party,
      chamber: p.current_role?.org_classification, // "upper" (Senate) or "lower" (House)
      district: p.current_role?.district,
      email: p.email || null,
      contactUrl:
        p.links?.[0]?.url || p.openstates_url || null,
      photoUrl: p.image || null,
    }));
}

export default async function handler(req, res) {
  const address = (req.query.address || "").trim();

  if (!address) {
    res.status(400).json({ error: "Provide ?address=" });
    return;
  }

  try {
    const geo = await geocodeAndGetDistricts(address);

    if (!geo) {
      res.status(404).json({ error: "Could not match that address. Try including city and ZIP." });
      return;
    }

    const legislators = await lookupOpenStates(geo.lat, geo.lng);

    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");

    res.status(200).json({
      matchedAddress: geo.matchedAddress,
      senateDistrict: geo.senateDistrict,
      houseDistrict: geo.houseDistrict,
      legislators, // null if OPENSTATES_API_KEY isn't configured
      fallbackUrl: "https://alison.legislature.state.al.us/districts",
    });
  } catch (err) {
    res.status(500).json({ error: "Lookup failed", detail: err.message });
  }
}

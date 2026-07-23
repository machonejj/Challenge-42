/**
 * FatSecret food-search proxy (server-side, so the OAuth client secret never reaches the browser).
 * Does the OAuth2 client-credentials flow, calls foods.search, and returns a slim JSON list the app
 * maps to FoodItem. Configure via Netlify env vars FATSECRET_CLIENT_ID / FATSECRET_CLIENT_SECRET.
 */
const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const API_URL = 'https://platform.fatsecret.com/rest/server.api';

let cachedToken = null;
let cachedExp = 0;

async function getToken() {
  const id = process.env.FATSECRET_CLIENT_ID;
  const secret = process.env.FATSECRET_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (cachedToken && Date.now() < cachedExp) return cachedToken;
  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });
  if (!res.ok) return null;
  const j = await res.json();
  cachedToken = j.access_token;
  cachedExp = Date.now() + Math.max((j.expires_in || 86400) - 60, 60) * 1000;
  return cachedToken;
}

function num(re, s) {
  const m = re.exec(s);
  return m ? parseFloat(m[1]) : 0;
}

function mapFood(f) {
  const desc = f.food_description || '';
  const cal = /Calories:\s*([\d.]+)\s*kcal/i.exec(desc);
  if (!cal) return null;
  const servingMatch = /^Per\s+(.+?)\s+-/i.exec(desc);
  return {
    id: f.food_id,
    name: f.food_name,
    brand: f.brand_name || null,
    servingLabel: servingMatch ? servingMatch[1] : '1 serving',
    calories: Math.round(parseFloat(cal[1])),
    proteinG: num(/Protein:\s*([\d.]+)\s*g/i, desc),
    carbsG: num(/Carbs:\s*([\d.]+)\s*g/i, desc),
    fatG: num(/Fat:\s*([\d.]+)\s*g/i, desc),
  };
}

function json(obj) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj),
  };
}

export const handler = async (event) => {
  const q = (event.queryStringParameters?.q || '').trim();
  if (q.length < 2) return json({ foods: [] });
  try {
    const token = await getToken();
    if (!token) return json({ foods: [], error: 'not_configured' });
    const url = `${API_URL}?method=foods.search&search_expression=${encodeURIComponent(
      q,
    )}&format=json&max_results=20`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return json({ foods: [] });
    const data = await res.json();
    const list = data?.foods?.food ?? [];
    const arr = Array.isArray(list) ? list : [list];
    return json({ foods: arr.map(mapFood).filter(Boolean) });
  } catch {
    return json({ foods: [] });
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { destination, days, pax, dateFrom, dateTo } = req.body;

  if (!destination || !days || !pax) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const dateContext =
    dateFrom && dateTo ? ` from ${dateFrom} to ${dateTo}` : "";

  const prompt = `You are a South African travel planner. Build a ${days}-day itinerary for ${pax} traveller(s) visiting ${destination}${dateContext}. Respond ONLY with valid JSON, no markdown, no preamble. Schema:
{"summary":"one vivid sentence","days":[{"day":1,"title":"short title","items":[{"time":"Morning","activity":"name","note":"1 short tip"}]}]}
Give 3 items per day (Morning/Afternoon/Evening). Keep notes under 12 words. Be specific to ${destination}.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1200, temperature: 0.7 },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res
        .status(response.status)
        .json({ error: err.error?.message || "Gemini API error" });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const itinerary = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json(itinerary);
  } catch (e) {
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
}

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

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are a South African travel planner. Build a ${days}-day itinerary for ${pax} traveller(s) visiting ${destination}${dateContext}. Respond ONLY with valid JSON, no markdown, no preamble. Schema:
{"summary":"one vivid sentence","days":[{"day":1,"title":"short title","items":[{"time":"Morning","activity":"name","note":"1 short tip"}]}]}
Give 3 items per day (Morning/Afternoon/Evening). Keep notes under 12 words. Be specific to ${destination}.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res
        .status(response.status)
        .json({ error: err.error?.message || "Anthropic API error" });
    }

    const data = await response.json();
    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    const itinerary = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json(itinerary);
  } catch (e) {
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
}

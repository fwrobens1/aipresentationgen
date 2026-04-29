import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_WIDTH = 800;
const MIN_HEIGHT = 500;

/* ======================================================
   IMAGE HELPERS
====================================================== */

async function getImageDimensions(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") || "";
    return contentType.startsWith("image/");
  } catch {
    return false;
  }
}

async function searchDuckDuckGoImages(query: string, count = 5) {
  try {
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=["']([^"']+)["']/);
    if (!vqdMatch) return [];

    const vqd = vqdMatch[1];

    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(
        query
      )}&vqd=${vqd}&f=size:Large,,,,,&p=1`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://duckduckgo.com/",
        },
      }
    );

    const imgData = await imgRes.json();
    const results = imgData.results || [];

    return results
      .filter((r: any) => r.width >= MIN_WIDTH && r.height >= MIN_HEIGHT)
      .slice(0, count)
      .map((r: any) => r.image || r.thumbnail);
  } catch {
    return [];
  }
}

async function validateAndPickBestImage(query: string): Promise<string | null> {
  const candidates = await searchDuckDuckGoImages(
    `high resolution professional ${query}`,
    5
  );

  for (const url of candidates) {
    const valid = await getImageDimensions(url);
    if (valid) return url;
  }

  return null;
}

/* ======================================================
   GEMINI HELPERS
====================================================== */

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
if (!GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not configured");
}

async function generateWithGemini(prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  );
}

async function verifyImageWithAI(
  imageUrl: string,
  expectedTopic: string
): Promise<boolean> {
  try {
    const prompt = `
Is this image high quality and relevant to the topic "${expectedTopic}"?
Reply with ONLY "yes" or "no".

Image URL: ${imageUrl}
`;

    const text = await generateWithGemini(prompt);
    return text.toLowerCase().includes("yes");
  } catch {
    return true; // Don't block on failures
  }
}

/* ======================================================
   SYSTEM PROMPT
====================================================== */

const SYSTEM_PROMPT = `
You are SlideAI, an expert presentation designer.

Return ONLY valid JSON.

Schema:
{
  "title": "string",
  "slides": [
    {
      "id": "string",
      "title": "string",
      "subtitle": "string (optional)",
      "content": "string (optional)",
      "bulletPoints": ["string"] (optional),
      "imageQuery": "string (optional)",
      "layout": "title" | "content" | "image-left" | "image-right" | "full-image",
      "notes": "string (optional)"
    }
  ]
}

Rules:
- 6–10 slides
- First slide layout "title"
- Last slide layout "title"
- Use varied layouts
- Insightful, concise bullet points
- Highly specific image queries
`;

/* ======================================================
   EDGE FUNCTION
====================================================== */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid prompt" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    /* ------------------------------
       GENERATE PRESENTATION
    ------------------------------ */

    const raw = await generateWithGemini(
      `${SYSTEM_PROMPT}\n\nUser Prompt:\n${prompt}`
    );

    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let presentation;
    try {
      presentation = JSON.parse(cleaned);
    } catch {
      console.error("Invalid JSON from AI:", cleaned);
      return new Response(
        JSON.stringify({ error: "AI returned invalid format" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    /* ------------------------------
       IMAGE FETCH + VERIFY
    ------------------------------ */

    if (presentation.slides) {
      await Promise.all(
        presentation.slides.map(async (slide: any) => {
          if (slide.imageQuery) {
            let imageUrl = await validateAndPickBestImage(
              slide.imageQuery
            );

            if (imageUrl) {
              const isGood = await verifyImageWithAI(
                imageUrl,
                slide.imageQuery
              );

              if (!isGood) {
                imageUrl = null;
              }
            }

            slide.imageUrl = imageUrl;
            delete slide.imageQuery;
          }
        })
      );
    }

    return new Response(JSON.stringify(presentation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-slides error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

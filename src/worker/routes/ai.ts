import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";

interface BuildingInfo {
  lat: number;
  lon: number;
  building_type: string;
  name?: string;
  addr_street?: string;
  addr_housenumber?: string;
  addr_city?: string;
  height?: number;
  levels?: number;
  tags: Record<string, string>;
}

interface AIEnv {
  OPENAI_API_KEY?: string;
}

const app = new Hono<{ Bindings: AIEnv }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type",
      "X-OpenAI-Key",
      "X-Gemini-Key",
      "X-HuggingFace-Key",
      "X-Ollama-Key",
    ],
    allowMethods: ["POST", "GET", "OPTIONS"],
  })
);

app.post("/building-info", async (c) => {
  try {
    const { building }: { building: BuildingInfo } = await c.req.json();

    const headerKey = c.req.header("x-openai-key")?.trim();
    const apiKey = headerKey || c.env.OPENAI_API_KEY;

    if (!apiKey) {
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }

    const client = new OpenAI({
      apiKey,
    });

    // Create a detailed prompt about the building
    const buildingContext = createBuildingContext(building);
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert urban researcher and storyteller. Generate engaging, informative descriptions of buildings based on their properties and location. Focus on architectural details, historical context, and interesting facts. Keep responses between 80-120 words. Be creative but plausible.`
        },
        {
          role: "user",
          content: buildingContext
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const description = response.choices[0]?.message?.content || "A building in the urban landscape.";
    
    // Generate a catchy name if none exists
    const nameResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Generate a creative, memorable name for a building based on its type and characteristics. Return only the name, nothing else. Keep it under 25 characters."
        },
        {
          role: "user",
          content: `Building type: ${building.building_type}. ${building.name ? `Existing name: ${building.name}` : 'No existing name.'} Location context: ${buildingContext}`
        }
      ],
      max_tokens: 50,
      temperature: 0.8,
    });

    const generatedName = nameResponse.choices[0]?.message?.content?.trim() || 
                          building.name || 
                          capitalizeWords(building.building_type);

    return c.json({
      name: generatedName,
      description,
      original_tags: building.tags
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return c.json({ 
      error: "Failed to generate building information",
      name: "Unknown Building",
      description: "A unique structure in the urban environment, contributing to the city's architectural diversity."
    }, 500);
  }
});

function createBuildingContext(building: BuildingInfo): string {
  const parts = [];
  
  parts.push(`Building type: ${building.building_type}`);
  
  if (building.name) {
    parts.push(`Name: ${building.name}`);
  }
  
  if (building.addr_street) {
    parts.push(`Address: ${[building.addr_housenumber, building.addr_street, building.addr_city].filter(Boolean).join(' ')}`);
  }
  
  if (building.height) {
    parts.push(`Height: ${building.height}m`);
  } else if (building.levels) {
    parts.push(`Levels: ${building.levels}`);
  }
  
  // Add interesting tags
  const interestingTags = ['amenity', 'shop', 'cuisine', 'denomination', 'operator', 'brand', 'historic'];
  for (const tag of interestingTags) {
    if (building.tags[tag]) {
      parts.push(`${capitalizeWords(tag)}: ${building.tags[tag]}`);
    }
  }
  
  return parts.join('. ') + '.';
}

function capitalizeWords(str: string): string {
  return str.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export default app;

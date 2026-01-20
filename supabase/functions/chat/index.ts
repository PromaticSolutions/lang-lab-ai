import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de idiomas para prompts contextuais
const languageConfig: Record<string, { name: string; instruction: string }> = {
  english: {
    name: "English",
    instruction: "Respond ONLY in English. Help the user practice English conversation.",
  },
  spanish: {
    name: "Spanish", 
    instruction: "Respond ONLY in Spanish (Español). Help the user practice Spanish conversation.",
  },
  french: {
    name: "French",
    instruction: "Respond ONLY in French (Français). Help the user practice French conversation.",
  },
  italian: {
    name: "Italian",
    instruction: "Respond ONLY in Italian (Italiano). Help the user practice Italian conversation.",
  },
  german: {
    name: "German",
    instruction: "Respond ONLY in German (Deutsch). Help the user practice German conversation.",
  },
};

// Prompts de cenário (agora genéricos, idioma será adicionado dinamicamente)
const scenarioPrompts: Record<string, string> = {
  restaurant: `You are an experienced and polite waiter at a sophisticated restaurant. Keep the conversation natural about food orders, drinks, menu recommendations and customer service.`,
  interview: `You are a professional HR interviewer at a large company. Ask typical job interview questions, evaluate answers and give implicit feedback. Be professional but welcoming.`,
  hotel: `You are a 5-star hotel receptionist. Help with check-in, check-out, reservations, room service and hotel information. Be courteous and helpful.`,
  airport: `You are an airport agent working at check-in or immigration. Ask questions about documents, luggage, destination and security procedures. Be professional.`,
  shopping: `You are a salesperson at a clothing or department store. Help customers find products, discuss sizes, prices, colors and make suggestions. Be friendly and helpful.`,
  business: `You are an executive in a business meeting. Discuss projects, goals, results and strategies professionally. Use corporate vocabulary.`,
  hospital: `You are a doctor or nurse at a hospital. Ask about symptoms, medical history, make simple diagnoses and give recommendations. Be empathetic and professional.`,
  transport: `You are a ride-share driver (Uber/Lyft). Talk about destination, preferred route, traffic conditions and make small talk. Be friendly.`,
};

// Instruções de nível adaptativo
const levelInstructions: Record<string, string> = {
  basic: "The user is a beginner. Use simple phrases, basic vocabulary and speak slowly. Correct errors gently. Avoid complex grammar.",
  intermediate: "The user has intermediate level. Use moderately complex phrases and varied vocabulary. Introduce some idiomatic expressions.",
  advanced: "The user is advanced. Use idiomatic expressions, sophisticated vocabulary and complex structures. Challenge them with nuanced language.",
};

// Instruções de nível adaptativo avançado (baseado em desempenho)
const adaptiveLevelInstructions: Record<string, string> = {
  A1: "Absolute beginner. Use only the most basic words and very short sentences. Avoid any complex structures.",
  A2: "Elementary level. Use simple everyday vocabulary and basic sentence patterns. Keep it very accessible.",
  B1: "Lower intermediate. Can handle familiar situations. Use clear standard language with some variety.",
  B2: "Upper intermediate. Good command of the language. Use more complex structures and wider vocabulary.",
  C1: "Advanced. Use sophisticated language, idioms, and subtle nuances. Challenge them intellectually.",
  C2: "Near-native. Use the full range of the language naturally, including humor and cultural references.",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHAT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, scenarioId, userLevel, userLanguage, adaptiveLevel } = await req.json();
    logStep("Request received", { scenarioId, userLevel, userLanguage, adaptiveLevel, messageCount: messages?.length });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Configuração do idioma (padrão: inglês)
    const language = userLanguage || 'english';
    const langConfig = languageConfig[language] || languageConfig.english;
    
    // Contexto do cenário
    const scenarioContext = scenarioPrompts[scenarioId] || "You are a helpful language assistant. Help the user practice conversation.";
    
    // Instruções de nível (usa nível adaptativo se disponível)
    const levelInstruction = adaptiveLevel && adaptiveLevelInstructions[adaptiveLevel]
      ? adaptiveLevelInstructions[adaptiveLevel]
      : levelInstructions[userLevel as keyof typeof levelInstructions] || levelInstructions.intermediate;

    const systemPrompt = `${langConfig.instruction}

SCENARIO: ${scenarioContext}

USER LEVEL: ${levelInstruction}

CRITICAL INSTRUCTIONS:
- You MUST respond ONLY in ${langConfig.name}. Never switch to another language.
- Keep responses short (1-3 sentences) to simulate natural conversation.
- Ask questions to keep the conversation flowing.
- If the user makes errors, continue naturally (corrections will be in feedback).
- Stay strictly in the scenario context.
- Be encouraging and patient.
- Adapt your vocabulary and complexity to the user's level.`;

    logStep("System prompt configured", { language, scenarioId, level: adaptiveLevel || userLevel });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Atualize seu plano." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      logStep("AI gateway error", { status: response.status, error: errorText });
      throw new Error("AI gateway error");
    }

    logStep("Streaming response");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

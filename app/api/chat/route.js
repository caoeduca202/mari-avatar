import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- Funções de Pesquisa (Tools) ---
async function searchWikipedia(query) {
  try {
    const res = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
    const data = await res.json();
    if (data.query.search.length > 0) {
      const pageId = data.query.search[0].pageid;
      const res2 = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&pageids=${pageId}&format=json&origin=*`);
      const data2 = await res2.json();
      return data2.query.pages[pageId].extract;
    }
    return "Não encontrei informações na Wikipedia sobre isso.";
  } catch (e) {
    return "Erro ao acessar a Wikipedia.";
  }
}

async function getWeather() {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=-19.53&longitude=-40.63&current_weather=true`);
    const data = await res.json();
    const w = data.current_weather;
    return `Tempo atual em Colatina (Sede): ${w.temperature}°C, vento a ${w.windspeed}km/h.`;
  } catch (e) {
    return "Erro ao acessar a previsão do tempo.";
  }
}

function getCardapio() {
  return "Cardápio do dia: Arroz, feijão, frango assado e salada de alface. Sobremesa: Maçã.";
}

function getAgenda() {
  return "Agenda de hoje: Feira de Ciências durante a manhã e Reunião às 18h30.";
}

const tools = [
  {
    type: "function",
    function: {
      name: "search_wikipedia",
      description: "Pesquisa na Wikipedia por fatos, eventos, pessoas ou conceitos complexos que a Mari não sabe.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "O termo a ser pesquisado" } },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Obtém a previsão do tempo atual local (Colatina-ES). Use quando perguntarem sobre o clima ou temperatura.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_cardapio",
      description: "Obtém o cardápio ou menu do dia atual.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_agenda",
      description: "Obtém os eventos e reuniões agendados para hoje.",
      parameters: { type: "object", properties: {} }
    }
  }
];

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const systemPrompt = {
      role: 'system',
      content: 'Você é a Mari, uma assistente virtual e avatar 3D que representa a empresa Santa Maria. O site/portal oficial da empresa é https://portal.elfsm.com.br/ (sempre indique este site quando perguntarem onde acessar os serviços da empresa). Seja sempre educada, prestativa, concisa, amigável e extremamente profissional. Você deve conversar em português de forma natural. Utilize as ferramentas disponíveis para obter informações em tempo real quando necessário (ex: previsão do tempo, wikipedia).'
    };
    
    let chatMessages = [systemPrompt, ...messages];

    let chatCompletion = await groq.chat.completions.create({
      messages: chatMessages,
      model: 'qwen/qwen3.8-27b',
      temperature: 0.7,
      max_tokens: 512,
      top_p: 1,
      stream: false,
      tools: tools,
      tool_choice: "auto"
    });

    let responseMsg = chatCompletion.choices[0].message;

    // Verifica se o modelo decidiu chamar uma ferramenta
    if (responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
      chatMessages.push(responseMsg);

      for (const toolCall of responseMsg.tool_calls) {
        const funcName = toolCall.function.name;
        let args = {};
        try { args = JSON.parse(toolCall.function.arguments || '{}'); } catch(e){}
        let funcResult = "";

        if (funcName === "search_wikipedia") {
          funcResult = await searchWikipedia(args.query);
        } else if (funcName === "get_weather") {
          funcResult = await getWeather();
        } else if (funcName === "get_cardapio") {
          funcResult = getCardapio();
        } else if (funcName === "get_agenda") {
          funcResult = getAgenda();
        }

        chatMessages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: funcName,
          content: funcResult
        });
      }

      // Segunda chamada com os resultados das ferramentas
      chatCompletion = await groq.chat.completions.create({
        messages: chatMessages,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.7,
        max_tokens: 512,
      });

      responseMsg = chatCompletion.choices[0].message;
    }

    const reply = responseMsg.content;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Groq Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

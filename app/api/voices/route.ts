import { NextResponse } from "next/server"

// Lista de vozes estáticas para usar em caso de falha na API
const fallbackVoices = [
  {
    voice_id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel (Inglês)",
    preview_url: "https://storage.googleapis.com/elevenlabs-samples/rachel.wav"
  },
  {
    voice_id: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi (Inglês)",
    preview_url: "https://storage.googleapis.com/elevenlabs-samples/domi.wav"
  },
  {
    voice_id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella (Inglês)",
    preview_url: "https://storage.googleapis.com/elevenlabs-samples/bella.wav"
  },
  {
    voice_id: "ErXwobaYiN019PkySvjV",
    name: "Antoni (Inglês)",
    preview_url: "https://storage.googleapis.com/elevenlabs-samples/antoni.wav"
  },
  {
    voice_id: "MF3mGyEYCl7XYWbV9V6O",
    name: "Elli (Inglês)",
    preview_url: "https://storage.googleapis.com/elevenlabs-samples/elli.wav"
  },
  {
    voice_id: "TxGEqnHWrfWFTfGW9XjX",
    name: "Josh (Inglês)",
    preview_url: "https://storage.googleapis.com/elevenlabs-samples/josh.wav"
  },
  {
    voice_id: "VR6AewLTigWG4xSOukaG",
    name: "Arnold (Inglês)",
    preview_url: "https://storage.googleapis.com/elevenlabs-samples/arnold.wav"
  },
  {
    voice_id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam (Inglês)",
    preview_url: "https://storage.googleapis.com/elevenlabs-samples/adam.wav"
  },
  {
    voice_id: "yoZ06aMxZJJ28mfd3POQ",
    name: "Sam (Inglês)",
    preview_url: "https://storage.googleapis.com/elevenlabs-samples/sam.wav"
  }
];

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY || "";
    
    // Log para depuração (será exibido no console do servidor)
    console.log("Usando chave de API:", apiKey ? "Chave definida (primeiros caracteres): " + apiKey.substring(0, 5) + "..." : "Chave não definida");
    
    const options = {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", options)

    if (!response.ok) {
      console.error("Erro na API ElevenLabs:", response.status, response.statusText);
      console.log("Usando vozes de fallback devido a erro na API");
      // Retornar lista de vozes estáticas em caso de falha
      return NextResponse.json({ 
        voices: fallbackVoices,
        message: "Usando vozes de fallback devido a problemas com a API"
      })
    }

    const data = await response.json()
    return NextResponse.json({ voices: data.voices })
  } catch (error) {
    console.error("Erro ao buscar vozes:", error)
    
    // Retornar lista de vozes estáticas em caso de exceção
    return NextResponse.json({ 
      voices: fallbackVoices,
      message: "Usando vozes de fallback devido a erro na conexão com a API"
    })
  }
}

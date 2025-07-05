import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, voice_id, language, speaking_rate } = await request.json()

    if (!text || !voice_id) {
      return NextResponse.json({ error: "Texto e ID da voz são obrigatórios" }, { status: 400 })
    }

    // Limitar o texto a 1000 caracteres
    const trimmedText = text.slice(0, 1000)

    // Garantir que a velocidade esteja dentro dos limites aceitos pela API (0.7 a 1.2)
    let validSpeed = 1.0 // valor padrão
    if (speaking_rate !== undefined) {
      // Limitar o valor entre 0.7 e 1.2
      validSpeed = Math.max(0.7, Math.min(1.2, speaking_rate))
    }

    console.log("Velocidade ajustada:", validSpeed)
    
    const apiKey = process.env.ELEVENLABS_API_KEY || "";
    console.log("Chave API definida:", !!apiKey);
    
    // Verificar se a chave de API existe
    if (!apiKey) {
      console.error("Chave de API não configurada");
      return NextResponse.json({
        error: "Chave de API do ElevenLabs não configurada",
        useFallback: true
      }, { status: 401 });
    }

    // Parâmetros para a API do ElevenLabs
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: trimmedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          speed: validSpeed, // Usando o valor validado
        },
      }),
    }

    // Log do corpo da requisição para depuração
    console.log("Corpo da requisição:", JSON.parse(options.body))

    try {
      // Chamada para a API do ElevenLabs
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, options)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Erro na API do ElevenLabs:", errorData)
        console.error("Status:", response.status, response.statusText)

        // Verificar se é o erro específico de limite de API
        if (errorData?.detail?.status === "detected_unusual_activity") {
          return NextResponse.json(
            {
              error: "Limite da API atingido. O plano gratuito do ElevenLabs está temporariamente indisponível.",
              details: errorData,
              useFallback: true
            },
            { status: 429 } // Usando 429 Too Many Requests como código de status
          )
        }

        // Para qualquer erro da API, recomendamos usar o modo de demonstração
        return NextResponse.json(
          {
            error: "Falha ao gerar áudio. Tente o modo de demonstração.",
            details: errorData,
            useFallback: true
          },
          { status: response.status }
        )
      }

      // Obter o áudio como ArrayBuffer
      const audioBuffer = await response.arrayBuffer()

      // Converter para Base64 para enviar ao cliente
      const base64Audio = Buffer.from(audioBuffer).toString("base64")
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`

      return NextResponse.json({
        audioUrl,
        appliedSettings: {
          speed: validSpeed,
          voice_id: voice_id,
        },
      })
    } catch (fetchError) {
      console.error("Erro na chamada à API:", fetchError);
      return NextResponse.json({
        error: "Erro na comunicação com a API do ElevenLabs. Tente o modo de demonstração.",
        useFallback: true
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor. Tente o modo de demonstração.",
      useFallback: true 
    }, { status: 500 })
  }
}

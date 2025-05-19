import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, voice_id, speaking_rate } = await request.json()

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

    // Parâmetros para a API do ElevenLabs
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
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

    // Chamada para a API do ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, options)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Erro na API do ElevenLabs:", errorData)

      // Verificar se é o erro específico de limite de API
      if (errorData?.detail?.status === "detected_unusual_activity") {
        return NextResponse.json(
          {
            error: "Limite da API atingido. O plano gratuito do ElevenLabs está temporariamente indisponível.",
            details: errorData,
          },
          { status: 429 }, // Usando 429 Too Many Requests como código de status
        )
      }

      return NextResponse.json(
        {
          error: "Falha ao gerar áudio",
          details: errorData,
        },
        { status: response.status },
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
  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

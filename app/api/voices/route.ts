import { NextResponse } from "next/server"

export async function GET() {
  try {
    const options = {
      method: "GET",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      },
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", options)

    if (!response.ok) {
      return NextResponse.json({ error: "Falha ao buscar vozes" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ voices: data.voices })
  } catch (error) {
    console.error("Erro ao buscar vozes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

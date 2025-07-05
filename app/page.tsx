"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Download, Volume2, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Voice {
  voice_id: string
  name: string
}

interface Language {
  code: string
  name: string
}

interface AppliedSettings {
  speed: number
  voice_id: string
}

// Simulação de áudio para demonstração quando a API estiver indisponível
const DEMO_TEXT = {
  "pt-br": "Este é um áudio de demonstração em português. A API do ElevenLabs está temporariamente indisponível.",
  "en-us": "This is a demo audio in English. The ElevenLabs API is temporarily unavailable.",
  "es-es": "Este es un audio de demostración en español. La API de ElevenLabs no está disponible temporalmente.",
  "fr-fr": "Ceci est un audio de démonstration en français. L'API ElevenLabs est temporairement indisponible.",
  "de-de": "Dies ist ein Demo-Audio auf Deutsch. Die ElevenLabs-API ist vorübergehend nicht verfügbar.",
  "it-it": "Questo è un audio dimostrativo in italiano. L'API ElevenLabs è temporaneamente non disponibile.",
}

export default function TextToSpeech() {
  const [text, setText] = useState("")
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState("")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiLimitReached, setApiLimitReached] = useState(false)
  const [characterCount, setCharacterCount] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [languages, setLanguages] = useState<Language[]>([
    { code: "pt-br", name: "Português (Brasil)" },
    { code: "en-us", name: "English (US)" },
    { code: "es-es", name: "Español" },
    { code: "fr-fr", name: "Français" },
    { code: "de-de", name: "Deutsch" },
    { code: "it-it", name: "Italiano" },
  ])
  const [selectedLanguage, setSelectedLanguage] = useState("pt-br")
  const [speakingRate, setSpeakingRate] = useState(1.0)
  const [appliedSettings, setAppliedSettings] = useState<AppliedSettings | null>(null)
  const [useDemoMode, setUseDemoMode] = useState(false)

  // Buscar vozes disponíveis ao carregar o componente
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/voices")
        if (!response.ok) {
          throw new Error("Falha ao buscar vozes")
        }
        const data = await response.json()
        
        if (data.voices && data.voices.length > 0) {
          setVoices(data.voices)
          setSelectedVoice(data.voices[0].voice_id)
          
          // Verificar se estamos usando vozes de fallback
          if (data.message && data.message.includes("fallback")) {
            console.log("Usando vozes de fallback devido a problema com a API")
            setUseDemoMode(true) // Ativar automaticamente o modo de demonstração
            setApiLimitReached(true)
          }
        } else {
          throw new Error("Nenhuma voz disponível")
        }
      } catch (err) {
        console.error("Erro ao carregar vozes:", err)
        setError("Erro ao carregar vozes. Usando modo de demonstração.")
        setUseDemoMode(true)
        setApiLimitReached(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVoices()
  }, [])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    if (newText.length <= 1000) {
      setText(newText)
      setCharacterCount(newText.length)
    }
  }

  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value)
  }

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value)
  }

  const handleSpeakingRateChange = (value: number[]) => {
    setSpeakingRate(value[0])
  }

  // Função para usar o modo de demonstração quando a API estiver indisponível
  const useDemoAudio = () => {
    setUseDemoMode(true)
    setApiLimitReached(true)

    // Usar a Web Speech API para gerar um áudio de demonstração
    const utterance = new SpeechSynthesisUtterance(
      DEMO_TEXT[selectedLanguage as keyof typeof DEMO_TEXT] || DEMO_TEXT["en-us"],
    )

    // Tentar definir o idioma com base na seleção
    switch (selectedLanguage) {
      case "pt-br":
        utterance.lang = "pt-BR"
        break
      case "en-us":
        utterance.lang = "en-US"
        break
      case "es-es":
        utterance.lang = "es-ES"
        break
      case "fr-fr":
        utterance.lang = "fr-FR"
        break
      case "de-de":
        utterance.lang = "de-DE"
        break
      case "it-it":
        utterance.lang = "it-IT"
        break
      default:
        utterance.lang = "en-US"
    }

    // Ajustar a velocidade (rate) com base no valor selecionado
    utterance.rate = speakingRate

    // Reproduzir o áudio
    window.speechSynthesis.speak(utterance)

    setIsLoading(false)
  }

  const generateSpeech = async () => {
    if (!text.trim()) {
      setError("Por favor, insira algum texto para converter.")
      return
    }

    if (!selectedVoice && !useDemoMode) {
      setError("Por favor, selecione uma voz.")
      return
    }

    setIsLoading(true)
    setError(null)
    setAudioUrl(null)
    setAppliedSettings(null)
    setApiLimitReached(false)

    // Se estiver no modo de demonstração, use a Web Speech API
    if (useDemoMode) {
      const utterance = new SpeechSynthesisUtterance(text)

      // Tentar definir o idioma com base na seleção
      switch (selectedLanguage) {
        case "pt-br":
          utterance.lang = "pt-BR"
          break
        case "en-us":
          utterance.lang = "en-US"
          break
        case "es-es":
          utterance.lang = "es-ES"
          break
        case "fr-fr":
          utterance.lang = "fr-FR"
          break
        case "de-de":
          utterance.lang = "de-DE"
          break
        case "it-it":
          utterance.lang = "it-IT"
          break
        default:
          utterance.lang = "en-US"
      }

      // Ajustar a velocidade (rate) com base no valor selecionado
      utterance.rate = speakingRate

      // Reproduzir o áudio
      window.speechSynthesis.speak(utterance)

      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice_id: selectedVoice,
          language: selectedLanguage,
          speaking_rate: speakingRate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Erro detalhado:", data)

        // Verificar se devemos usar o modo de fallback
        if (data.useFallback) {
          setApiLimitReached(true)
          setUseDemoMode(true)
          
          // Executar o modo de demonstração automaticamente
          setTimeout(() => useDemoAudio(), 500)
          
          throw new Error(data.error || "Falha ao gerar áudio. Usando modo de demonstração.")
        }

        // Verificar se é o erro específico de limite de API
        if (data.details?.detail?.status === "detected_unusual_activity") {
          setApiLimitReached(true)
          throw new Error("Limite da API atingido. O plano gratuito do ElevenLabs está temporariamente indisponível.")
        }

        throw new Error(data.error || "Falha ao gerar áudio")
      }

      setAudioUrl(data.audioUrl)

      // Armazenar as configurações aplicadas
      if (data.appliedSettings) {
        setAppliedSettings(data.appliedSettings)
      }

      // Reproduzir áudio automaticamente quando estiver pronto
      if (audioRef.current) {
        audioRef.current.src = data.audioUrl
        audioRef.current.load()
      }
    } catch (err: any) {
      setError(err.message || "Erro ao gerar áudio. Por favor, tente novamente.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadAudio = () => {
    if (!audioUrl) return

    const link = document.createElement("a")
    link.href = audioUrl
    link.download = `audio-${Date.now()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Função para formatar o valor da velocidade para exibição
  const formatSpeakingRate = (rate: number) => {
    if (rate === 1.0) return "Normal (1.0x)"
    if (rate < 1.0) return `Lento (${rate.toFixed(1)}x)`
    return `Rápido (${rate.toFixed(1)}x)`
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div 
        style={{
          background: 'linear-gradient(45deg, #ff0000, #ff7700, #ffff00, #00ff00, #00ffff, #0000ff, #8a2be2, #ff00ff, #ff0000)',
          backgroundSize: '400% 400%',
          animation: 'rainbow-animation 3s ease infinite',
          padding: '6px',
          borderRadius: '16px',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.4)',
          maxWidth: '42rem',
          margin: '0 auto',
          position: 'relative',
        }}
        className="w-full max-w-2xl mx-auto"
      >
        <div
          style={{
            position: 'absolute',
            inset: '0',
            background: 'inherit',
            borderRadius: 'inherit',
            filter: 'blur(10px)',
            opacity: '0.7',
            zIndex: '-1',
          }}
        />
        <Card className="w-full overflow-hidden relative z-10">
          <CardHeader>
            <CardTitle className="text-2xl">Conversor de Texto para Áudio</CardTitle>
            <CardDescription>Transforme seu texto em áudio natural usando IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiLimitReached && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Modo de Demonstração Ativo</AlertTitle>
                <AlertDescription>
                  {useDemoMode ? (
                    <p className="text-sm">Usando o modo de demonstração com a Web Speech API do navegador.</p>
                  ) : (
                    <>
                      A API do ElevenLabs está temporariamente indisponível.
                      <Button variant="outline" size="sm" onClick={useDemoAudio} className="mt-2 w-full">
                        Usar modo de demonstração
                      </Button>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="input-text" className="text-sm font-medium">
                Texto para converter <span className="text-muted-foreground">({characterCount}/1000)</span>
              </label>
              <Textarea
                id="input-text"
                placeholder="Digite ou cole seu texto aqui (máximo 1000 caracteres)..."
                value={text}
                onChange={handleTextChange}
                className="min-h-[150px]"
              />
              <Progress value={(characterCount / 1000) * 100} className="h-1" />
            </div>

            {!useDemoMode && (
              <div className="space-y-2">
                <label htmlFor="input-voice" className="text-sm font-medium">
                  Selecione uma voz
                </label>
                <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                  <SelectTrigger id="input-voice">
                    <SelectValue placeholder="Selecione uma voz" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.voice_id} value={voice.voice_id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="input-language" className="text-sm font-medium">
                Selecione um idioma
              </label>
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger id="input-language">
                  <SelectValue placeholder="Selecione um idioma" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="input-speaking-rate" className="text-sm font-medium">
                  Velocidade da fala
                </label>
                <span className="text-sm text-muted-foreground">{formatSpeakingRate(speakingRate)}</span>
              </div>
              {/* Ajustando o intervalo do slider para os limites aceitos pela API (0.7 a 1.2) */}
              <Slider
                id="input-speaking-rate"
                min={0.7}
                max={1.2}
                step={0.05}
                value={[speakingRate]}
                onValueChange={handleSpeakingRateChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Intervalo permitido: 0.7x (mais lento) até 1.2x (mais rápido)
              </p>
            </div>

            {error && !apiLimitReached && <p className="text-red-500 text-sm">{error}</p>}

            {appliedSettings && (
              <Alert>
                <AlertDescription>
                  Áudio gerado com velocidade: {formatSpeakingRate(appliedSettings.speed)}
                </AlertDescription>
              </Alert>
            )}

            {audioUrl && (
              <div className="space-y-2">
                <label htmlFor="input-audio" className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" /> Áudio gerado
                </label>
                <audio ref={audioRef} id="input-audio" controls className="w-full">
                  <source src={audioUrl} type="audio/mpeg" />
                  Seu navegador não suporta o elemento de áudio.
                </audio>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between flex-wrap gap-2">
            <Button onClick={generateSpeech} disabled={isLoading || !text.trim() || (!selectedVoice && !useDemoMode)}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando áudio...
                </>
              ) : (
                "Gerar Áudio"
              )}
            </Button>
            {audioUrl && (
              <Button variant="outline" onClick={downloadAudio}>
                <Download className="mr-2 h-4 w-4" />
                Baixar MP3
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

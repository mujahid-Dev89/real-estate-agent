"use client"
import { useRef, useState, useEffect } from "react"
import { Mic, MicOff, Loader2, Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { personalityTrainingApi } from "@/services/api"
import { API_BASE_URL } from "@/config"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
}

export function AgentTalk() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // --- CONTEXT: Fetch personality, properties, etc. ---
  // Replace with your actual context fetching logic
  const [personality, setPersonality] = useState<any>(null)
  const [properties, setProperties] = useState<any>(null)
  useEffect(() => {
    // Example: fetch personality and properties from your API
    // setPersonality(await fetchPersonality())
    // setProperties(await fetchProperties())
  }, [])

  // --- Voice Recording ---
  const handleStartRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({ title: "Error", description: "Audio recording not supported.", variant: "destructive" })
      return
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    setMediaRecorder(recorder)
    audioChunksRef.current = []

    recorder.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data)
    }
    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
      const formData = new FormData()
      formData.append("file", audioBlob, "audio.webm")
      setIsRecording(false)
      try {
        const res = await fetch(`${API_BASE_URL}/whisper/transcribe`, {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (data.text) {
          setInput(data.text)
          // Optionally auto-send after transcription:
          // handleSendMessage(data.text)
        } else {
          toast({ title: "Error", description: "Could not transcribe audio.", variant: "destructive" })
        }
      } catch {
        toast({ title: "Error", description: "Failed to transcribe audio.", variant: "destructive" })
      }
    }
    recorder.start()
    setIsRecording(true)
  }

  const handleStopRecording = () => {
    mediaRecorder?.stop()
    setIsRecording(false)
  }

  // --- Natural TTS using OpenAI ---
  const playTTS = async (text: string, onEnd?: () => void) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tts/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.play()
      if (onEnd) audio.onended = onEnd
    } catch {
      toast({ title: "Error", description: "Failed to play agent voice.", variant: "destructive" })
      if (onEnd) onEnd()
    }
  }

  // --- Send message to agent (with context) ---
 const handleSendMessage = async (overrideInput?: string) => {
  const messageToSend = overrideInput ?? input
  if (!messageToSend.trim()) return

  const userMessage: Message = {
    role: "user",
    content: messageToSend,
    timestamp: new Date(),
  }
  setMessages((prev) => [...prev, userMessage])
  setInput("")
  setIsLoading(true)

  try {
    const response = await personalityTrainingApi.chatWithAgent({
      message: userMessage.content,
      history: messages,
      model: "openai"
    })

    const assistantMessage: Message = {
      role: "assistant",
      content: response.data.response,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    await playTTS(response.data.response, () => {
      handleStartRecording()
    })
  } catch (error: any) {
    toast({
      title: "Error",
      description: "Failed to get agent response",
      variant: "destructive",
    })
  } finally {
    setIsLoading(false)
  }
}

  // --- Auto-scroll to bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // --- Optionally auto-listen after mount ---
  // useEffect(() => { handleStartRecording() }, [])

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        
        <CardTitle>Agent Talk (Continuous Voice Chat)</CardTitle>
        <CardDescription>Speak to your AI agent and get natural voice responses.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Start a conversation with your AI real estate agent
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start gap-2 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`p-2 rounded-full ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  <div className={`p-3 rounded-lg ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.timestamp && (
                      <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or use the mic..."
            className="resize-none"
            disabled={isLoading}
          />
          <Button
            type="button"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isLoading}
            variant={isRecording ? "destructive" : "default"}
            title={isRecording ? "Stop Recording" : "Speak"}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button onClick={() => handleSendMessage()} disabled={isLoading || !input.trim()} className="shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
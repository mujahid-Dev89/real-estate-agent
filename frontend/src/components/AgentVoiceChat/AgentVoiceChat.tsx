import { useRef, useState } from "react"
import { Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { API_BASE_URL } from "@/config"

export function AgentVoiceChat() {
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false)

  // Start recording and send audio to backend
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
      setIsRecording(false)
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
      const formData = new FormData()
      formData.append("file", audioBlob, "audio.webm")
      try {
        // Send audio to backend and get agent's audio reply
        const res = await fetch(`${API_BASE_URL}/voice/chat`, {
          method: "POST",
          body: formData,
        })
        if (res.ok) {
          const agentAudioBlob = await res.blob()
          const audioUrl = URL.createObjectURL(agentAudioBlob)
          const audio = new Audio(audioUrl)
          setIsAgentSpeaking(true)
          audio.play()
          audio.onended = () => {
            setIsAgentSpeaking(false)
            handleStartRecording() // Start listening again after agent finishes
          }
        } else {
          toast({ title: "Error", description: "Agent failed to respond.", variant: "destructive" })
        }
      } catch {
        toast({ title: "Error", description: "Failed to send audio.", variant: "destructive" })
      }
    }
    recorder.start()
    setIsRecording(true)
  }

  const handleStopRecording = () => {
    mediaRecorder?.stop()
    setIsRecording(false)
  }

  return (
    <Card className="w-full h-[400px] flex flex-col items-center justify-center">
      <CardHeader>
        <CardTitle>Agent Voice Chat</CardTitle>
        <CardDescription>
          Talk to your AI agent with your voice. The agent will reply with natural speech.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center flex-1">
        <div className="mb-6">
          {isRecording ? (
            <span className="text-green-600 font-bold">Listening...</span>
          ) : isAgentSpeaking ? (
            <span className="text-blue-600 font-bold">Agent is speaking...</span>
          ) : (
            <span className="text-muted-foreground">Tap the mic to start</span>
          )}
        </div>
        <Button
          type="button"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          size="icon"
          className="rounded-full h-20 w-20 flex items-center justify-center"
          variant={isRecording ? "destructive" : "default"}
          disabled={isAgentSpeaking}
        >
          {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
        </Button>
      </CardContent>
    </Card>
  )
}
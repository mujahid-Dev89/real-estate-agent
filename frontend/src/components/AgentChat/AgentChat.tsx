"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, User, Bot, Loader2, AlertTriangle, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { personalityTrainingApi } from "@/services/api"
import type { AIModel } from "@/services/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
  error?: boolean
}

export function AgentChat() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<AIModel>("deepseek")
  const [apiError, setApiError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // --- Voice chat state ---
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // --- Text-to-speech ---
  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new window.SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    }
  }

  // Speak agent's message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === "assistant" && lastMsg.content) {
        speak(lastMsg.content)
      }
    }
  }, [messages])

  // --- Speech-to-text ---
  const handleStartListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast({ title: "Error", description: "Speech recognition not supported in this browser.", variant: "destructive" })
      return
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
    setIsListening(true)
    recognitionRef.current = recognition
  }

  const handleStopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    setApiError(null)

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await personalityTrainingApi.chatWithAgent({
        message: input,
        history: messages,
        model: selectedModel,
      })

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.response,
        timestamp: new Date(),
        error: !!response.data.error,
      }

      setMessages((prev) => [...prev, assistantMessage])

      toast({
        title: "Agent Response",
        description: `Using ${response.data.model} model (${response.data.tokens_used} tokens)`,
      })

      if (response.data.error) {
        setApiError(response.data.error)
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting to my AI services right now. Please try again later.",
        timestamp: new Date(),
        error: true,
      }

      setMessages((prev) => [...prev, errorMessage])
      setApiError(error.response?.data?.detail || error.message || "Failed to get agent response")

      toast({
        title: "Error",
        description: "Failed to get agent response",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Chat with AI Agent</CardTitle>
        <CardDescription>Test how well your AI agent has learned from the training</CardDescription>
        <div className="mt-2">
          <Select value={selectedModel} onValueChange={(value: AIModel) => setSelectedModel(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select AI model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deepseek">DeepSeek (Default)</SelectItem>
              <SelectItem value="mistral">Mistral</SelectItem>
              <SelectItem value="openai">OpenAI (GPT-3.5)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>API Error: {apiError}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Start a conversation with your AI real estate agent
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex items-start gap-2 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`p-2 rounded-full ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.error
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-5 w-5" />
                    ) : message.error ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.error
                          ? "bg-destructive/10 border border-destructive"
                          : "bg-muted"
                    }`}
                  >
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
            onKeyDown={handleKeyDown}
            placeholder="Type your message or use the mic..."
            className="resize-none"
            disabled={isLoading}
          />
          <Button
            type="button"
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={isLoading}
            variant={isListening ? "destructive" : "default"}
            title={isListening ? "Stop Listening" : "Speak"}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
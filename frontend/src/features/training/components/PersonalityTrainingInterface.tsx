"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface Conversation {
  id: number
  userInput: string
  agentResponse: string
  feedback?: string
}

export default function PersonalityTrainingInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [currentFeedback, setCurrentFeedback] = useState("")

  const handleSubmitInput = async () => {
    if (!currentInput.trim()) return

    // TODO: Integrate with AI backend to get response
    const mockAgentResponse = "This is a mock response from the AI agent. In production, this would be generated based on the trained personality and response templates."

    const newConversation: Conversation = {
      id: conversations.length + 1,
      userInput: currentInput,
      agentResponse: mockAgentResponse,
    }

    setConversations([...conversations, newConversation])
    setCurrentInput("")
  }

  const handleSubmitFeedback = (id: number) => {
    setConversations(
      conversations.map((conv) =>
        conv.id === id ? { ...conv, feedback: currentFeedback } : conv
      )
    )
    setCurrentFeedback("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Interactive Training Session</h3>
            <Textarea
              placeholder="Type your message to train the AI agent..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              rows={4}
            />
            <Button onClick={handleSubmitInput} disabled={!currentInput.trim()}>
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {conversations.map((conversation) => (
          <Card key={conversation.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="font-medium">User Input:</p>
                  <p className="text-sm">{conversation.userInput}</p>
                </div>
                <div>
                  <p className="font-medium">Agent Response:</p>
                  <p className="text-sm">{conversation.agentResponse}</p>
                </div>
                <div>
                  {conversation.feedback ? (
                    <div>
                      <p className="font-medium">Feedback:</p>
                      <p className="text-sm">{conversation.feedback}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Provide feedback on the agent's response..."
                        value={currentFeedback}
                        onChange={(e) => setCurrentFeedback(e.target.value)}
                      />
                      <Button
                        onClick={() => handleSubmitFeedback(conversation.id)}
                        disabled={!currentFeedback.trim()}
                      >
                        Submit Feedback
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
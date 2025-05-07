"use client"

import { useState } from "react"
import { AgentChat } from "../AgentChat/AgentChat"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { personalityTrainingApi } from "@/services/api"

export function AgentTestingPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("chat")
  const [testScenario, setTestScenario] = useState("")
  const [agentResponse, setAgentResponse] = useState("")
  const [evaluation, setEvaluation] = useState<any>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const handleEvaluateResponse = async () => {
    if (!testScenario.trim() || !agentResponse.trim()) return

    setIsEvaluating(true)
    try {
      const result = await personalityTrainingApi.evaluateResponse({
        scenario_query: testScenario,
        scenario_context: "Test scenario for agent evaluation",
        response_text: agentResponse,
      })

      setEvaluation(result.data)
      toast({
        title: "Response Evaluated",
        description: `Score: ${result.data.score}/100`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to evaluate response",
        variant: "destructive",
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Agent Testing</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="chat">Chat Interface</TabsTrigger>
          <TabsTrigger value="evaluation">Structured Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <p className="text-muted-foreground mb-4">
            Chat with your AI agent to test how well it has learned from the training. Try asking about properties,
            pricing, or negotiation strategies.
          </p>

          <AgentChat />
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-4">
          <p className="text-muted-foreground mb-4">
            Test your agent with specific scenarios and evaluate its responses.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Scenario</CardTitle>
                <CardDescription>Enter a test scenario for your agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={testScenario}
                  onChange={(e) => setTestScenario(e.target.value)}
                  placeholder="Enter a customer query or scenario..."
                  className="min-h-[100px]"
                />

                <Textarea
                  value={agentResponse}
                  onChange={(e) => setAgentResponse(e.target.value)}
                  placeholder="Enter the agent's response to evaluate..."
                  className="min-h-[150px]"
                />

                <Button
                  onClick={handleEvaluateResponse}
                  disabled={isEvaluating || !testScenario.trim() || !agentResponse.trim()}
                  className="w-full"
                >
                  {isEvaluating ? "Evaluating..." : "Evaluate Response"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evaluation Results</CardTitle>
                <CardDescription>AI evaluation of the agent's response</CardDescription>
              </CardHeader>
              <CardContent>
                {evaluation ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Overall Score:</span>
                      <span className="text-xl font-bold">{evaluation.score}/100</span>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Strengths:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {evaluation.strengths.map((strength: string, index: number) => (
                          <li key={index} className="text-sm">
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Areas for Improvement:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {evaluation.improvements.map((improvement: string, index: number) => (
                          <li key={index} className="text-sm">
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Suggestions:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {evaluation.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-sm">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No evaluation results yet. Submit a response to see evaluation.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


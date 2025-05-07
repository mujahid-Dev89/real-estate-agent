"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { personalityTrainingApi } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AIModel } from "@/services/api"

interface Evaluation {
  score: number
  personality_match: Record<string, number>
  strengths: string[]
  improvements: string[]
  suggestions: string[]
}

export function ScenarioTraining() {
  const { toast } = useToast()
  const [response, setResponse] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [currentScenario] = useState({
    query: "I'm interested in buying a house in the downtown area. What can you tell me about the market there?",
    context:
      "The downtown area has seen a 15% increase in property values over the last year. The average home price is $500,000.",
  })
  const [selectedModel, setSelectedModel] = useState<AIModel>("deepseek")

  const handleSubmitResponse = async () => {
    if (!response.trim()) return

  setIsEvaluating(true)
  try {
    const result = await personalityTrainingApi.evaluateResponse({
      scenario_query: currentScenario.query,
      scenario_context: currentScenario.context,
      response_text: response
    }, selectedModel)

    setEvaluation(result.data)
    toast({
      title: "Response Evaluated",
      description: `Evaluated using ${selectedModel.toUpperCase()}`,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scenario Training</CardTitle>
          <CardDescription>Practice responding to real estate scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Customer Query</h3>
              <p className="text-sm text-muted-foreground">{currentScenario.query}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Context</h3>
              <p className="text-sm text-muted-foreground">{currentScenario.context}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">AI Model</h3>
              <Select value={selectedModel} onValueChange={(value: AIModel) => setSelectedModel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deepseek">DeepSeek (Default)</SelectItem>
                  <SelectItem value="mistral">Mistral</SelectItem>
                  <SelectItem value="openai">OpenAI (GPT-3.5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Your Response</h3>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response here..."
                className="min-h-[100px]"
              />
            </div>

            <Button onClick={handleSubmitResponse} disabled={isEvaluating || !response.trim()} className="w-full">
              {isEvaluating ? "Evaluating..." : "Submit for Evaluation"}
            </Button>

            {evaluation && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Evaluation Results</h3>
                  <span className="text-lg font-bold">Score: {evaluation.score}/100</span>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Strengths</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2">
                      {evaluation.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Areas for Improvement</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2">
                      {evaluation.improvements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <ArrowRight className="h-4 w-4" />
                  <AlertTitle>Suggestions</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2">
                      {evaluation.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


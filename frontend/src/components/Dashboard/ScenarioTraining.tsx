"use client"

import { useState, useEffect } from "react" // Added useEffect
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { personalityTrainingApi } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, AlertCircle, ArrowRight, Loader2 } from "lucide-react" // Added Loader2
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AIModel } from "@/services/api"

// Define TrainingScenario interface based on backend schema
interface TrainingScenario {
  id: string // Assuming UUID is string on frontend
  title: string
  description: string
  customer_query: string // This was 'query', changed to 'customer_query' to match backend
  context: string
  difficulty_level: string
  category: string
  created_at: string // Assuming datetime is string
}

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
  
  const [scenarios, setScenarios] = useState<TrainingScenario[]>([])
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>(undefined)
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true)

  const [selectedModel, setSelectedModel] = useState<AIModel>("deepseek")

  useEffect(() => {
    loadScenarios()
  }, [])

  const loadScenarios = async () => {
    setIsLoadingScenarios(true)
    try {
      const res = await personalityTrainingApi.getScenarios()
      setScenarios(res.data)
      if (res.data.length > 0) {
        setSelectedScenarioId(res.data[0].id) // Select the first scenario by default
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load training scenarios.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingScenarios(false)
    }
  }
  
  const currentScenario = scenarios.find(s => s.id === selectedScenarioId)

  const handleSubmitResponse = async () => {
    if (!response.trim() || !currentScenario) return

    setIsEvaluating(true)
    setEvaluation(null) // Clear previous evaluation
    try {
      const result = await personalityTrainingApi.evaluateResponse({
        scenario_query: currentScenario.customer_query, // Changed from currentScenario.query
        scenario_context: currentScenario.context,
        response_text: response,
        scenario_id: currentScenario.id
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
          <CardDescription>Practice responding to real estate scenarios. Select a scenario and provide your response.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingScenarios ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Loading scenarios...</p>
            </div>
          ) : scenarios.length === 0 ? (
             <p className="text-center text-muted-foreground">No training scenarios available. Please add some first.</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Select Scenario</h3>
                <Select value={selectedScenarioId} onValueChange={(value) => setSelectedScenarioId(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map(scenario => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        {scenario.title} ({scenario.category} - {scenario.difficulty_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentScenario && (
                <>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Customer Query</h3>
                    <p className="text-sm text-muted-foreground p-3 bg-slate-50 rounded-md border">
                      {currentScenario.customer_query}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Context</h3>
                    <p className="text-sm text-muted-foreground p-3 bg-slate-50 rounded-md border">
                      {currentScenario.context}
                    </p>
                  </div>
                </>
              )}
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

            <Button onClick={handleSubmitResponse} disabled={isEvaluating || !response.trim() || !currentScenario} className="w-full">
              {isEvaluating ? "Evaluating..." : "Submit for Evaluation"}
            </Button>

            {evaluation && currentScenario && (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}


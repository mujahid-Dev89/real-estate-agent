"use client"

import { useState, useEffect } from "react" // Added useEffect
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input" // Added
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // Added
  DialogTrigger,
} from "@/components/ui/dialog" // Added Dialog components
import { personalityTrainingApi } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, AlertCircle, ArrowRight, Loader2, PlusCircle, Edit3, Trash2 } from "lucide-react" // Added icons
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
  const [isScenarioDialogOpen, setIsScenarioDialogOpen] = useState(false)
  const [editingScenario, setEditingScenario] = useState<TrainingScenario | null>(null)
  const [scenarioFormData, setScenarioFormData] = useState({
    title: "",
    description: "",
    customer_query: "",
    context: "",
    difficulty_level: "Easy",
    category: "General Inquiry",
  })
  const [isSavingScenario, setIsSavingScenario] = useState(false)

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

  const handleOpenScenarioDialog = (scenario: TrainingScenario | null = null) => {
    if (scenario) {
      setEditingScenario(scenario)
      setScenarioFormData({
        title: scenario.title,
        description: scenario.description,
        customer_query: scenario.customer_query,
        context: scenario.context,
        difficulty_level: scenario.difficulty_level,
        category: scenario.category,
      })
    } else {
      setEditingScenario(null)
      setScenarioFormData({
        title: "",
        description: "",
        customer_query: "",
        context: "",
        difficulty_level: "Easy",
        category: "General Inquiry",
      })
    }
    setIsScenarioDialogOpen(true)
  }

  const handleScenarioFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setScenarioFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleScenarioSelectChange = (name: string, value: string) => {
    setScenarioFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveScenario = async () => {
    setIsSavingScenario(true)
    try {
      if (editingScenario) {
        await personalityTrainingApi.updateScenario(editingScenario.id, scenarioFormData)
        toast({ title: "Success", description: "Scenario updated successfully." })
      } else {
        await personalityTrainingApi.createScenario(scenarioFormData)
        toast({ title: "Success", description: "Scenario created successfully." })
      }
      setIsScenarioDialogOpen(false)
      loadScenarios() // Refresh the list
    } catch (error) {
      toast({ title: "Error", description: "Failed to save scenario.", variant: "destructive" })
    } finally {
      setIsSavingScenario(false)
    }
  }

  const handleDeleteScenario = async (scenarioId: string | undefined) => {
    if (!scenarioId) return
    if (!confirm("Are you sure you want to delete this scenario? This action cannot be undone.")) {
        return
    }
    try {
        await personalityTrainingApi.deleteScenario(scenarioId)
        toast({ title: "Success", description: "Scenario deleted successfully." })
        loadScenarios() // Refresh the list
        if (selectedScenarioId === scenarioId) {
            setSelectedScenarioId(undefined) // Clear selection if deleted
            setResponse("") // Clear response if current scenario is deleted
            setEvaluation(null) // Clear evaluation
        }
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete scenario.", variant: "destructive" })
    }
  }
  
    // For debugging
    console.log("Selected Scenario ID:", selectedScenarioId);
    console.log("Current Scenario Object:", currentScenario);
    console.log("Response Text:", response, "Trimmed length:", response.trim().length); // Check trimmed length
    console.log("!response.trim():", !response.trim()); // Check the condition directly
    console.log("Is Evaluating:", isEvaluating);
  
    return (
      <div className="space-y-6">
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Scenario Training</CardTitle>
            <CardDescription>
              Select or create a scenario, choose an AI model, then type your response.
              Submit for evaluation.
            </CardDescription>
          </div>
          <Dialog open={isScenarioDialogOpen} onOpenChange={setIsScenarioDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenScenarioDialog()} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Scenario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingScenario ? "Edit Scenario" : "Create New Scenario"}</DialogTitle>
                <DialogDescription>
                  {editingScenario ? "Update the details of your training scenario." : "Fill in the details for a new training scenario."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="title" className="text-right">Title</label>
                  <Input id="title" name="title" value={scenarioFormData.title} onChange={handleScenarioFormChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="description" className="text-right">Description</label>
                  <Textarea id="description" name="description" value={scenarioFormData.description} onChange={handleScenarioFormChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="customer_query" className="text-right">Customer Query</label>
                  <Textarea id="customer_query" name="customer_query" value={scenarioFormData.customer_query} onChange={handleScenarioFormChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="context" className="text-right">Context</label>
                  <Textarea id="context" name="context" value={scenarioFormData.context} onChange={handleScenarioFormChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="difficulty_level" className="text-right">Difficulty</label>
                  <Select name="difficulty_level" value={scenarioFormData.difficulty_level} onValueChange={(value) => handleScenarioSelectChange("difficulty_level", value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="category" className="text-right">Category</label>
                  <Input id="category" name="category" value={scenarioFormData.category} onChange={handleScenarioFormChange} className="col-span-3" placeholder="e.g., Property Inquiry, Negotiation" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsScenarioDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveScenario} disabled={isSavingScenario}>
                  {isSavingScenario ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingScenario ? "Save Changes" : "Create Scenario"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoadingScenarios ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Loading scenarios...</p>
            </div>
          ) : scenarios.length === 0 && !isLoadingScenarios ? (
             <p className="text-center text-muted-foreground py-4">No training scenarios available. Click "Add New Scenario" to create one.</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Select Scenario</h3>
                  {currentScenario && (
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenScenarioDialog(currentScenario)}>
                            <Edit3 className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteScenario(currentScenario?.id)}>
                            <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
                    </div>
                  )}
                </div>
                <Select
                    value={selectedScenarioId}
                    onValueChange={(value) => {
                        setSelectedScenarioId(value);
                        setResponse(""); // Clear response when scenario changes
                        setEvaluation(null); // Clear evaluation
                    }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a scenario to practice or manage" />
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
                placeholder={currentScenario ? `How would you respond to: "${currentScenario.customer_query}"? Consider the context and desired personality traits.` : "Select a scenario to begin..."}
                className="min-h-[100px]"
                disabled={!currentScenario}
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


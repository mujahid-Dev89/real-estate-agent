"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface Scenario {
  id: number
  title: string
  description: string
  context: string
  expectedResponse: string
  userResponse?: string
}

export default function ScenarioTraining() {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 1,
      title: "First Time Home Buyer",
      description: "Handle questions from a first-time home buyer",
      context: "Client is nervous about the home buying process and has a limited budget of $300,000",
      expectedResponse: "Express understanding, explain the process step by step, and focus on properties within budget",
    },
    {
      id: 2,
      title: "Property Negotiation",
      description: "Navigate a complex price negotiation",
      context: "Seller is firm on $450,000, but your client's maximum budget is $425,000",
      expectedResponse: "Demonstrate value proposition and find creative solutions while maintaining professionalism",
    },
  ])

  const [currentScenario, setCurrentScenario] = useState<number>(0)
  const [response, setResponse] = useState<string>("")

  const handleSubmitResponse = () => {
    const updatedScenarios = [...scenarios]
    updatedScenarios[currentScenario].userResponse = response
    setScenarios(updatedScenarios)
    // TODO: Add API call to submit response for evaluation
  }

  const handleNextScenario = () => {
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario(currentScenario + 1)
      setResponse("")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-2">
            {scenarios[currentScenario].title}
          </h3>
          <p className="text-muted-foreground mb-4">
            {scenarios[currentScenario].description}
          </p>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Scenario Context:</h4>
            <p>{scenarios[currentScenario].context}</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Your Response:</label>
              <Textarea
                placeholder="Enter your response to this scenario..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setResponse("")}
              >
                Clear Response
              </Button>
              <div className="space-x-2">
                <Button 
                  onClick={handleSubmitResponse}
                  disabled={!response.trim()}
                >
                  Submit Response
                </Button>
                <Button
                  onClick={handleNextScenario}
                  disabled={currentScenario === scenarios.length - 1}
                >
                  Next Scenario
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
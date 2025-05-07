"use client"

import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { PersonalityAttributes } from "./PersonalityAttributes"
import { ScenarioTraining } from "./ScenarioTraining"
import { ResponseTemplates } from "./ResponseTemplates"
import { MessageSquare } from "lucide-react"

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">AI Real Estate Agent Training</h1>
        <Button onClick={() => navigate("/agent-testing")} className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Test Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PersonalityAttributes />
        <ScenarioTraining />
      </div>

      <ResponseTemplates />
    </div>
  )
}


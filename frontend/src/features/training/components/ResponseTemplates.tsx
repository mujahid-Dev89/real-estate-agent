"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Template {
  id: number
  category: string
  trigger: string
  response: string
}

export default function ResponseTemplates() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: 1,
      category: "Property Inquiries",
      trigger: "Price negotiation",
      response: "I understand your interest in negotiating the price. Let's analyze the property's market value and recent comparable sales to formulate a strategic offer that aligns with your budget while being attractive to the seller.",
    },
    {
      id: 2,
      category: "Viewing Scheduling",
      trigger: "Property viewing request",
      response: "I'd be happy to arrange a viewing of this property. Could you please provide your preferred date and time? I'll coordinate with the current owners and confirm the appointment details with you promptly.",
    },
  ])

  const [newTemplate, setNewTemplate] = useState({
    category: "",
    trigger: "",
    response: "",
  })

  const handleAddTemplate = () => {
    if (newTemplate.category && newTemplate.trigger && newTemplate.response) {
      setTemplates([
        ...templates,
        {
          id: templates.length + 1,
          ...newTemplate,
        },
      ])
      setNewTemplate({
        category: "",
        trigger: "",
        response: "",
      })
    }
  }

  const handleDeleteTemplate = (id: number) => {
    setTemplates(templates.filter((template) => template.id !== id))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Add New Template</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Input
                placeholder="e.g., Property Inquiries"
                value={newTemplate.category}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, category: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trigger</label>
              <Input
                placeholder="e.g., Price negotiation"
                value={newTemplate.trigger}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, trigger: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Response</label>
              <Textarea
                placeholder="Enter the template response..."
                value={newTemplate.response}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, response: e.target.value })
                }
                rows={4}
              />
            </div>
            <Button onClick={handleAddTemplate}>Add Template</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold">{template.category}</h4>
                  <p className="text-sm text-muted-foreground">
                    Trigger: {template.trigger}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  Delete
                </Button>
              </div>
              <p className="text-sm">{template.response}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
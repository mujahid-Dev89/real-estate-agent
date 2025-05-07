"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { personalityTrainingApi } from "@/services/api"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface PersonalityAttribute {
  id: string
  name: string
  value: number
  description: string
}

export function PersonalityAttributes() {
  const [attributes, setAttributes] = useState<PersonalityAttribute[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAttributes()
  }, [])

  const loadAttributes = async () => {
    try {
      const response = await personalityTrainingApi.getAttributes()
      setAttributes(response.data)
    } catch (error) {
      console.error("Failed to load attributes:", error)
      // Set default attributes if API fails
      setAttributes([
        {
          id: "1",
          name: "Professionalism",
          value: 85,
          description: "Demonstrates expertise and maintains professional standards",
        },
        {
          id: "2",
          name: "Empathy",
          value: 75,
          description: "Shows understanding and compassion for client needs",
        },
        {
          id: "3",
          name: "Assertiveness",
          value: 65,
          description: "Confidently presents information and negotiates effectively",
        },
        {
          id: "4",
          name: "Knowledge",
          value: 80,
          description: "Demonstrates deep understanding of real estate market and processes",
        },
      ])
      toast({
        title: "Warning",
        description: "Using default personality attributes (API connection failed)",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAttributeChange = (id: string, value: number) => {
    setAttributes((prev) => prev.map((attr) => (attr.id === id ? { ...attr, value } : attr)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await personalityTrainingApi.updateAttributes(attributes)
      toast({
        title: "Success",
        description: "Personality attributes updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update personality attributes",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personality Attributes</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personality Attributes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">{attribute.name}</label>
                <span className="text-sm text-muted-foreground">{attribute.value}%</span>
              </div>
              <Slider
                value={[attribute.value]}
                onValueChange={([value]) => handleAttributeChange(attribute.id, value)}
                max={100}
                step={1}
              />
              <p className="text-sm text-muted-foreground">{attribute.description}</p>
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


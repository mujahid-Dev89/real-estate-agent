"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface PersonalityAttribute {
  name: string
  value: number
  description: string
}

export default function PersonalityAttributes() {
  const [attributes, setAttributes] = useState<PersonalityAttribute[]>([
    {
      name: "Professionalism",
      value: 75,
      description: "Level of formal and professional communication",
    },
    {
      name: "Empathy",
      value: 85,
      description: "Ability to understand and share client feelings",
    },
    {
      name: "Assertiveness",
      value: 65,
      description: "Confidence and decisiveness in communication",
    },
    {
      name: "Enthusiasm",
      value: 70,
      description: "Energy and passion in property discussions",
    },
    {
      name: "Detail Orientation",
      value: 90,
      description: "Attention to property specifics and client requirements",
    },
  ])

  const handleSliderChange = (index: number, value: number[]) => {
    const newAttributes = [...attributes]
    newAttributes[index].value = value[0]
    setAttributes(newAttributes)
  }

  const handleSave = async () => {
    try {
      // TODO: Implement API call to save personality attributes
      console.log("Saving personality attributes:", attributes)
    } catch (error) {
      console.error("Error saving personality attributes:", error)
    }
  }

  return (
    <div className="space-y-8">
      {attributes.map((attribute, index) => (
        <Card key={attribute.name} className="p-4">
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{attribute.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {attribute.description}
                  </p>
                </div>
                <span className="text-lg font-bold">{attribute.value}%</span>
              </div>
            </div>
            <Slider
              defaultValue={[attribute.value]}
              max={100}
              step={1}
              className="w-full"
              onValueChange={(value) => handleSliderChange(index, value)}
            />
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave}>Save Personality Configuration</Button>
      </div>
    </div>
  )
}
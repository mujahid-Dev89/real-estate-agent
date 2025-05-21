"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input" // Added Input
import { personalityTrainingApi } from "@/services/api"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Trash2, PlusCircle } from "lucide-react" // Added icons

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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAttributeName, setNewAttributeName] = useState("")
  const [newAttributeDescription, setNewAttributeDescription] = useState("")
  const [newAttributeValue, setNewAttributeValue] = useState(50)

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
      // Use the renamed function for clarity, though its backend implementation is the same for now
      await personalityTrainingApi.updateBulkAttributes(attributes.map(attr => ({ id: attr.id, value: attr.value })))
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

  const handleCreateAttribute = async () => {
    if (!newAttributeName.trim() || !newAttributeDescription.trim()) {
      toast({
        title: "Error",
        description: "Name and description cannot be empty.",
        variant: "destructive",
      })
      return
    }
    setSaving(true)
    try {
      await personalityTrainingApi.createAttribute({
        name: newAttributeName,
        description: newAttributeDescription,
        value: newAttributeValue,
      })
      toast({
        title: "Success",
        description: "Attribute created successfully.",
      })
      setNewAttributeName("")
      setNewAttributeDescription("")
      setNewAttributeValue(50)
      setShowCreateForm(false)
      loadAttributes() // Refresh list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create attribute.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attribute?")) {
      return
    }
    setSaving(true) // Use general saving state for simplicity
    try {
      await personalityTrainingApi.deleteAttribute(id)
      toast({
        title: "Success",
        description: "Attribute deleted successfully.",
      })
      loadAttributes() // Refresh list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete attribute.",
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personality Attributes</CardTitle>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          {showCreateForm ? "Cancel" : "Add New"}
        </Button>
      </CardHeader>
      <CardContent>
        {showCreateForm && (
          <div className="mb-6 p-4 border rounded-lg space-y-3">
            <h3 className="text-lg font-medium">Create New Attribute</h3>
            <div>
              <label htmlFor="newAttrName" className="text-sm font-medium">Name</label>
              <Input
                id="newAttrName"
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
                placeholder="e.g., Friendliness"
              />
            </div>
            <div>
              <label htmlFor="newAttrDesc" className="text-sm font-medium">Description</label>
              <Input
                id="newAttrDesc"
                value={newAttributeDescription}
                onChange={(e) => setNewAttributeDescription(e.target.value)}
                placeholder="e.g., How friendly the agent appears"
              />
            </div>
            <div>
              <label htmlFor="newAttrValue" className="text-sm font-medium">Initial Value: {newAttributeValue}%</label>
              <Slider
                id="newAttrValue"
                value={[newAttributeValue]}
                onValueChange={([val]) => setNewAttributeValue(val)}
                max={100}
                step={1}
              />
            </div>
            <Button onClick={handleCreateAttribute} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Attribute
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="space-y-2 p-3 border rounded-md relative">
              <div className="flex justify-between items-start">
                <div>
                  <label className="text-sm font-medium">{attribute.name}</label>
                  <span className="text-sm text-muted-foreground ml-2">{attribute.value}%</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAttribute(attribute.id)}
                  disabled={saving}
                  className="absolute top-1 right-1"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
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
          {attributes.length > 0 && (
            <Button onClick={handleSave} disabled={saving || showCreateForm} className="w-full mt-4">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save All Value Changes
            </Button>
          )}
          {attributes.length === 0 && !showCreateForm && (
            <p className="text-center text-muted-foreground">No attributes defined. Click "Add New" to create one.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


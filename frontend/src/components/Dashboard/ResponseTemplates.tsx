"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { personalityTrainingApi } from "@/services/api"
import { useToast } from "@/components/ui/use-toast"

interface Template {
  id: string
  title: string
  content: string
  category: string
  situationType: string
}

export function ResponseTemplates() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    situationType: "inquiry",
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await personalityTrainingApi.getTemplates()
      setTemplates(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load response templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (editingTemplate) {
        await personalityTrainingApi.updateTemplate(editingTemplate.id, formData)
        toast({
          title: "Success",
          description: "Template updated successfully",
        })
      } else {
        await personalityTrainingApi.createTemplate(formData)
        toast({
          title: "Success",
          description: "Template created successfully",
        })
      }

      setIsDialogOpen(false)
      setEditingTemplate(null)
      setFormData({
        title: "",
        content: "",
        category: "general",
        situationType: "inquiry",
      })
      loadTemplates()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      title: template.title,
      content: template.content,
      category: template.category,
      situationType: template.situationType,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await personalityTrainingApi.deleteTemplate(id)
      toast({
        title: "Success",
        description: "Template deleted successfully",
      })
      loadTemplates()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading templates...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Response Templates</CardTitle>
              <CardDescription>Manage your AI agent response templates</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingTemplate(null)
                    setFormData({
                      title: "",
                      content: "",
                      category: "general",
                      situationType: "inquiry",
                    })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
                  <DialogDescription>
                    {editingTemplate
                      ? "Update your response template details below."
                      : "Fill in the details to create a new response template."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter template title"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="property-info">Property Information</SelectItem>
                        <SelectItem value="pricing">Pricing Discussion</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Situation Type</label>
                    <Select
                      value={formData.situationType}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          situationType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select situation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inquiry">Initial Inquiry</SelectItem>
                        <SelectItem value="showing">Property Showing</SelectItem>
                        <SelectItem value="offer">Offer Discussion</SelectItem>
                        <SelectItem value="objection">Objection Handling</SelectItem>
                        <SelectItem value="closing">Closing Process</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      placeholder="Enter template content..."
                      className="min-h-[200px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>{editingTemplate ? "Update" : "Create"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{template.title}</h4>
                      <div className="flex space-x-2 text-sm text-muted-foreground">
                        <span>{template.category}</span>
                        <span>•</span>
                        <span>{template.situationType}</span>
                      </div>
                      <p className="text-sm mt-2">{template.content}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


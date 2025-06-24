"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { PlusCircle, Edit3, Trash2, Loader2 } from "lucide-react"
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
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { personalityTrainingApi } from "@/services/api" // Assuming property APIs are added here or a new service
import { useToast } from "@/components/ui/use-toast"

// Define PropertyTypeEnum to match backend schema
enum PropertyTypeEnum {
  SALE = "sale",
  RENT = "rent",
}

interface Property {
  id: string // UUID
  title: string
  description?: string
  property_type: PropertyTypeEnum
  price: number
  currency: string
  area_sqft?: number
  bedrooms?: number
  bathrooms?: number
  location?: string
  amenities?: Record<string, any>
  image_url?: string
  is_available?: number
}

const initialPropertyFormData = {
  title: "",
  description: "",
  property_type: PropertyTypeEnum.RENT,
  price: 0,
  currency: "AED",
  area_sqft: 0,
  bedrooms: 0,
  bathrooms: 0,
  location: "",
  amenities: {},
  image_url: "",
  is_available: 1,
}

export function ManageProperties() {
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [formData, setFormData] = useState<Omit<Property, "id">>(initialPropertyFormData)

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    setIsLoading(true)
    try {
      const response = await personalityTrainingApi.getProperties() // Ensure this API function exists
      setProperties(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load properties.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleNumberInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }))
  }

  const handleOpenDialog = (property: Property | null = null) => {
    if (property) {
      setEditingProperty(property)
      // Ensure all fields from Property interface are mapped, handling undefined for optional fields
      setFormData({
        title: property.title,
        description: property.description || "",
        property_type: property.property_type,
        price: property.price,
        currency: property.currency,
        area_sqft: property.area_sqft || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        location: property.location || "",
        amenities: property.amenities || {},
        image_url: property.image_url || "",
        is_available: property.is_available !== undefined ? property.is_available : 1,
      })
    } else {
      setEditingProperty(null)
      setFormData(initialPropertyFormData)
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      const dataToSave = { ...formData }
      dataToSave.price = Number(dataToSave.price)
      dataToSave.area_sqft = dataToSave.area_sqft ? Number(dataToSave.area_sqft) : undefined
      dataToSave.bedrooms = dataToSave.bedrooms ? Number(dataToSave.bedrooms) : undefined
      dataToSave.bathrooms = dataToSave.bathrooms ? Number(dataToSave.bathrooms) : undefined
      dataToSave.is_available = Number(dataToSave.is_available)

      // Ensure amenities is a valid object
      if (typeof dataToSave.amenities === "string") {
        try {
          dataToSave.amenities = JSON.parse(dataToSave.amenities)
        } catch {
          toast({ title: "Validation Error", description: "Amenities must be valid JSON.", variant: "destructive" })
          setIsSaving(false)
          return
        }
      }

      if (editingProperty) {
        await personalityTrainingApi.updateProperty(editingProperty.id, dataToSave)
        toast({ title: "Success", description: "Property updated successfully." })
      } else {
        await personalityTrainingApi.createProperty(dataToSave)
        toast({ title: "Success", description: "Property created successfully." })
      }
      setIsDialogOpen(false)
      loadProperties()
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Failed to save property."
      toast({ title: "Error", description: errorMsg, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return
    try {
      await personalityTrainingApi.deleteProperty(propertyId)
      toast({ title: "Success", description: "Property deleted successfully." })
      loadProperties()
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete property.", variant: "destructive" })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /> Loading properties...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Properties</CardTitle>
            <CardDescription>Add, edit, or delete property listings.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Property
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl"> {/* Increased width */}
              <DialogHeader>
                <DialogTitle>{editingProperty ? "Edit Property" : "Add New Property"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2"> {/* Scrollable content */}
                {/* Title */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="title" className="text-right">Title*</label>
                  <Input id="title" name="title" value={formData.title} onChange={handleInputChange} className="col-span-3" />
                </div>
                {/* Description */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <label htmlFor="description" className="text-right pt-2">Description</label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="col-span-3" />
                </div>
                {/* Property Type */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="property_type" className="text-right">Type*</label>
                  <Select name="property_type" value={formData.property_type} onValueChange={(value) => handleSelectChange("property_type", value)}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PropertyTypeEnum.RENT}>For Rent</SelectItem>
                      <SelectItem value={PropertyTypeEnum.SALE}>For Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Price */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="price" className="text-right">Price*</label>
                  <Input id="price" name="price" type="number" value={formData.price} onChange={handleNumberInputChange} className="col-span-3" />
                </div>
                {/* Currency */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="currency" className="text-right">Currency*</label>
                  <Input id="currency" name="currency" value={formData.currency} onChange={handleInputChange} className="col-span-3" />
                </div>
                {/* Area SqFt */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="area_sqft" className="text-right">Area (sqft)</label>
                  <Input id="area_sqft" name="area_sqft" type="number" value={formData.area_sqft || ''} onChange={handleNumberInputChange} className="col-span-3" />
                </div>
                {/* Bedrooms */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="bedrooms" className="text-right">Bedrooms</label>
                  <Input id="bedrooms" name="bedrooms" type="number" value={formData.bedrooms || ''} onChange={handleNumberInputChange} className="col-span-3" />
                </div>
                {/* Bathrooms */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="bathrooms" className="text-right">Bathrooms</label>
                  <Input id="bathrooms" name="bathrooms" type="number" value={formData.bathrooms || ''} onChange={handleNumberInputChange} className="col-span-3" />
                </div>
                {/* Location */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="location" className="text-right">Location</label>
                  <Input id="location" name="location" value={formData.location} onChange={handleInputChange} className="col-span-3" />
                </div>
                {/* Image URL */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="image_url" className="text-right">Image URL</label>
                  <Input id="image_url" name="image_url" value={formData.image_url} onChange={handleInputChange} className="col-span-3" />
                </div>
                 {/* Amenities (JSON - simple textarea for now) */}
                 <div className="grid grid-cols-4 items-start gap-4">
                  <label htmlFor="amenities" className="text-right pt-2">Amenities (JSON)</label>
                  <Textarea 
                    id="amenities" 
                    name="amenities" 
                    value={typeof formData.amenities === 'string' ? formData.amenities : JSON.stringify(formData.amenities, null, 2)} 
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            setFormData(prev => ({ ...prev, amenities: parsed }));
                        } catch (err) {
                            // Handle invalid JSON, maybe set an error state or just keep it as string
                             setFormData(prev => ({ ...prev, amenities: e.target.value as any })); // Allow typing invalid JSON temporarily
                        }
                    }}
                    className="col-span-3 font-mono text-sm"
                    placeholder='{ "pool": true, "gym": false }'
                  />
                  <div className="col-start-2 col-span-3">
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter amenities as a valid JSON object. E.g.,
                      <code>{'{ "pool": true, "parking_spots": 2, "balcony": "large" }'}</code>
                    </p>
                  </div>
                </div>
                {/* Availability */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="is_available" className="text-right">Availability*</label>
                  <Select name="is_available" value={String(formData.is_available)} onValueChange={(value) => handleSelectChange("is_available", Number(value))}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Available</SelectItem>
                      <SelectItem value="0">Unavailable</SelectItem>
                      {/* Add other states if needed */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingProperty ? "Save Changes" : "Create Property"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No properties found. Click "Add New Property" to create one.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <Card key={property.id}>
                  <CardHeader>
                    <CardTitle className="truncate">{property.title}</CardTitle>
                    <CardDescription>{property.location || "N/A"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {property.image_url && <img src={property.image_url} alt={property.title} className="rounded-md h-40 w-full object-cover"/>}
                    <p className="text-lg font-semibold">{property.currency} {property.price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{property.property_type === PropertyTypeEnum.RENT ? "For Rent" : "For Sale"}</p>
                    <p className="text-sm">{property.bedrooms || 'N/A'} beds • {property.bathrooms || 'N/A'} baths • {property.area_sqft || 'N/A'} sqft</p>
                    <p className="text-xs text-muted-foreground truncate h-10">{property.description}</p>
                     <div className="text-xs">Amenities: {property.amenities ? Object.entries(property.amenities).filter(([_, val]) => val === true).map(([key]) => key).join(', ') || 'None' : 'None'}</div>
                    <p className={`text-sm font-medium ${property.is_available === 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {property.is_available === 1 ? "Available" : "Unavailable"}
                    </p>
                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(property)}>
                        <Edit3 className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(property.id)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
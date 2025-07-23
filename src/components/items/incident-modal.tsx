'use client'

import { useState } from 'react'
import { AlertTriangle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'
import { reportItemIncident } from '@/app/actions/incidents'
import { toast } from 'sonner'

interface IncidentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: {
    id: string
    item_number: string | null
    description: string | null
  }
}

export function IncidentModal({ open, onOpenChange, item }: IncidentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [incidentType, setIncidentType] = useState('')
  const [description, setDescription] = useState('')
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0])
  const [reportedBy, setReportedBy] = useState('')
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incidentType || !description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      await reportItemIncident({
        itemId: item.id,
        incidentType,
        description,
        incidentDate: new Date(incidentDate),
        reportedBy: reportedBy || 'User'
      })
      
      toast.success('Incident reported successfully')
      onOpenChange(false)
      
      // Reset form
      setIncidentType('')
      setDescription('')
      setIncidentDate(new Date().toISOString().split('T')[0])
      setReportedBy('')
    } catch (error) {
      toast.error('Failed to report incident')
      console.error('Failed to report incident:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Report Incident
          </DialogTitle>
          <DialogDescription>
            Report an incident or issue for item: {item.item_number || item.description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="incident-type">Incident Type *</Label>
            <Select value={incidentType} onValueChange={setIncidentType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="damage">Damage</SelectItem>
                <SelectItem value="loss">Loss</SelectItem>
                <SelectItem value="theft">Theft</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="quality">Quality Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="incident-date">Incident Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="incident-date"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reported-by">Reported By</Label>
            <Input
              id="reported-by"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="Enter your name or leave empty for 'User'"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the incident in detail..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Reporting...' : 'Report Incident'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
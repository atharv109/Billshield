import { create } from 'zustand'
import type { CaseData, Issue, Action } from '../data/mockCase'
import { DEMO_CASE } from '../data/mockCase'

export type AppScene =
  | 'landing'
  | 'intake'
  | 'parsing'
  | 'reconstruction'
  | 'analysis'
  | 'issue'
  | 'action'
  | 'resolution'

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
}

interface AppStore {
  scene: AppScene
  uploadedFiles: UploadedFile[]
  caseData: CaseData | null
  selectedIssue: Issue | null
  selectedAction: Action | null
  completedActions: string[]
  parsingProgress: number

  setScene: (s: AppScene) => void
  loadDemoCase: () => void
  simulateUpload: (files: File[]) => void
  selectIssue: (issue: Issue | null) => void
  selectAction: (action: Action | null) => void
  markActionComplete: (id: string) => void
  resetCase: () => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  scene: 'landing',
  uploadedFiles: [],
  caseData: null,
  selectedIssue: null,
  selectedAction: null,
  completedActions: [],
  parsingProgress: 0,

  setScene: (scene) => set({ scene }),

  loadDemoCase: () => {
    set({ scene: 'intake', uploadedFiles: [], parsingProgress: 0 })

    // Simulate file snap-in
    setTimeout(() => {
      set({
        uploadedFiles: [
          { id: 'f1', name: 'hospital_bill_march.pdf', type: 'application/pdf', size: 284000 },
          { id: 'f2', name: 'eob_bluecross_march.pdf', type: 'application/pdf', size: 156000 },
          { id: 'f3', name: 'radiology_bill.pdf', type: 'application/pdf', size: 98000 },
          { id: 'f4', name: 'er_physicians_invoice.pdf', type: 'application/pdf', size: 112000 },
        ],
      })
    }, 800)

    // Start parsing
    setTimeout(() => {
      set({ scene: 'parsing', parsingProgress: 0 })
      // Animate progress
      let p = 0
      const interval = setInterval(() => {
        p += Math.random() * 18 + 5
        if (p >= 100) {
          p = 100
          clearInterval(interval)
          setTimeout(() => {
            set({ scene: 'reconstruction', caseData: DEMO_CASE })
          }, 600)
        }
        set({ parsingProgress: Math.min(p, 100) })
      }, 200)
    }, 2400)

    // Move to analysis
    setTimeout(() => {
      set({ scene: 'analysis' })
    }, 8000)
  },

  simulateUpload: (files: File[]) => {
    const uploaded: UploadedFile[] = files.map((f, i) => ({
      id: `upload-${i}`,
      name: f.name,
      type: f.type,
      size: f.size,
    }))
    set({ uploadedFiles: uploaded, scene: 'intake' })

    setTimeout(() => {
      set({ scene: 'parsing', parsingProgress: 0 })
      let p = 0
      const interval = setInterval(() => {
        p += Math.random() * 15 + 5
        if (p >= 100) {
          p = 100
          clearInterval(interval)
          setTimeout(() => set({ scene: 'reconstruction', caseData: DEMO_CASE }), 600)
        }
        set({ parsingProgress: Math.min(p, 100) })
      }, 250)
    }, 2000)

    setTimeout(() => set({ scene: 'analysis' }), 7500)
  },

  selectIssue: (issue) => {
    if (issue) {
      set({ selectedIssue: issue, selectedAction: null, scene: 'issue' })
    } else {
      set({ selectedIssue: null, scene: 'analysis' })
    }
  },

  selectAction: (action) => {
    if (action) {
      set({ selectedAction: action, selectedIssue: null, scene: 'action' })
    } else {
      set({ selectedAction: null, scene: 'analysis' })
    }
  },

  markActionComplete: (id) => {
    const completed = [...get().completedActions, id]
    const caseData = get().caseData
    const allActions = caseData?.actions ?? []
    set({ completedActions: completed, selectedAction: null, scene: 'analysis' })

    if (allActions.length > 0 && completed.length >= allActions.length) {
      setTimeout(() => set({ scene: 'resolution' }), 1200)
    }
  },

  resetCase: () => {
    set({
      scene: 'landing',
      uploadedFiles: [],
      caseData: null,
      selectedIssue: null,
      selectedAction: null,
      completedActions: [],
      parsingProgress: 0,
    })
  },
}))

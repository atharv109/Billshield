import { create } from 'zustand'
import type { CaseData, Issue, Action } from '../data/mockCase'
import { DEMO_CASE } from '../data/mockCase'

const API_BASE = 'http://localhost:3001/api'

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
  analysisError: string | null

  setScene: (s: AppScene) => void
  loadDemoCase: () => void
  uploadAndAnalyze: (files: File[]) => void
  /** @deprecated kept for UploadZone — calls uploadAndAnalyze internally */
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
  analysisError: null,

  setScene: (scene) => set({ scene }),

  loadDemoCase: () => {
    set({ scene: 'intake', uploadedFiles: [], parsingProgress: 0, analysisError: null })

    setTimeout(() => {
      set({
        uploadedFiles: [
          { id: 'f1', name: 'hospital_bill_march.pdf', type: 'application/pdf', size: 284000 },
          { id: 'f2', name: 'eob_bluecross_march.pdf', type: 'application/pdf', size: 156000 },
        ],
      })
    }, 800)

    setTimeout(() => {
      set({ scene: 'parsing', parsingProgress: 0 })
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

    setTimeout(() => {
      set({ scene: 'analysis' })
    }, 8000)
  },

  uploadAndAnalyze: (files: File[]) => {
    const uploaded: UploadedFile[] = files.map((f, i) => ({
      id: `upload-${i}`,
      name: f.name,
      type: f.type,
      size: f.size,
    }))
    set({ uploadedFiles: uploaded, scene: 'intake', parsingProgress: 0, analysisError: null })

    // Animate progress UI while waiting for API
    const progressInterval = { ref: null as ReturnType<typeof setInterval> | null }
    setTimeout(() => {
      set({ scene: 'parsing', parsingProgress: 0 })
      let p = 0
      progressInterval.ref = setInterval(() => {
        p += Math.random() * 6 + 2
        if (p >= 90) {
          p = 90
          if (progressInterval.ref) clearInterval(progressInterval.ref)
        }
        set({ parsingProgress: Math.min(p, 90) })
      }, 300)
    }, 1500)

    // Upload files and run pipeline
    ;(async () => {
      try {
        // Step 1: upload files
        const formData = new FormData()
        for (const f of files) formData.append('files', f)

        const uploadRes = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData,
        })
        if (!uploadRes.ok) throw new Error('Upload failed')
        const uploadData = await uploadRes.json() as { files: Array<{ fileId: string }> }
        const fileIds = uploadData.files.map((f) => f.fileId)

        // Step 2: analyze
        const analyzeRes = await fetch(`${API_BASE}/upload/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileIds }),
        })
        if (!analyzeRes.ok) {
          const err = await analyzeRes.json().catch(() => ({ error: 'Analysis failed' }))
          throw new Error(err.error ?? 'Analysis failed')
        }

        const caseData = await analyzeRes.json() as CaseData

        // Finish progress
        if (progressInterval.ref) clearInterval(progressInterval.ref)
        set({ parsingProgress: 100 })

        setTimeout(() => {
          set({ scene: 'reconstruction', caseData })
        }, 600)

        setTimeout(() => {
          set({ scene: 'analysis' })
        }, 4000)
      } catch (err) {
        if (progressInterval.ref) clearInterval(progressInterval.ref)
        console.error('Upload/analyze error:', err)
        set({
          analysisError: err instanceof Error ? err.message : 'Analysis failed',
          scene: 'landing',
          parsingProgress: 0,
        })
      }
    })()
  },

  simulateUpload: (files: File[]) => get().uploadAndAnalyze(files),

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
      analysisError: null,
    })
  },
}))

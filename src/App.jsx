import { useEffect, useRef, useState } from 'react'

const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap'
document.head.appendChild(fontLink)

const DEMO = {
  id: 'demo-001', eventType: 'Emergency Room Visit', dateOfService: 'March 3, 2025',
  dueDate: 'April 4, 2025', daysUntilDue: 7, totalBilled: 4870, insurerPaid: 2900,
  patientOwes: 1420, disputeAmount: 1250, amountUnderReview: 850, amountResolved: 0,
  potentialSavings: 420, estimatedOverchargeRisk: 340,
  providerName: 'St. Vincent Medical Center', insurerName: 'BlueCross BlueShield',
  providerCount: 2, documentsLinked: 4, matchConfidence: 72,
  outOfNetworkConcern: true, estimateMismatch: false,
  issues: [
    { id:'i1', severity:'high',   title:'Duplicate lab charge',      description:'Two identical lab fees billed same date. Only one likely valid.',      type:'duplicate',   confidence:0.87, amountAtRisk:340 },
    { id:'i2', severity:'high',   title:'EOB provider fee mismatch', description:'Provider billed $680 but insurer EOB shows only $520 allowed.',        type:'mismatch',    confidence:0.71, amountAtRisk:160 },
    { id:'i3', severity:'medium', title:'Itemization needed',        description:'Three charges grouped under one line item — cannot be independently verified.', type:'itemization', confidence:0.95, amountAtRisk:350 },
  ],
  issueStats: { total:3, high:2, medium:1, low:0, duplicates:1, mismatches:1, itemizationNeeded:1 },
  actions: [
    { id:'a1', title:'Request itemized bill', icon:'📄', type:'letter', priority:'urgent', whyItMatters:'Itemization reveals hidden errors and is your legal right.', draft:`Dear St. Vincent Medical Center Billing,\n\nI am writing to request a complete itemized bill for services on March 3, 2025 (Account #[YOUR ACCOUNT]).\n\nPlease include each service with CPT code, date, and individual charge amount.\n\nThank you,\n[YOUR NAME]`, dueInDays:3 },
    { id:'a2', title:'Dispute duplicate charge', icon:'⚠️', type:'dispute', priority:'urgent', whyItMatters:'Duplicate billing is one of the most common errors.', draft:`Dear Billing Department,\n\nI have identified a potential duplicate charge on my bill from March 3, 2025.\n\nThe same lab fee appears twice. Please review and issue a corrected statement.\n\nSincerely,\n[YOUR NAME]`, dueInDays:7 },
  ],
  actionStats: { total:2, completed:0, providerContacted:false, insurerContacted:false, awaitingResponse:false, nextFollowUpDate:'Apr 11, 2025' },
  timeline: [
    { id:'tl-1', label:'Bill uploaded',      completed:true,  date:'Mar 25' },
    { id:'tl-2', label:'Text extracted',     completed:true,  date:'Mar 25' },
    { id:'tl-3', label:'Issues flagged',     completed:true,  date:'Mar 25' },
    { id:'tl-4', label:'Actions generated',  completed:true,  date:'Mar 25' },
    { id:'tl-5', label:'Provider contacted', completed:false, date:'' },
    { id:'tl-6', label:'Insurer contacted',  completed:false, date:'' },
    { id:'tl-7', label:'Awaiting reply',     completed:false, date:'' },
    { id:'tl-8', label:'Resolved',           completed:false, date:'' },
  ],
  assignedReviewer:'You', caseOwner:'Patient', lastActionTaken:'Case opened', tasksPending:2, documentsMissing:1,
}

async function uploadAndAnalyze(files) {
  const form = new FormData()
  for (const f of files) form.append('files', f)
<<<<<<< HEAD
  const r1 = await fetch('/api/upload', { method:'POST', body:form })
  if (!r1.ok) { const e=await r1.json().catch(()=>({})); throw new Error(e.error||'Upload failed') }
  const { files:uploaded } = await r1.json()
  const fileIds = uploaded.map(f=>f.fileId)
  const r2 = await fetch('/api/upload/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({fileIds}) })
  if (!r2.ok) { const e=await r2.json().catch(()=>({})); throw new Error(e.error||'Analysis failed') }
  return r2.json()
=======
  const res = await fetch('/api/upload', { method:'POST', body:form })
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error||'Upload failed') }
  return res.json()
>>>>>>> c108011
}

export default function App() {
  const [view, setView] = useState('landing')
  const [caseData, setCaseData] = useState(null)
  const [error, setError] = useState(null)
  function handleFiles(files) {
    setError(null); setView('uploading')
    uploadAndAnalyze(files).then(d=>{setCaseData(d);setView('dashboard')}).catch(e=>{setError(e.message);setView('landing')})
  }
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",minHeight:'100vh'}}>
      {view==='landing'   && <Landing onFiles={handleFiles} onDemo={()=>{setCaseData(DEMO);setView('dashboard')}} error={error} />}
      {view==='uploading' && <Uploading />}
      {view==='dashboard' && <Dashboard data={caseData||DEMO} onBack={()=>setView('landing')} />}
    </div>
  )
}

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, prefix = '', suffix = '', duration = 1800 }) {
  const [val, setVal] = useState(0)
  const [ref, visible] = useReveal(0.3)
  useEffect(() => {
    if (!visible) return
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible])
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>
}

// ─── Reveal wrapper ───────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, dir = 'up', style = {} }) {
  const [ref, visible] = useReveal()
  const tx = dir === 'left' ? '-28px' : dir === 'right' ? '28px' : '0'
  const ty = dir === 'up' ? '28px' : dir === 'down' ? '-28px' : '0'
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translate(0,0)' : `translate(${tx},${ty})`,
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Landing ──────────────────────────────────────────────────────────────────
function Landing({ onFiles, onDemo, error }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeQ, setActiveQ] = useState(null)
  const [ticker, setTicker] = useState(0)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const tickerLines = [
    '$1,300 average overcharge per patient',
    '30% of bills contain errors',
    '72% of disputes result in reduction',
    'You have the right to an itemized bill',
    'Duplicate charges are the #1 billing error',
  ]
  useEffect(() => {
    const t = setInterval(() => setTicker(p => (p + 1) % tickerLines.length), 3400)
    return () => clearInterval(t)
  }, [])

  const handleChange = e => { const f = Array.from(e.target.files || []); if (f.length) onFiles(f) }
  const handleDrop = e => { e.preventDefault(); setDragOver(false); const f = Array.from(e.dataTransfer.files); if (f.length) onFiles(f) }

  // Theme — matches old light UI exactly
  const T = {
    bg: '#f8fafc',
    bgAlt: '#f1f5f9',
    surface: '#ffffff',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    text: '#0f172a',
    muted: '#64748b',
    dimmer: '#94a3b8',
    bright: '#0f172a',
    accent: '#0f172a',       // dark slate for primary buttons (matches screenshot)
    accentHover: '#1e293b',
    amber: '#d97706',        // amber used sparingly for flags/highlights
    amberLight: '#fef3c7',
    amberBorder: '#fde68a',
    emerald: '#059669',
    rose: '#e11d48',
    serif: "'DM Serif Display',serif",
    mono: "'JetBrains Mono',monospace",
    sans: "'DM Sans',sans-serif",
  }

  const problems = [
    { icon: '🔢', head: 'Indecipherable codes', body: 'CPT codes, DRG codes, revenue codes — providers speak a language patients were never meant to understand.' },
    { icon: '📬', head: 'Bills arrive in waves', body: 'Hospital, physician group, radiology, anesthesia — each sends a separate bill weeks apart. Nothing adds up.' },
    { icon: '📋', head: 'EOBs don\'t explain', body: '"Not a bill" — then what is it? Explanations of Benefits explain nothing to the average patient.' },
    { icon: '⏳', head: 'Deadlines pressure you', body: 'Due dates arrive before you\'ve had time to question anything. Stress drives premature payment.' },
  ]

  const steps = [
    { n: '01', title: 'Upload', body: 'Drop your PDF bill, EOB, or photo. We accept any format.', icon: '📤' },
    { n: '02', title: 'Extract', body: 'AI reads every charge, code, date, and amount.', icon: '🔬' },
    { n: '03', title: 'Detect', body: 'Flags duplicates, mismatches, and unclear charges.', icon: '⚡' },
    { n: '04', title: 'Act', body: 'Get exact scripts and letters — ready to send.', icon: '✉️' },
  ]

  const features = [
    { icon: '⚡', title: 'Instant AI Analysis', body: 'Upload a bill and get a full structured analysis in under 30 seconds.', highlight: true },
    { icon: '🔍', title: 'Duplicate Detection', body: 'Cross-references line items across multiple bills for the same date of service.' },
    { icon: '📊', title: 'EOB Comparison', body: "Matches every charge on your bill against your insurer's explanation." },
    { icon: '✉️', title: 'Dispute Drafts', body: 'Generates professional letters and call scripts. Ready to send immediately.' },
    { icon: '📈', title: 'Financial Metrics', body: "See exactly what's at risk, what you could save, and what's been resolved." },
    { icon: '🛡️', title: 'Case Tracking', body: 'Every document, flag, and action tracked in one organized workspace.' },
  ]

  const testimonials = [
    { name: 'Sarah M.', role: 'ER patient, Chicago', quote: 'I found a $380 duplicate charge I never would have caught. BillShield paid for itself in 2 minutes.', saved: '$380' },
    { name: 'James T.', role: 'Caregiver, Dallas', quote: 'Managing my mother\'s bills was overwhelming. BillShield organized everything and told me exactly what to dispute.', saved: '$920' },
    { name: 'Maria C.', role: 'Outpatient surgery', quote: 'The out-of-network flag alone saved me from paying a bill I wasn\'t legally responsible for.', saved: '$1,200' },
  ]

  const faqs = [
    { q: 'Is this legal advice?', a: 'No. BillShield is an informational tool. We flag potential issues and help you ask the right questions — you decide what to do.' },
    { q: 'What file types can I upload?', a: 'PDF bills and EOBs work best. We also accept JPG and PNG images of physical documents.' },
    { q: 'Is my data safe?', a: 'Files are processed in memory and deleted immediately after analysis. We never store your medical documents.' },
    { q: 'Does this work for all insurers?', a: 'Yes. BillShield reads the document text, so it works with any US insurer EOB and provider bill format.' },
    { q: 'What if the AI misses something?', a: 'Our flags are starting points, not verdicts. We use cautious language and always recommend confirming with your provider.' },
  ]

  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16 }
  const sectionLabel = { fontSize: 11, color: T.amber, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 700 }
  const h2 = { fontFamily: T.serif, fontSize: 'clamp(30px,3.5vw,46px)', color: T.bright, margin: '0 0 52px', letterSpacing: '-0.02em', lineHeight: 1.15 }

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Subtle dot-grid background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="100%" height="100%" style={{ opacity: 0.4 }}>
          <defs>
            <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#cbd5e1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Ticker */}
      <div style={{ position: 'relative', zIndex: 10, background: T.amberLight, borderBottom: `1px solid ${T.amberBorder}`, padding: '7px 0', textAlign: 'center', fontSize: 12, color: '#92400e', fontWeight: 500, letterSpacing: '0.03em' }}>
        ✦ &nbsp; {tickerLines[ticker]}
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: scrolled ? 'rgba(248,250,252,0.96)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? `1px solid ${T.border}` : '1px solid transparent', transition: 'all 0.3s', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: T.accent, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#fff', fontFamily: T.serif }}>B</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: T.text }}>BillShield</div>
              <div style={{ fontSize: 11, color: T.dimmer }}>Medical bill clarity, before you panic-pay</div>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: 28, fontSize: 13, color: T.muted }}>
            {[['#problem','The Problem'],['#how','How It Works'],['#features','Features'],['#faq','FAQ']].map(([h, l]) => (
              <a key={h} href={h} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseOver={e => e.target.style.color = T.text} onMouseOut={e => e.target.style.color = T.muted}>{l}</a>
            ))}
          </nav>
          <button onClick={() => inputRef.current?.click()} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.sans, boxShadow: '0 2px 8px rgba(15,23,42,0.2)' }}>
            Upload a Bill
          </button>
          <input ref={inputRef} type="file" multiple accept=".pdf,image/*" style={{ display: 'none' }} onChange={handleChange} />
        </div>
      </header>

      {error && (
        <div style={{ position: 'relative', zIndex: 10, background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '12px 2rem', textAlign: 'center', fontSize: 13, color: '#b91c1c' }}>
          ⚠ {error} — please try again or use the demo case.
        </div>
      )}

      {/* ═══ HERO ════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 2rem 80px' }}>
        {/* Soft emerald tint behind hero */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', background: 'linear-gradient(135deg,rgba(236,253,245,0.6) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 100, padding: '5px 14px', fontSize: 12, color: '#166534', fontWeight: 600, marginBottom: 28 }}>
              Built for patients, caregivers, and families
            </div>
            <h1 style={{ fontFamily: T.serif, fontSize: 'clamp(40px,5vw,62px)', lineHeight: 1.08, margin: '0 0 24px', color: T.bright, letterSpacing: '-0.025em' }}>
              Medical bills are confusing. BillShield helps you fight back.
            </h1>
            <p style={{ fontSize: 17, color: T.muted, lineHeight: 1.75, margin: '0 0 36px', maxWidth: 480 }}>
              Upload your bill and insurance explanation. BillShield explains what you owe, flags what may be wrong, and tells you exactly what to do next.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={onDemo} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: T.sans, boxShadow: '0 4px 12px rgba(15,23,42,0.2)' }}>
                Try Demo Case
              </button>
              <button onClick={() => inputRef.current?.click()} style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>
                Upload Your Bill
              </button>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 28, fontSize: 13, color: T.muted }}>
              {['No legal jargon', 'No billing expertise needed', 'Free to start'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: T.emerald, fontWeight: 700 }}>✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Hero drop card — matches screenshot style exactly */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            style={{ ...card, padding: 28, cursor: 'pointer', boxShadow: '0 20px 60px rgba(15,23,42,0.1)', border: `1px solid ${dragOver ? '#86efac' : T.border}`, transition: 'all 0.2s', background: dragOver ? '#f0fdf4' : T.surface }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${T.borderLight}` }}>
              <div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>ER Visit — March 3</div>
                <div style={{ fontFamily: T.serif, fontSize: 26, color: T.bright, fontWeight: 400 }}>$4,870 billed</div>
              </div>
              <span style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: '#92400e', fontWeight: 600 }}>Needs review</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[['BILLED','$4,870',T.bright],['PAID','$2,900',T.emerald],['YOU OWE','$1,420',T.bright]].map(([l,v,c]) => (
                <div key={l} style={{ background: T.bgAlt, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: T.dimmer, letterSpacing: '0.07em', marginBottom: 6 }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#b91c1c', marginBottom: 2 }}>Duplicate-looking lab charge</div>
                <div style={{ fontSize: 12, color: '#dc2626' }}>Two similar lab fees on the same date deserve review.</div>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 2 }}>EOB mismatch on provider fee</div>
                <div style={{ fontSize: 12, color: '#b45309' }}>Patient balance doesn't clearly match the insurer explanation.</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={e => { e.stopPropagation(); onDemo() }} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.sans }}>Open Demo →</button>
              <div style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px', fontSize: 13, color: T.muted, textAlign: 'center' }}>Upload Bill</div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: T.dimmer }}>drag & drop PDF or image here</div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, background: T.accent, padding: '40px 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { target: 2700, pre: '$', suf: 'B+', label: 'In medical billing errors annually' },
            { target: 30, suf: '%', label: 'Of bills contain at least one error' },
            { target: 1300, pre: '$', label: 'Average overcharge per patient' },
            { target: 72, suf: '%', label: 'Of disputes result in reduction' },
          ].map(({ target, pre = '', suf = '', label }, i) => (
            <div key={label} style={{ padding: '8px 32px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none', textAlign: 'center' }}>
              <div style={{ fontFamily: T.serif, fontSize: 36, color: '#fff', marginBottom: 4, lineHeight: 1 }}>
                <Counter target={target} prefix={pre} suffix={suf} duration={1600} />
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PROBLEM ═════════════════════════════════════════════════════════ */}
      <section id="problem" style={{ position: 'relative', zIndex: 1, padding: '96px 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={sectionLabel}>The Problem</div>
            <h2 style={{ ...h2, maxWidth: 620 }}>Medical billing is designed to confuse you.</h2>
            <p style={{ fontSize: 16, color: T.muted, maxWidth: 540, lineHeight: 1.75, marginBottom: 56 }}>
              Hospitals and insurers operate in completely different systems. You're caught in the middle, expected to reconcile documents that weren't meant to be reconciled.
            </p>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 18 }}>
            {problems.map((p, i) => (
              <Reveal key={p.head} delay={i * 90} dir={i % 2 === 0 ? 'left' : 'right'}>
                <div style={{ ...card, padding: '26px 28px', display: 'flex', gap: 18, alignItems: 'flex-start', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                  <div style={{ fontSize: 22, width: 48, height: 48, background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{p.icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.bright, marginBottom: 6 }}>{p.head}</div>
                    <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{p.body}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150}>
            <div style={{ marginTop: 40, background: '#fffbeb', border: `1px solid ${T.amberBorder}`, borderRadius: 16, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: T.serif, fontSize: 22, color: T.bright, marginBottom: 4 }}>The average patient is overcharged $1,300.</div>
                <div style={{ fontSize: 14, color: T.muted }}>Most never dispute it — because they don't know they can, or how.</div>
              </div>
              <button onClick={onDemo} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.sans, flexShrink: 0 }}>See How We Help →</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ════════════════════════════════════════════════════ */}
      <section id="how" style={{ position: 'relative', zIndex: 1, padding: '96px 2rem', background: T.bgAlt }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={sectionLabel}>How It Works</div>
            <h2 style={h2}>From confusing bill to clear next step</h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, position: 'relative', marginBottom: 64 }}>
            <div style={{ position: 'absolute', top: 40, left: '12.5%', right: '12.5%', height: 1, background: `linear-gradient(90deg,transparent,${T.border},${T.border},${T.border},transparent)` }} />
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 110} dir="up">
                <div style={{ padding: '0 16px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: `0 0 0 5px ${T.bgAlt}, 0 0 0 6px ${T.border}` }}>{s.icon}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.amber, marginBottom: 6, letterSpacing: '0.1em', fontWeight: 600 }}>{s.n}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.bright, marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{s.body}</div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Terminal preview */}
          <Reveal delay={200}>
            <div style={{ background: '#0f172a', borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 48px rgba(15,23,42,0.15)' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />)}
                <span style={{ marginLeft: 10, fontFamily: T.mono, fontSize: 11, color: '#475569' }}>billshield — analysis.log</span>
              </div>
              <div style={{ padding: '22px 28px', fontFamily: T.mono, fontSize: 12, lineHeight: 2.1, color: '#64748b' }}>
                {[
                  ['#22c55e','✓','Extracted 8 line items from hospital_bill.pdf'],
                  ['#22c55e','✓','Matched EOB from BlueCross — claim #882741'],
                  ['#f59e0b','⚠','CPT 71046 appears on 2 documents — possible duplicate'],
                  ['#ef4444','✗','Provider billed $680, EOB allowed $520 — $160 mismatch'],
                  ['#f59e0b','⚠','Out-of-network indicator detected in EOB'],
                  ['#22c55e','✓','Generated 2 dispute letters — ready to send'],
                ].map(([c, sym, msg], i) => (
                  <div key={i} style={{ display: 'flex', gap: 14 }}>
                    <span style={{ color: c, fontWeight: 700 }}>{sym}</span>
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FEATURES ════════════════════════════════════════════════════════ */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '96px 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={sectionLabel}>Features</div>
            <h2 style={h2}>Everything you need to fight back</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 70} dir="up">
                <div style={{ ...card, padding: '26px 28px', boxShadow: '0 2px 12px rgba(15,23,42,0.05)', background: f.highlight ? '#f0fdf4' : T.surface, border: `1px solid ${f.highlight ? '#bbf7d0' : T.border}` }}>
                  <div style={{ fontSize: 22, width: 48, height: 48, background: T.bgAlt, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{f.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: f.highlight ? '#166534' : T.bright, marginBottom: 8 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{f.body}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 2rem', background: T.bgAlt }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={sectionLabel}>Results</div>
            <h2 style={h2}>Patients who fought back</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 110} dir="up">
                <div style={{ ...card, padding: 28, boxShadow: '0 2px 12px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ fontFamily: T.serif, fontSize: 44, color: T.dimmer, lineHeight: 1 }}>"</div>
                  <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.8, margin: 0, marginTop: -18 }}>{t.quote}</p>
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.bright }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: T.dimmer, marginTop: 2 }}>{t.role}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#166534', fontWeight: 600, letterSpacing: '0.05em' }}>SAVED</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.emerald }}>{t.saved}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═════════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ position: 'relative', zIndex: 1, padding: '96px 2rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <div style={sectionLabel}>FAQ</div>
            <h2 style={h2}>Common questions</h2>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 50}>
                <div style={{ ...card, overflow: 'hidden', border: `1px solid ${activeQ === i ? '#86efac' : T.border}`, transition: 'border 0.2s', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                  <button onClick={() => setActiveQ(activeQ === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'none', border: 'none', color: T.bright, cursor: 'pointer', fontFamily: T.sans, fontSize: 14, fontWeight: 700, textAlign: 'left', gap: 16 }}>
                    {f.q}
                    <span style={{ color: T.muted, fontSize: 20, flexShrink: 0, transform: activeQ === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', lineHeight: 1 }}>+</span>
                  </button>
                  {activeQ === i && (
                    <div style={{ padding: '0 22px 18px', fontSize: 14, color: T.muted, lineHeight: 1.75 }}>{f.a}</div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 2rem 100px', background: T.bgAlt }}>
        <Reveal>
          <div style={{ maxWidth: 880, margin: '0 auto', background: T.accent, borderRadius: 24, padding: '64px', textAlign: 'center', boxShadow: '0 24px 80px rgba(15,23,42,0.2)' }}>
            <div style={{ fontFamily: T.serif, fontSize: 'clamp(28px,4vw,46px)', color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Before you pay a confusing medical bill,<br />let BillShield review it with you.
            </div>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', margin: '0 0 40px', lineHeight: 1.65 }}>
              Get clarity, identify what may need review, and take the next step with confidence.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => inputRef.current?.click()} style={{ background: '#fff', color: T.accent, border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: T.sans }}>Upload a Bill</button>
              <button onClick={onDemo} style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: '14px 32px', fontSize: 14, cursor: 'pointer', fontFamily: T.sans }}>Try Demo Case</button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${T.border}`, padding: '28px 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: T.accent, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>B</div>
          <span style={{ fontSize: 13, color: T.muted }}>BillShield</span>
        </div>
        <div style={{ fontSize: 12, color: T.dimmer }}>For informational purposes only · Not legal or medical advice</div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: T.dimmer }}>
          {['Privacy', 'Terms', 'Contact'].map(l => <span key={l} style={{ cursor: 'pointer' }}>{l}</span>)}
        </div>
      </footer>
    </div>
  )
}

function Uploading() {
  const steps=['Uploading documents…','Extracting text & charges…','Detecting anomalies…','Generating action plan…']
  const [index,setIndex]=useState(0)
  useEffect(()=>{const t=setInterval(()=>setIndex(p=>Math.min(p+1,steps.length-1)),3500);return()=>clearInterval(t)},[])
  return (
    <div style={{background:'#0a0c10',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",color:'#e8eaf0'}}>
      <div style={{width:80,height:80,background:'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))',border:'1px solid rgba(245,158,11,0.25)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,marginBottom:32,boxShadow:'0 0 40px rgba(245,158,11,0.1)'}}>🛡️</div>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:'#f0f2f8',marginBottom:12}}>Analyzing your documents</div>
      <div style={{fontSize:14,color:'#5a6478',marginBottom:32,fontFamily:"'JetBrains Mono',monospace"}}>{steps[index]}</div>
      <div style={{display:'flex',gap:8}}>
        {steps.map((_,i)=><div key={i} style={{height:3,width:i<=index?32:8,borderRadius:2,background:i<=index?'#f59e0b':'rgba(255,255,255,0.08)',transition:'all 0.4s ease'}} />)}
      </div>
      <div style={{marginTop:24,fontSize:12,color:'#3a4055'}}>This may take 15–30 seconds</div>
    </div>
  )
}

function Dashboard({data,onBack}) {
  const [tab,setTab]=useState('overview')
  const [selIssue,setSelIssue]=useState(data.issues?.[0]||null)
  const [selAction,setSelAction]=useState(data.actions?.[0]||null)
  const [showDraft,setShowDraft]=useState(true)
  const [done,setDone]=useState([])
  const issues=data.issues||[], actions=data.actions||[], timeline=data.timeline||[]
  const stats=data.issueStats||{}, actStats=data.actionStats||{}

  // Light theme tokens — matches landing exactly
  const T = {
    bg:'#f8fafc', bgAlt:'#f1f5f9', surface:'#ffffff',
    border:'#e2e8f0', borderLight:'#f1f5f9',
    text:'#0f172a', muted:'#64748b', dimmer:'#94a3b8',
    accent:'#0f172a', emerald:'#059669', rose:'#e11d48',
    amber:'#d97706', sans:"'DM Sans',sans-serif", serif:"'DM Serif Display',serif", mono:"'JetBrains Mono',monospace",
  }
  const card = {background:T.surface, border:`1px solid ${T.border}`, borderRadius:16}

  const tabs=[
    {id:'overview',label:'Overview',icon:'▣'},
    {id:'issues',label:'Issues',icon:'⚠',badge:stats.total},
    {id:'actions',label:'Actions',icon:'✉',badge:actions.length-done.length},
    {id:'financial',label:'Financial',icon:'＄'},
    {id:'timeline',label:'Timeline',icon:'⏱'},
  ]

  return (
    <div style={{background:T.bg,minHeight:'100vh',fontFamily:T.sans,color:T.text,display:'flex'}}>

      {/* Sidebar */}
      <aside style={{width:224,borderRight:`1px solid ${T.border}`,background:T.surface,display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',flexShrink:0}}>
        <div style={{padding:'20px 20px 16px',borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,background:T.accent,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',fontFamily:T.serif}}>B</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.text}}>BillShield</div>
              <div style={{fontSize:10,color:T.dimmer}}>Case workspace</div>
            </div>
          </div>
        </div>

        <nav style={{padding:'10px 10px',flex:1}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 12px',borderRadius:10,border:'none',cursor:'pointer',fontFamily:T.sans,fontSize:13,fontWeight:tab===t.id?700:400,background:tab===t.id?T.bgAlt:'transparent',color:tab===t.id?T.text:T.muted,marginBottom:2,transition:'all 0.15s',justifyContent:'space-between'}}>
              <span style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:12}}>{t.icon}</span>{t.label}</span>
              {t.badge>0&&<span style={{background:t.id==='issues'?'#fef2f2':'#f1f5f9',color:t.id==='issues'?'#b91c1c':T.muted,borderRadius:6,padding:'1px 7px',fontSize:11,fontWeight:700,border:`1px solid ${t.id==='issues'?'#fecaca':T.border}`}}>{t.badge}</span>}
            </button>
          ))}
        </nav>

        <div style={{padding:'12px 14px',borderTop:`1px solid ${T.border}`}}>
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:'14px 16px',marginBottom:10}}>
            <div style={{fontSize:10,color:'#166534',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:600,marginBottom:4}}>Potential Savings</div>
            <div style={{fontFamily:T.serif,fontSize:26,color:T.emerald,lineHeight:1}}>${(data.potentialSavings||0).toLocaleString()}</div>
            <div style={{fontSize:11,color:'#4ade80',marginTop:4}}>if issues corrected</div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'0 2px'}}>
            <span style={{color:T.dimmer}}>Due in</span>
            <span style={{color:(data.daysUntilDue||99)<=7?T.rose:T.amber,fontWeight:700}}>{data.daysUntilDue||'—'} days</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Top bar */}
        <div style={{borderBottom:`1px solid ${T.border}`,padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',background:T.surface}}>
          <div>
            <div style={{fontSize:11,color:T.dimmer,letterSpacing:'0.06em',textTransform:'uppercase'}}>{data.eventType} · {data.dateOfService}</div>
            <div style={{fontSize:18,fontWeight:700,color:T.text,marginTop:2,letterSpacing:'-0.02em'}}>Billing Dashboard</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <div style={{display:'flex',gap:2}}>
              {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'6px 10px',borderRadius:8,border:'none',background:tab===t.id?T.bgAlt:'transparent',color:tab===t.id?T.text:T.dimmer,cursor:'pointer',fontSize:14,fontFamily:T.sans}}>{t.icon}</button>)}
            </div>
            <button onClick={onBack} style={{background:T.bgAlt,border:`1px solid ${T.border}`,color:T.muted,borderRadius:10,padding:'7px 16px',fontSize:13,cursor:'pointer',fontFamily:T.sans}}>← Back</button>
            <button onClick={onBack} style={{background:T.accent,border:'none',color:'#fff',borderRadius:10,padding:'7px 16px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:T.sans}}>New Review</button>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:24,background:T.bg}}>

          {/* ── OVERVIEW ── */}
          {tab==='overview'&&(
            <div style={{display:'flex',flexDirection:'column',gap:18}}>

              {/* Row 1: headline metrics */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
                <LightMetricCard label="Total Billed" value={`$${(data.totalBilled||0).toLocaleString()}`} sub="Provider + facility" valueColor={T.text} accent="#64748b" chart={[40,55,48,66,60,46,72]} />
                <LightMetricCard label="Insurance Paid" value={`$${(data.insurerPaid||0).toLocaleString()}`} sub={data.insurerName||'Insurer'} valueColor={T.emerald} accent={T.emerald} chart={[30,42,38,50,44,36,55]} />
                <LightMetricCard label="You May Owe" value={`$${(data.patientOwes||0).toLocaleString()}`} sub="Current estimate" valueColor={T.text} accent="#64748b" chart={[20,28,22,30,26,20,28]} />
                <LightMetricCard label="Disputable Amount" value={`$${(data.disputeAmount||0).toLocaleString()}`} sub={`${stats.high||0} high-priority issues`} valueColor={T.rose} accent={T.rose} chart={[10,18,14,22,18,12,20]} urgent />
              </div>

              {/* Row 2: case clarity + issue detection */}
              <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14}}>

                <div style={{...card,padding:22,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:16}}>Case Clarity</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    {[
                      ['📎','Documents Linked',data.documentsLinked||2,false],
                      ['📅','Date of Service',data.dateOfService||'—',false],
                      ['⏰','Due Date',data.dueDate||'—',(data.daysUntilDue||99)<=7],
                      ['🏥','Providers',data.providerCount||1,false],
                      ['🌐','Out-of-Network',data.outOfNetworkConcern?'Detected ⚠':'Not detected',data.outOfNetworkConcern],
                      ['📊','Est. Mismatch',data.estimateMismatch?'Yes ⚠':'No',data.estimateMismatch],
                    ].map(([icon,l,v,u])=>(
                      <div key={l} style={{padding:'10px 12px',background:u?'#fffbeb':T.bgAlt,border:`1px solid ${u?'#fde68a':T.border}`,borderRadius:10}}>
                        <div style={{fontSize:10,color:T.dimmer,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{icon} {l}</div>
                        <div style={{fontSize:13,fontWeight:600,color:u?T.amber:T.text}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Match confidence */}
                  <div style={{marginTop:16,padding:'14px 16px',background:T.bgAlt,borderRadius:10,border:`1px solid ${T.border}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:12}}>
                      <span style={{color:T.muted}}>Bill ↔ EOB Match Confidence</span>
                      <span style={{color:T.amber,fontWeight:700,fontFamily:T.mono}}>{data.matchConfidence||0}%</span>
                    </div>
                    <div style={{height:6,background:T.border,borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${data.matchConfidence||0}%`,background:`linear-gradient(90deg,${(data.matchConfidence||0)>=80?'#059669':(data.matchConfidence||0)>=60?'#d97706':'#e11d48'},${(data.matchConfidence||0)>=80?'#10b981':(data.matchConfidence||0)>=60?'#f59e0b':'#f43f5e'})`,borderRadius:3}} />
                    </div>
                  </div>
                </div>

                <div style={{...card,padding:22,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:16}}>Issue Detection</div>
                  <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14}}>
                    {[['High Priority',stats.high||0,'#e11d48'],['Medium Priority',stats.medium||0,'#d97706'],['Low Priority',stats.low||0,'#059669']].map(([l,v,c])=>(
                      <div key={l}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:12}}>
                          <span style={{color:T.muted}}>{l}</span>
                          <span style={{color:c,fontWeight:700,fontFamily:T.mono}}>{v}</span>
                        </div>
                        <div style={{height:5,background:T.bgAlt,borderRadius:3,overflow:'hidden',border:`1px solid ${T.border}`}}>
                          <div style={{height:'100%',width:`${(stats.total||1)>0?(v/(stats.total||1))*100:0}%`,background:c,borderRadius:3,transition:'width 0.8s ease'}} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {[['Duplicates',stats.duplicates||0,stats.duplicates>0?'#e11d48':T.dimmer],['Mismatches',stats.mismatches||0,stats.mismatches>0?'#d97706':T.dimmer],['Itemization',stats.itemizationNeeded||0,stats.itemizationNeeded>0?'#d97706':T.dimmer],['Total',stats.total||0,T.muted]].map(([l,v,c])=>(
                      <div key={l} style={{padding:'8px 12px',background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:11,color:T.muted}}>{l}</span>
                        <span style={{fontSize:15,fontWeight:700,color:c,fontFamily:T.serif}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: action metrics */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
                {[
                  {label:'Next Action',value:actions[0]?.title||'None',color:T.text,onClick:()=>setTab('actions'),sub:'Click to view →'},
                  {label:'Actions Generated',value:actions.length,sub:`${done.length} completed`,color:T.text,numBig:true},
                  {label:'Due In',value:`${data.daysUntilDue||'?'} days`,color:(data.daysUntilDue||99)<=7?T.rose:T.amber,urgent:(data.daysUntilDue||99)<=7},
                  {label:'Response Status',value:actStats.awaitingResponse?'Awaiting':'Not sent',color:actStats.awaitingResponse?T.amber:T.dimmer},
                ].map(({label,value,sub,color,urgent,onClick,numBig})=>(
                  <div key={label} onClick={onClick} style={{...card,padding:20,cursor:onClick?'pointer':'default',background:urgent?'#fef2f2':T.surface,border:`1px solid ${urgent?'#fecaca':T.border}`,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                    <div style={{fontSize:10,color:T.dimmer,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10,fontWeight:500}}>{label}</div>
                    <div style={{fontSize:numBig?32:14,fontWeight:numBig?400:600,color,fontFamily:numBig?T.serif:T.sans,lineHeight:1.2,marginBottom:sub?4:0}}>{value}</div>
                    {sub&&<div style={{fontSize:12,color:T.dimmer,marginTop:4}}>{sub}</div>}
                  </div>
                ))}
              </div>

              {/* Issues list */}
              <div style={{...card,padding:22,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.text}}>Detected Issues</div>
                  <button onClick={()=>setTab('issues')} style={{fontSize:12,color:T.muted,background:'none',border:'none',cursor:'pointer',fontFamily:T.sans}}>View all →</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {issues.map(issue=>{
                    const isHigh=issue.severity==='high', isMed=issue.severity==='medium'
                    const bg=isHigh?'#fef2f2':isMed?'#fffbeb':'#f0fdf4'
                    const border=isHigh?'#fecaca':isMed?'#fde68a':'#bbf7d0'
                    const dot=isHigh?'#e11d48':isMed?'#d97706':'#059669'
                    const riskColor=isHigh?'#b91c1c':isMed?'#92400e':'#166534'
                    return(
                      <button key={issue.id} onClick={()=>{setSelIssue(issue);setTab('issues')}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderRadius:12,border:`1px solid ${border}`,background:bg,cursor:'pointer',fontFamily:T.sans,textAlign:'left',width:'100%'}}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:dot,flexShrink:0}} />
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:T.text}}>{issue.title}</div>
                            <div style={{fontSize:12,color:T.muted,marginTop:2}}>{issue.description}</div>
                          </div>
                        </div>
                        <div style={{flexShrink:0,textAlign:'right',marginLeft:16}}>
                          <div style={{fontSize:13,fontWeight:700,color:riskColor}}>${(issue.amountAtRisk||0).toLocaleString()}</div>
                          <div style={{fontSize:10,color:T.dimmer}}>at risk</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── ISSUES ── */}
          {tab==='issues'&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
              <div style={{...card,padding:22,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:16}}>Detected Issues</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {issues.map(issue=>{
                    const isHigh=issue.severity==='high',isMed=issue.severity==='medium'
                    const bg=isHigh?'#fef2f2':isMed?'#fffbeb':'#f0fdf4'
                    const border=isHigh?'#fecaca':isMed?'#fde68a':'#bbf7d0'
                    const dot=isHigh?'#e11d48':isMed?'#d97706':'#059669'
                    const badgeBg=isHigh?'#fef2f2':isMed?'#fffbeb':'#f0fdf4'
                    const badgeColor=isHigh?'#b91c1c':isMed?'#92400e':'#166534'
                    return(
                      <button key={issue.id} onClick={()=>setSelIssue(issue)} style={{padding:'14px 16px',borderRadius:12,border:`1px solid ${selIssue?.id===issue.id?dot:border}`,background:selIssue?.id===issue.id?bg:'#fff',cursor:'pointer',textAlign:'left',width:'100%',fontFamily:T.sans,outline:'none'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                              <div style={{width:7,height:7,borderRadius:'50%',background:dot,flexShrink:0}} />
                              <span style={{fontSize:13,fontWeight:600,color:T.text}}>{issue.title}</span>
                            </div>
                            <div style={{fontSize:12,color:T.muted,lineHeight:1.5,paddingLeft:15}}>{issue.description}</div>
                          </div>
                          <div style={{fontSize:11,background:badgeBg,color:badgeColor,border:`1px solid ${border}`,borderRadius:6,padding:'2px 8px',fontWeight:700,textTransform:'uppercase',flexShrink:0}}>{issue.severity}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{...card,padding:22,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:16}}>Issue Detail</div>
                {selIssue&&(()=>{
                  const isHigh=selIssue.severity==='high',isMed=selIssue.severity==='medium'
                  const bg=isHigh?'#fef2f2':isMed?'#fffbeb':'#f0fdf4'
                  const border=isHigh?'#fecaca':isMed?'#fde68a':'#bbf7d0'
                  const color=isHigh?'#b91c1c':isMed?'#92400e':'#166534'
                  return(
                    <div>
                      <div style={{padding:16,background:bg,border:`1px solid ${border}`,borderRadius:12,marginBottom:16}}>
                        <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:6}}>{selIssue.title}</div>
                        <div style={{fontSize:13,color:T.muted,lineHeight:1.65}}>{selIssue.description}</div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                        {[['Severity',selIssue.severity,color],['Confidence',`${Math.round((selIssue.confidence||0)*100)}%`,T.amber],['Amount at Risk',`$${(selIssue.amountAtRisk||0).toLocaleString()}`,'#b91c1c'],['Type',selIssue.type||'Other',T.muted]].map(([l,v,vc])=>(
                          <div key={l} style={{padding:'12px 14px',background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:10}}>
                            <div style={{fontSize:10,color:T.dimmer,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{l}</div>
                            <div style={{fontSize:14,fontWeight:700,color:vc,textTransform:l==='Severity'?'capitalize':'none'}}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <button onClick={()=>setTab('actions')} style={{marginTop:14,width:'100%',background:T.bgAlt,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,padding:'11px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:T.sans}}>View Recommended Actions →</button>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* ── ACTIONS ── */}
          {tab==='actions'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {actions.length>1&&(
                <div style={{...card,padding:20,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:12}}>Available Actions</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {actions.map(a=>(
                      <button key={a.id} onClick={()=>setSelAction(a)} style={{padding:'9px 16px',borderRadius:10,border:`1px solid ${selAction?.id===a.id?T.text:T.border}`,background:selAction?.id===a.id?T.text:T.surface,color:selAction?.id===a.id?'#fff':T.muted,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:T.sans,display:'flex',alignItems:'center',gap:8}}>
                        {a.icon} {a.title}
                        {done.includes(a.id)&&<span style={{fontSize:11,color:'#22c55e'}}>✓</span>}
                        {a.priority==='urgent'&&!done.includes(a.id)&&<span style={{fontSize:9,background:'#fef2f2',color:'#b91c1c',borderRadius:4,padding:'2px 6px',fontWeight:700,border:'1px solid #fecaca'}}>URGENT</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selAction&&(
                <div style={{...card,padding:24,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                    <div>
                      <div style={{fontSize:16,fontWeight:700,color:T.text}}>{selAction.icon} {selAction.title}</div>
                      <div style={{fontSize:13,color:T.muted,marginTop:4}}>{selAction.whyItMatters}</div>
                    </div>
                    {selAction.dueInDays&&(
                      <div style={{background:selAction.dueInDays<=3?'#fef2f2':'#fffbeb',border:`1px solid ${selAction.dueInDays<=3?'#fecaca':'#fde68a'}`,borderRadius:10,padding:'8px 14px',textAlign:'center',flexShrink:0}}>
                        <div style={{fontSize:20,fontWeight:700,color:selAction.dueInDays<=3?'#b91c1c':'#92400e',fontFamily:T.serif}}>{selAction.dueInDays}</div>
                        <div style={{fontSize:10,color:T.dimmer}}>days left</div>
                      </div>
                    )}
                  </div>
                  <div style={{background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:12,padding:'18px 20px',fontFamily:T.mono,fontSize:12,lineHeight:1.9,color:T.muted,whiteSpace:'pre-wrap',marginBottom:14,maxHeight:300,overflowY:'auto'}}>
                    {showDraft?(selAction.draft||selAction.script||''):'— hidden —'}
                  </div>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    <button onClick={()=>navigator.clipboard.writeText(selAction.draft||selAction.script||'').catch(()=>{})} style={{background:T.accent,color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:T.sans}}>Copy Draft</button>
                    <button onClick={()=>setShowDraft(p=>!p)} style={{background:T.bgAlt,border:`1px solid ${T.border}`,color:T.muted,borderRadius:10,padding:'10px 20px',fontSize:13,cursor:'pointer',fontFamily:T.sans}}>{showDraft?'Hide':'Show'} Draft</button>
                    {done.includes(selAction.id)
                      ?<span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#166534',borderRadius:10,padding:'10px 16px',fontSize:13,fontWeight:700}}>✓ Completed</span>
                      :<button onClick={()=>setDone(p=>[...p,selAction.id])} style={{marginLeft:'auto',background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#166534',borderRadius:10,padding:'10px 16px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:T.sans}}>Mark Done ✓</button>
                    }
                  </div>
                </div>
              )}

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
                {[['Provider Contacted',actStats.providerContacted],['Insurer Contacted',actStats.insurerContacted],['Awaiting Response',actStats.awaitingResponse]].map(([l,v])=>(
                  <div key={l} style={{...card,padding:18,display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                    <div style={{fontSize:13,color:T.muted}}>{l}</div>
                    <div style={{width:28,height:28,borderRadius:'50%',background:v?'#f0fdf4':T.bgAlt,border:`1px solid ${v?'#bbf7d0':T.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:v?'#166534':T.dimmer,fontWeight:700}}>{v?'✓':'○'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FINANCIAL ── */}
          {tab==='financial'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
                {[
                  ['Total Billed',    data.totalBilled||0,             T.text,    'Full amount charged by providers'],
                  ['Insurance Paid',  data.insurerPaid||0,             T.emerald, 'Covered by your plan'],
                  ['You May Owe',     data.patientOwes||0,             T.text,    'Current patient responsibility'],
                  ['Under Review',    data.amountUnderReview||0,       '#6366f1', 'Being verified or disputed'],
                  ['Potential Savings',data.potentialSavings||0,       T.emerald, 'If flagged issues resolved'],
                  ['Overcharge Risk', data.estimatedOverchargeRisk||0, T.rose,    'Estimated billing errors'],
                ].map(([l,v,c,s])=>(
                  <div key={l} style={{...card,padding:20,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                    <div style={{fontSize:10,color:T.dimmer,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10,fontWeight:500}}>{l}</div>
                    <div style={{fontFamily:T.serif,fontSize:34,color:c,lineHeight:1,marginBottom:6}}>${v.toLocaleString()}</div>
                    <div style={{fontSize:12,color:T.dimmer,marginBottom:14}}>{s}</div>
                    <div style={{height:4,background:T.bgAlt,borderRadius:2,overflow:'hidden',border:`1px solid ${T.border}`}}>
                      <div style={{height:'100%',width:`${Math.min((v/(data.totalBilled||1))*100,100)}%`,background:c,borderRadius:2,opacity:0.7}} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{...card,padding:24,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:20}}>Bill Breakdown</div>
                <div style={{display:'flex',gap:40,alignItems:'center'}}>
                  <LightDonutChart
                    segments={[
                      {value:data.insurerPaid||0,color:T.emerald},
                      {value:Math.max((data.patientOwes||0)-(data.disputeAmount||0),0),color:'#d97706'},
                      {value:data.disputeAmount||0,color:T.rose},
                    ]}
                    total={data.totalBilled||1}
                  />
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:14}}>
                    {[['Insurance Paid',data.insurerPaid||0,T.emerald],['Confirmed Owed',Math.max((data.patientOwes||0)-(data.disputeAmount||0),0),'#d97706'],['Disputable',data.disputeAmount||0,T.rose]].map(([l,v,c])=>(
                      <div key={l}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:13}}>
                          <span style={{display:'flex',alignItems:'center',gap:8,color:T.muted}}><span style={{width:9,height:9,borderRadius:'50%',background:c,display:'inline-block'}} />{l}</span>
                          <span style={{color:c,fontWeight:700}}>${v.toLocaleString()}</span>
                        </div>
                        <div style={{height:5,background:T.bgAlt,borderRadius:3,overflow:'hidden',border:`1px solid ${T.border}`}}>
                          <div style={{height:'100%',width:`${(v/(data.totalBilled||1))*100}%`,background:c,borderRadius:3}} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TIMELINE ── */}
          {tab==='timeline'&&(
            <div style={{...card,padding:28,maxWidth:600,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
              <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:24}}>Case Timeline</div>
              {timeline.map((event,i)=>(
                <div key={event.id} style={{display:'flex',gap:16}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:2}}>
                    <div style={{width:12,height:12,borderRadius:'50%',background:event.completed?T.emerald:T.border,border:`2px solid ${event.completed?T.emerald:T.border}`,flexShrink:0}} />
                    {i<timeline.length-1&&<div style={{width:1,flex:1,background:event.completed?'#bbf7d0':T.border,minHeight:28,margin:'4px 0'}} />}
                  </div>
                  <div style={{paddingBottom:24}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:13,fontWeight:event.completed?600:400,color:event.completed?T.text:T.dimmer}}>{event.label}</span>
                      {event.completed&&<span style={{fontSize:10,color:'#166534',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:4,padding:'1px 7px',fontWeight:600}}>Done</span>}
                    </div>
                    {event.date&&<div style={{fontSize:11,color:T.dimmer,marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{event.date}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function LightMetricCard({label,value,sub,valueColor,accent,chart,urgent}) {
  const max=Math.max(...chart)
  return(
    <div style={{background:urgent?'#fef2f2':'#ffffff',border:`1px solid ${urgent?'#fecaca':'#e2e8f0'}`,borderRadius:16,padding:'20px 20px 16px',overflow:'hidden',boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
      <div style={{fontSize:10,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10,fontWeight:500}}>{label}</div>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:30,color:valueColor,lineHeight:1,marginBottom:4}}>{value}</div>
      <div style={{fontSize:12,color:'#94a3b8',marginBottom:14}}>{sub}</div>
      <div style={{display:'flex',alignItems:'flex-end',gap:3,height:24}}>
        {chart.map((v,i)=><div key={i} style={{flex:1,borderRadius:2,background:i===chart.length-1?accent:`${accent}30`,height:`${(v/max)*100}%`,minHeight:2}} />)}
      </div>
    </div>
  )
}

function LightDonutChart({segments,total}) {
  const size=140,cx=70,cy=70,r=52,stroke=18
  let cumAngle=-90
  const paths=segments.map(seg=>{
    const angle=(seg.value/total)*360
    const sa=(cumAngle*Math.PI)/180; cumAngle+=angle; const ea=(cumAngle*Math.PI)/180
    const x1=cx+r*Math.cos(sa),y1=cy+r*Math.sin(sa),x2=cx+r*Math.cos(ea),y2=cy+r*Math.sin(ea)
    return{path:`M ${x1} ${y1} A ${r} ${r} 0 ${angle>180?1:0} 1 ${x2} ${y2}`,color:seg.color}
  })
  return(
    <svg width={size} height={size} style={{flexShrink:0}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      {paths.map((p,i)=><path key={i} d={p.path} fill="none" stroke={p.color} strokeWidth={stroke} strokeLinecap="round" opacity={0.9} />)}
      <text x={cx} y={cy-4} textAnchor="middle" fill="#0f172a" fontSize="13" fontFamily="DM Serif Display,serif" fontWeight="bold">${Math.round(total/1000)}k</text>
      <text x={cx} y={cy+12} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="DM Sans,sans-serif">total billed</text>
    </svg>
  )
}

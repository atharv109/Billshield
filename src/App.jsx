import { useEffect, useRef, useState } from 'react'

const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap'
document.head.appendChild(fontLink)

// ─── Mobile hook ──────────────────────────────────────────────────────────────
function useMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg:'#f8fafc', bgAlt:'#f1f5f9', surface:'#ffffff',
  border:'#e2e8f0', borderLight:'#f1f5f9',
  text:'#0f172a', muted:'#64748b', dimmer:'#94a3b8',
  accent:'#0f172a', emerald:'#059669', rose:'#e11d48',
  amber:'#d97706', amberLight:'#fef3c7', amberBorder:'#fde68a',
  sans:"'DM Sans',sans-serif", serif:"'DM Serif Display',serif", mono:"'JetBrains Mono',monospace",
}

const DEMO = {
  id:'demo-001', eventType:'Emergency Room Visit', dateOfService:'March 3, 2025',
  dueDate:'April 4, 2025', daysUntilDue:7, totalBilled:4870, insurerPaid:2900,
  patientOwes:1420, disputeAmount:1250, amountUnderReview:850, amountResolved:0,
  potentialSavings:420, estimatedOverchargeRisk:340,
  providerName:'St. Vincent Medical Center', insurerName:'BlueCross BlueShield',
  providerCount:2, documentsLinked:4, matchConfidence:72,
  outOfNetworkConcern:true, estimateMismatch:false,
  issues:[
    {id:'i1',severity:'high',  title:'Duplicate lab charge',      description:'Two identical lab fees billed same date. Only one likely valid.',               type:'duplicate',   confidence:0.87,amountAtRisk:340},
    {id:'i2',severity:'high',  title:'EOB provider fee mismatch', description:'Provider billed $680 but insurer EOB shows only $520 allowed.',                type:'mismatch',    confidence:0.71,amountAtRisk:160},
    {id:'i3',severity:'medium',title:'Itemization needed',        description:'Three charges grouped under one line item — cannot be independently verified.',type:'itemization', confidence:0.95,amountAtRisk:350},
  ],
  issueStats:{total:3,high:2,medium:1,low:0,duplicates:1,mismatches:1,itemizationNeeded:1},
  actions:[
    {id:'a1',title:'Request itemized bill',    icon:'📄',type:'letter', priority:'urgent',whyItMatters:'Itemization reveals hidden errors and is your legal right.',draft:`Dear St. Vincent Medical Center Billing,\n\nI am writing to request a complete itemized bill for services on March 3, 2025 (Account #[YOUR ACCOUNT]).\n\nPlease include each service with CPT code, date, and individual charge amount.\n\nThank you,\n[YOUR NAME]`,dueInDays:3},
    {id:'a2',title:'Dispute duplicate charge', icon:'⚠️',type:'dispute',priority:'urgent',whyItMatters:'Duplicate billing is one of the most common errors.',draft:`Dear Billing Department,\n\nI have identified a potential duplicate charge on my bill from March 3, 2025.\n\nThe same lab fee appears twice. Please review and issue a corrected statement.\n\nSincerely,\n[YOUR NAME]`,dueInDays:7},
  ],
  actionStats:{total:2,completed:0,providerContacted:false,insurerContacted:false,awaitingResponse:false,nextFollowUpDate:'Apr 11, 2025'},
  timeline:[
    {id:'tl-1',label:'Bill uploaded',     completed:true, date:'Mar 25'},
    {id:'tl-2',label:'Text extracted',    completed:true, date:'Mar 25'},
    {id:'tl-3',label:'Issues flagged',    completed:true, date:'Mar 25'},
    {id:'tl-4',label:'Actions generated', completed:true, date:'Mar 25'},
    {id:'tl-5',label:'Provider contacted',completed:false,date:''},
    {id:'tl-6',label:'Insurer contacted', completed:false,date:''},
    {id:'tl-7',label:'Awaiting reply',    completed:false,date:''},
    {id:'tl-8',label:'Resolved',          completed:false,date:''},
  ],
  assignedReviewer:'You',caseOwner:'Patient',lastActionTaken:'Case opened',tasksPending:2,documentsMissing:1,
}

async function uploadAndAnalyze(files) {
  const form = new FormData()
  for (const f of files) form.append('files', f)
  const API = import.meta.env.VITE_API_URL || ''
  const res = await fetch(`${API}/api/upload`, {method:'POST',body:form})
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error||'Upload failed') }
  return res.json()
}

export default function App() {
  const [view,setView] = useState('landing')
  const [caseData,setCaseData] = useState(null)
  const [error,setError] = useState(null)
  function handleFiles(files) {
    setError(null); setView('uploading')
    uploadAndAnalyze(files).then(d=>{setCaseData(d);setView('dashboard')}).catch(e=>{setError(e.message);setView('landing')})
  }
  return (
    <div style={{fontFamily:T.sans,minHeight:'100vh'}}>
      {view==='landing'   && <Landing onFiles={handleFiles} onDemo={()=>{setCaseData(DEMO);setView('dashboard')}} error={error} />}
      {view==='uploading' && <Uploading />}
      {view==='dashboard' && <Dashboard data={caseData||DEMO} onBack={()=>setView('landing')} />}
    </div>
  )
}

// ─── Scroll reveal ────────────────────────────────────────────────────────────
function useReveal(threshold=0.12) {
  const ref=useRef(null); const [visible,setVisible]=useState(false)
  useEffect(()=>{
    const el=ref.current; if(!el) return
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVisible(true);obs.disconnect()}},{threshold})
    obs.observe(el); return()=>obs.disconnect()
  },[])
  return [ref,visible]
}
function Reveal({children,delay=0,dir='up',style={}}) {
  const [ref,visible]=useReveal()
  const tx=dir==='left'?'-24px':dir==='right'?'24px':'0'
  const ty=dir==='up'?'24px':'0'
  return <div ref={ref} style={{opacity:visible?1:0,transform:visible?'translate(0,0)':`translate(${tx},${ty})`,transition:`opacity 0.6s ease ${delay}ms,transform 0.6s ease ${delay}ms`,...style}}>{children}</div>
}
function Counter({target,prefix='',suffix='',duration=1600}) {
  const [val,setVal]=useState(0); const [ref,visible]=useReveal(0.3)
  useEffect(()=>{
    if(!visible) return
    const start=Date.now()
    const tick=()=>{const p=Math.min((Date.now()-start)/duration,1);const e=1-Math.pow(1-p,3);setVal(Math.round(e*target));if(p<1) requestAnimationFrame(tick)}
    requestAnimationFrame(tick)
  },[visible])
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANDING
// ═══════════════════════════════════════════════════════════════════════════════
function Landing({onFiles,onDemo,error}) {
  const inputRef=useRef(null)
  const [dragOver,setDragOver]=useState(false)
  const [scrolled,setScrolled]=useState(false)
  const [activeQ,setActiveQ]=useState(null)
  const [ticker,setTicker]=useState(0)
  const mobile=useMobile()

  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>20);window.addEventListener('scroll',fn);return()=>window.removeEventListener('scroll',fn)},[])
  const tickerLines=['$1,300 average overcharge per patient','30% of bills contain errors','72% of disputes result in reduction','You have the right to an itemized bill','Duplicate charges are the #1 billing error']
  useEffect(()=>{const t=setInterval(()=>setTicker(p=>(p+1)%tickerLines.length),3400);return()=>clearInterval(t)},[])

  const handleChange=e=>{const f=Array.from(e.target.files||[]);if(f.length) onFiles(f)}
  const handleDrop=e=>{e.preventDefault();setDragOver(false);const f=Array.from(e.dataTransfer.files);if(f.length) onFiles(f)}

  const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:16}
  const sectionLabel={fontSize:11,color:T.amber,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12,fontWeight:700}
  const h2={fontFamily:T.serif,fontSize:'clamp(28px,4vw,46px)',color:T.text,margin:'0 0 48px',letterSpacing:'-0.02em',lineHeight:1.15}
  const px=mobile?'1.25rem':'2rem'

  const problems=[
    {icon:'🔢',head:'Indecipherable codes',body:'CPT codes, DRG codes, revenue codes — providers speak a language patients were never meant to understand.'},
    {icon:'📬',head:'Bills arrive in waves',body:'Hospital, physician group, radiology — each sends a separate bill weeks apart. Nothing adds up.'},
    {icon:'📋',head:"EOBs don't explain",body:'"Not a bill" — then what is it? Explanations of Benefits explain nothing to the average patient.'},
    {icon:'⏳',head:'Deadlines pressure you',body:'Due dates arrive before you\'ve had time to question anything. Stress drives premature payment.'},
  ]
  const steps=[
    {n:'01',title:'Upload',body:'Drop your PDF bill, EOB, or photo.',icon:'📤'},
    {n:'02',title:'Extract',body:'AI reads every charge, code, and amount.',icon:'🔬'},
    {n:'03',title:'Detect',body:'Flags duplicates, mismatches, and unclear charges.',icon:'⚡'},
    {n:'04',title:'Act',body:'Get exact scripts and letters — ready to send.',icon:'✉️'},
  ]
  const features=[
    {icon:'⚡',title:'Instant AI Analysis',body:'Upload a bill and get a full structured analysis in under 30 seconds.',highlight:true},
    {icon:'🔍',title:'Duplicate Detection',body:'Cross-references line items across multiple bills for the same date of service.'},
    {icon:'📊',title:'EOB Comparison',body:"Matches every charge on your bill against your insurer's explanation."},
    {icon:'✉️',title:'Dispute Drafts',body:'Generates professional letters and call scripts. Ready to send immediately.'},
    {icon:'📈',title:'Financial Metrics',body:"See exactly what's at risk, what you could save, and what's been resolved."},
    {icon:'🛡️',title:'Case Tracking',body:'Every document, flag, and action tracked in one organized workspace.'},
  ]
  const testimonials=[
    {name:'Sarah M.',role:'ER patient, Chicago',quote:'I found a $380 duplicate charge I never would have caught. BillShield paid for itself in 2 minutes.',saved:'$380'},
    {name:'James T.',role:'Caregiver, Dallas',quote:"Managing my mother's bills was overwhelming. BillShield organized everything and told me exactly what to dispute.",saved:'$920'},
    {name:'Maria C.',role:'Outpatient surgery',quote:"The out-of-network flag alone saved me from paying a bill I wasn't legally responsible for.",saved:'$1,200'},
  ]
  const faqs=[
    {q:'Is this legal advice?',a:'No. BillShield is an informational tool. We flag potential issues and help you ask the right questions — you decide what to do.'},
    {q:'What file types can I upload?',a:'PDF bills and EOBs work best. We also accept JPG and PNG images of physical documents.'},
    {q:'Is my data safe?',a:'Files are processed in memory and deleted immediately after analysis. We never store your medical documents.'},
    {q:'Does this work for all insurers?',a:'Yes. BillShield reads the document text, so it works with any US insurer EOB and provider bill format.'},
    {q:'What if the AI misses something?',a:'Our flags are starting points, not verdicts. We use cautious language and always recommend confirming with your provider.'},
  ]

  return (
    <div style={{background:T.bg,color:T.text,minHeight:'100vh',overflowX:'hidden'}}>
      {/* Dot grid */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <svg width="100%" height="100%" style={{opacity:0.35}}><defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="#cbd5e1"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/></svg>
      </div>

      {/* Ticker */}
      <div style={{position:'relative',zIndex:10,background:T.amberLight,borderBottom:`1px solid ${T.amberBorder}`,padding:'7px 0',textAlign:'center',fontSize:12,color:'#92400e',fontWeight:500}}>
        ✦ &nbsp; {tickerLines[ticker]}
      </div>

      {/* Header */}
      <header style={{position:'sticky',top:0,zIndex:50,background:scrolled?'rgba(248,250,252,0.96)':'transparent',backdropFilter:scrolled?'blur(12px)':'none',borderBottom:scrolled?`1px solid ${T.border}`:'1px solid transparent',transition:'all 0.3s',padding:`0 ${px}`}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:60}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,background:T.accent,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:15,color:'#fff',fontFamily:T.serif}}>B</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,letterSpacing:'-0.02em',color:T.text}}>BillShield</div>
              {!mobile&&<div style={{fontSize:11,color:T.dimmer}}>Medical bill clarity, before you panic-pay</div>}
            </div>
          </div>
          {!mobile&&<nav style={{display:'flex',gap:24,fontSize:13,color:T.muted}}>
            {[['#problem','Problem'],['#how','How It Works'],['#features','Features'],['#faq','FAQ']].map(([h,l])=>(
              <a key={h} href={h} style={{color:'inherit',textDecoration:'none'}} onMouseOver={e=>e.target.style.color=T.text} onMouseOut={e=>e.target.style.color=T.muted}>{l}</a>
            ))}
          </nav>}
          <button onClick={()=>inputRef.current?.click()} style={{background:T.accent,color:'#fff',border:'none',borderRadius:10,padding:mobile?'9px 16px':'9px 20px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:T.sans}}>
            Upload a Bill
          </button>
          <input ref={inputRef} type="file" multiple accept=".pdf,image/*" style={{display:'none'}} onChange={handleChange}/>
        </div>
      </header>

      {error&&<div style={{position:'relative',zIndex:10,background:'#fef2f2',borderBottom:'1px solid #fecaca',padding:`12px ${px}`,textAlign:'center',fontSize:13,color:'#b91c1c'}}>⚠ {error} — please try again or use the demo case.</div>}

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:mobile?'60px 1.25rem 48px':`100px 2rem 80px`}}>
        <div style={{position:'absolute',top:0,right:0,width:'50%',height:'100%',background:'linear-gradient(135deg,rgba(236,253,245,0.6) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:mobile?40:72,alignItems:'center'}}>
          <div>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:100,padding:'5px 14px',fontSize:12,color:'#166534',fontWeight:600,marginBottom:24}}>
              Built for patients, caregivers, and families
            </div>
            <h1 style={{fontFamily:T.serif,fontSize:mobile?'clamp(36px,8vw,52px)':'clamp(40px,5vw,62px)',lineHeight:1.08,margin:'0 0 20px',color:T.text,letterSpacing:'-0.025em'}}>
              Medical bills are confusing. BillShield helps you fight back.
            </h1>
            <p style={{fontSize:mobile?15:17,color:T.muted,lineHeight:1.75,margin:'0 0 32px'}}>
              Upload your bill and insurance explanation. BillShield explains what you owe, flags what may be wrong, and tells you exactly what to do next.
            </p>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button onClick={onDemo} style={{background:T.accent,color:'#fff',border:'none',borderRadius:12,padding:'13px 24px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:T.sans,boxShadow:'0 4px 12px rgba(15,23,42,0.2)'}}>Try Demo Case</button>
              <button onClick={()=>inputRef.current?.click()} style={{background:T.surface,color:T.text,border:`1px solid ${T.border}`,borderRadius:12,padding:'13px 24px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:T.sans}}>Upload Your Bill</button>
            </div>
            <div style={{display:'flex',gap:mobile?16:24,marginTop:24,fontSize:12,color:T.muted,flexWrap:'wrap'}}>
              {['No legal jargon','Free to start','Results in 30s'].map(t=><span key={t} style={{display:'flex',alignItems:'center',gap:5}}><span style={{color:T.emerald,fontWeight:700}}>✓</span>{t}</span>)}
            </div>
          </div>

          {/* Hero card — hidden on mobile to save space, show CTA instead */}
          {!mobile ? (
            <div onDrop={handleDrop} onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onClick={()=>inputRef.current?.click()}
              style={{...card,padding:28,cursor:'pointer',boxShadow:'0 20px 60px rgba(15,23,42,0.1)',border:`1px solid ${dragOver?'#86efac':T.border}`,transition:'all 0.2s',background:dragOver?'#f0fdf4':T.surface}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${T.borderLight}`}}>
                <div>
                  <div style={{fontSize:13,color:T.muted,marginBottom:4}}>ER Visit — March 3</div>
                  <div style={{fontFamily:T.serif,fontSize:26,color:T.text}}>$4,870 billed</div>
                </div>
                <span style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,padding:'4px 12px',fontSize:12,color:'#92400e',fontWeight:600}}>Needs review</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
                {[['BILLED','$4,870',T.text],['PAID','$2,900',T.emerald],['YOU OWE','$1,420',T.text]].map(([l,v,c])=>(
                  <div key={l} style={{background:T.bgAlt,borderRadius:10,padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:T.dimmer,letterSpacing:'0.06em',marginBottom:5}}>{l}</div>
                    <div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
                <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px'}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#b91c1c',marginBottom:2}}>Duplicate-looking lab charge</div>
                  <div style={{fontSize:11,color:'#dc2626'}}>Two similar lab fees on the same date deserve review.</div>
                </div>
                <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:'10px 14px'}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#92400e',marginBottom:2}}>EOB mismatch on provider fee</div>
                  <div style={{fontSize:11,color:'#b45309'}}>Patient balance doesn't clearly match the insurer explanation.</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <button onClick={e=>{e.stopPropagation();onDemo()}} style={{background:T.accent,color:'#fff',border:'none',borderRadius:10,padding:'11px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:T.sans}}>Open Demo →</button>
                <div style={{background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:10,padding:'11px',fontSize:13,color:T.muted,textAlign:'center'}}>Drop PDF here</div>
              </div>
            </div>
          ) : (
            /* Mobile: show a simple upload CTA instead of the big card */
            <div onDrop={handleDrop} onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onClick={()=>inputRef.current?.click()}
              style={{border:`2px dashed ${dragOver?'#86efac':T.border}`,borderRadius:16,padding:'28px 20px',textAlign:'center',cursor:'pointer',background:dragOver?'#f0fdf4':'transparent'}}>
              <div style={{fontSize:32,marginBottom:12}}>📄</div>
              <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:6}}>Drop your bill here</div>
              <div style={{fontSize:12,color:T.muted}}>PDF, JPG, or PNG · up to 4MB</div>
            </div>
          )}
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{position:'relative',zIndex:1,background:T.accent,padding:`${mobile?28:40}px ${px}`}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:mobile?16:0}}>
          {[{target:2700,pre:'$',suf:'B+',label:'Billing errors annually'},{target:30,suf:'%',label:'Bills contain errors'},{target:1300,pre:'$',label:'Avg overcharge'},{target:72,suf:'%',label:'Disputes succeed'}].map(({target,pre='',suf='',label},i)=>(
            <div key={label} style={{padding:mobile?'0':'8px 28px',borderRight:!mobile&&i<3?'1px solid rgba(255,255,255,0.1)':'none',textAlign:'center'}}>
              <div style={{fontFamily:T.serif,fontSize:mobile?28:34,color:'#fff',marginBottom:4,lineHeight:1}}><Counter target={target} prefix={pre} suffix={suf} duration={1600}/></div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.55)',lineHeight:1.4}}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" style={{position:'relative',zIndex:1,padding:`${mobile?64:96}px ${px}`}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <Reveal>
            <div style={sectionLabel}>The Problem</div>
            <h2 style={{...h2,maxWidth:600}}>Medical billing is designed to confuse you.</h2>
            <p style={{fontSize:15,color:T.muted,maxWidth:520,lineHeight:1.75,marginBottom:48}}>Hospitals and insurers operate in completely different systems. You're caught in the middle, expected to reconcile documents that weren't meant to be reconciled.</p>
          </Reveal>
          <div style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:16}}>
            {problems.map((p,i)=>(
              <Reveal key={p.head} delay={i*80} dir={mobile?'up':i%2===0?'left':'right'}>
                <div style={{...card,padding:'22px 24px',display:'flex',gap:16,alignItems:'flex-start',boxShadow:'0 2px 8px rgba(15,23,42,0.04)'}}>
                  <div style={{fontSize:20,width:44,height:44,background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{p.icon}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:5}}>{p.head}</div>
                    <div style={{fontSize:13,color:T.muted,lineHeight:1.65}}>{p.body}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div style={{marginTop:32,background:'#fffbeb',border:`1px solid ${T.amberBorder}`,borderRadius:14,padding:mobile?'20px 20px':'24px 32px',display:'flex',alignItems:mobile?'flex-start':'center',justifyContent:'space-between',gap:16,flexDirection:mobile?'column':'row',flexWrap:'wrap'}}>
              <div>
                <div style={{fontFamily:T.serif,fontSize:mobile?18:20,color:T.text,marginBottom:4}}>The average patient is overcharged $1,300.</div>
                <div style={{fontSize:13,color:T.muted}}>Most never dispute it — because they don't know they can, or how.</div>
              </div>
              <button onClick={onDemo} style={{background:T.accent,color:'#fff',border:'none',borderRadius:10,padding:'11px 22px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:T.sans,flexShrink:0}}>See How We Help →</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{position:'relative',zIndex:1,padding:`${mobile?64:96}px ${px}`,background:T.bgAlt}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <Reveal><div style={sectionLabel}>How It Works</div><h2 style={h2}>From confusing bill to clear next step</h2></Reveal>
          <div style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:mobile?20:0,position:'relative',marginBottom:48}}>
            {!mobile&&<div style={{position:'absolute',top:40,left:'12.5%',right:'12.5%',height:1,background:`linear-gradient(90deg,transparent,${T.border},${T.border},${T.border},transparent)`}}/>}
            {steps.map((s,i)=>(
              <Reveal key={s.n} delay={i*100} dir="up">
                <div style={{padding:mobile?'0 8px':'0 16px',textAlign:'center',position:'relative',zIndex:1}}>
                  <div style={{width:mobile?64:76,height:mobile?64:76,margin:'0 auto 16px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:mobile?22:24,boxShadow:`0 0 0 4px ${T.bgAlt},0 0 0 5px ${T.border}`}}>{s.icon}</div>
                  <div style={{fontFamily:T.mono,fontSize:10,color:T.amber,marginBottom:5,letterSpacing:'0.1em',fontWeight:600}}>{s.n}</div>
                  <div style={{fontSize:mobile?13:15,fontWeight:700,color:T.text,marginBottom:6}}>{s.title}</div>
                  <div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>{s.body}</div>
                </div>
              </Reveal>
            ))}
          </div>
          {/* Terminal — hide on mobile */}
          {!mobile&&<Reveal delay={200}>
            <div style={{background:'#0f172a',borderRadius:14,overflow:'hidden',boxShadow:'0 16px 48px rgba(15,23,42,0.15)'}}>
              <div style={{padding:'10px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:8}}>
                {['#ef4444','#f59e0b','#22c55e'].map(c=><div key={c} style={{width:9,height:9,borderRadius:'50%',background:c,opacity:0.8}}/>)}
                <span style={{marginLeft:10,fontFamily:T.mono,fontSize:11,color:'#475569'}}>billshield — analysis.log</span>
              </div>
              <div style={{padding:'20px 24px',fontFamily:T.mono,fontSize:11,lineHeight:2,color:'#64748b'}}>
                {[['#22c55e','✓','Extracted 8 line items from hospital_bill.pdf'],['#22c55e','✓','Matched EOB from BlueCross — claim #882741'],['#f59e0b','⚠','CPT 71046 appears on 2 documents — possible duplicate'],['#ef4444','✗','Provider billed $680, EOB allowed $520 — $160 mismatch'],['#f59e0b','⚠','Out-of-network indicator detected in EOB'],['#22c55e','✓','Generated 2 dispute letters — ready to send']].map(([c,sym,msg],i)=>(
                  <div key={i} style={{display:'flex',gap:12}}><span style={{color:c,fontWeight:700}}>{sym}</span><span>{msg}</span></div>
                ))}
              </div>
            </div>
          </Reveal>}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{position:'relative',zIndex:1,padding:`${mobile?64:96}px ${px}`}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <Reveal><div style={sectionLabel}>Features</div><h2 style={h2}>Everything you need to fight back</h2></Reveal>
          <div style={{display:'grid',gridTemplateColumns:mobile?'1fr':'repeat(3,1fr)',gap:16}}>
            {features.map((f,i)=>(
              <Reveal key={f.title} delay={i*60} dir="up">
                <div style={{...card,padding:'22px 24px',boxShadow:'0 2px 8px rgba(15,23,42,0.04)',background:f.highlight?'#f0fdf4':T.surface,border:`1px solid ${f.highlight?'#bbf7d0':T.border}`}}>
                  <div style={{fontSize:20,width:44,height:44,background:T.bgAlt,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>{f.icon}</div>
                  <div style={{fontSize:14,fontWeight:700,color:f.highlight?'#166534':T.text,marginBottom:7}}>{f.title}</div>
                  <div style={{fontSize:13,color:T.muted,lineHeight:1.65}}>{f.body}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{position:'relative',zIndex:1,padding:`${mobile?64:96}px ${px}`,background:T.bgAlt}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <Reveal><div style={sectionLabel}>Results</div><h2 style={h2}>Patients who fought back</h2></Reveal>
          <div style={{display:'grid',gridTemplateColumns:mobile?'1fr':'repeat(3,1fr)',gap:16}}>
            {testimonials.map((t,i)=>(
              <Reveal key={t.name} delay={i*90} dir="up">
                <div style={{...card,padding:24,boxShadow:'0 2px 8px rgba(15,23,42,0.04)',display:'flex',flexDirection:'column',gap:16}}>
                  <div style={{fontFamily:T.serif,fontSize:40,color:T.dimmer,lineHeight:1}}>"</div>
                  <p style={{fontSize:13,color:T.muted,lineHeight:1.8,margin:0,marginTop:-14}}>{t.quote}</p>
                  <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:T.text}}>{t.name}</div>
                      <div style={{fontSize:11,color:T.dimmer,marginTop:2}}>{t.role}</div>
                    </div>
                    <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'6px 12px',textAlign:'center'}}>
                      <div style={{fontSize:9,color:'#166534',fontWeight:700,letterSpacing:'0.05em'}}>SAVED</div>
                      <div style={{fontSize:16,fontWeight:700,color:T.emerald}}>{t.saved}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{position:'relative',zIndex:1,padding:`${mobile?64:96}px ${px}`}}>
        <div style={{maxWidth:720,margin:'0 auto'}}>
          <Reveal><div style={sectionLabel}>FAQ</div><h2 style={h2}>Common questions</h2></Reveal>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {faqs.map((f,i)=>(
              <Reveal key={f.q} delay={i*40}>
                <div style={{...card,overflow:'hidden',border:`1px solid ${activeQ===i?'#86efac':T.border}`,transition:'border 0.2s',boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                  <button onClick={()=>setActiveQ(activeQ===i?null:i)} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',background:'none',border:'none',color:T.text,cursor:'pointer',fontFamily:T.sans,fontSize:14,fontWeight:700,textAlign:'left',gap:16}}>
                    {f.q}
                    <span style={{color:T.muted,fontSize:18,flexShrink:0,transform:activeQ===i?'rotate(45deg)':'none',transition:'transform 0.2s',lineHeight:1}}>+</span>
                  </button>
                  {activeQ===i&&<div style={{padding:'0 20px 16px',fontSize:13,color:T.muted,lineHeight:1.75}}>{f.a}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{position:'relative',zIndex:1,padding:`${mobile?48:80}px ${px} ${mobile?64:100}px`,background:T.bgAlt}}>
        <Reveal>
          <div style={{maxWidth:840,margin:'0 auto',background:T.accent,borderRadius:20,padding:mobile?'40px 28px':'56px 64px',textAlign:'center',boxShadow:'0 24px 80px rgba(15,23,42,0.2)'}}>
            <div style={{fontFamily:T.serif,fontSize:mobile?'clamp(24px,6vw,36px)':'clamp(28px,4vw,44px)',color:'#fff',margin:'0 0 14px',letterSpacing:'-0.02em',lineHeight:1.15}}>
              Before you pay a confusing medical bill,<br/>let BillShield review it with you.
            </div>
            <p style={{fontSize:15,color:'rgba(255,255,255,0.6)',margin:'0 0 32px',lineHeight:1.65}}>Get clarity, identify what may need review, and take the next step with confidence.</p>
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={()=>inputRef.current?.click()} style={{background:'#fff',color:T.accent,border:'none',borderRadius:12,padding:'13px 28px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:T.sans}}>Upload a Bill</button>
              <button onClick={onDemo} style={{background:'transparent',color:'rgba(255,255,255,0.85)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:12,padding:'13px 28px',fontSize:14,cursor:'pointer',fontFamily:T.sans}}>Try Demo Case</button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer style={{position:'relative',zIndex:1,borderTop:`1px solid ${T.border}`,padding:`20px ${px}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:26,height:26,background:T.accent,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff'}}>B</div>
          <span style={{fontSize:12,color:T.muted}}>BillShield</span>
        </div>
        <div style={{fontSize:11,color:T.dimmer}}>For informational purposes only · Not legal or medical advice</div>
      </footer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOADING
// ═══════════════════════════════════════════════════════════════════════════════
function Uploading() {
  const steps=['Uploading documents…','Extracting text & charges…','Detecting anomalies…','Generating action plan…']
  const [index,setIndex]=useState(0)
  useEffect(()=>{const t=setInterval(()=>setIndex(p=>Math.min(p+1,steps.length-1)),3500);return()=>clearInterval(t)},[])
  return (
    <div style={{background:'#f8fafc',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:T.sans,color:T.text,padding:'2rem',textAlign:'center'}}>
      <div style={{width:72,height:72,background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,marginBottom:24,boxShadow:'0 4px 20px rgba(5,150,105,0.1)'}}>🛡️</div>
      <div style={{fontFamily:T.serif,fontSize:'clamp(22px,5vw,28px)',color:T.text,marginBottom:10}}>Analyzing your documents</div>
      <div style={{fontSize:14,color:T.muted,marginBottom:28,fontFamily:T.mono}}>{steps[index]}</div>
      <div style={{display:'flex',gap:8}}>
        {steps.map((_,i)=><div key={i} style={{height:3,width:i<=index?28:8,borderRadius:2,background:i<=index?T.emerald:T.border,transition:'all 0.4s ease'}}/>)}
      </div>
      <div style={{marginTop:20,fontSize:12,color:T.dimmer}}>This may take 15–30 seconds</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard({data,onBack}) {
  const [tab,setTab]=useState('overview')
  const [selIssue,setSelIssue]=useState(data.issues?.[0]||null)
  const [selAction,setSelAction]=useState(data.actions?.[0]||null)
  const [showDraft,setShowDraft]=useState(true)
  const [done,setDone]=useState([])
  const [sidebarOpen,setSidebarOpen]=useState(false)
  const mobile=useMobile()
  const issues=data.issues||[], actions=data.actions||[], timeline=data.timeline||[]
  const stats=data.issueStats||{}, actStats=data.actionStats||{}
  const card={background:T.surface,border:`1px solid ${T.border}`,borderRadius:14}
  const tabs=[
    {id:'overview',label:'Overview',icon:'▣'},
    {id:'issues',label:'Issues',icon:'⚠',badge:stats.total},
    {id:'actions',label:'Actions',icon:'✉',badge:actions.length-done.length},
    {id:'financial',label:'Financial',icon:'＄'},
    {id:'timeline',label:'Timeline',icon:'⏱'},
  ]

  return (
    <div style={{background:T.bg,minHeight:'100vh',fontFamily:T.sans,color:T.text,display:'flex',flexDirection:'column'}}>

      {/* Top bar */}
      <div style={{borderBottom:`1px solid ${T.border}`,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',background:T.surface,position:'sticky',top:0,zIndex:40}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {mobile&&<button onClick={()=>setSidebarOpen(p=>!p)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',padding:'0 4px',color:T.muted}}>☰</button>}
          <div style={{width:30,height:30,background:T.accent,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',fontFamily:T.serif}}>B</div>
          <div>
            <div style={{fontSize:mobile?10:11,color:T.dimmer,letterSpacing:'0.05em',textTransform:'uppercase'}}>{data.eventType}</div>
            <div style={{fontSize:mobile?14:16,fontWeight:700,color:T.text,letterSpacing:'-0.01em'}}>Billing Dashboard</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {!mobile&&<div style={{display:'flex',gap:2,marginRight:4}}>
            {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'5px 9px',borderRadius:8,border:'none',background:tab===t.id?T.bgAlt:'transparent',color:tab===t.id?T.text:T.dimmer,cursor:'pointer',fontSize:13}}>{t.icon}</button>)}
          </div>}
          <button onClick={onBack} style={{background:T.bgAlt,border:`1px solid ${T.border}`,color:T.muted,borderRadius:9,padding:'6px 14px',fontSize:12,cursor:'pointer',fontFamily:T.sans}}>← Back</button>
          <button onClick={onBack} style={{background:T.accent,border:'none',color:'#fff',borderRadius:9,padding:'6px 14px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:T.sans}}>New</button>
        </div>
      </div>

      {/* Mobile tab bar */}
      {mobile&&<div style={{display:'flex',borderBottom:`1px solid ${T.border}`,background:T.surface,overflowX:'auto'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:'0 0 auto',padding:'10px 14px',border:'none',borderBottom:`2px solid ${tab===t.id?T.accent:'transparent'}`,background:'none',color:tab===t.id?T.text:T.dimmer,fontSize:12,fontWeight:tab===t.id?700:400,cursor:'pointer',fontFamily:T.sans,display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap'}}>
            {t.icon} {t.label}
            {t.badge>0&&<span style={{background:'#fef2f2',color:'#b91c1c',borderRadius:5,padding:'1px 5px',fontSize:10,fontWeight:700}}>{t.badge}</span>}
          </button>
        ))}
      </div>}

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* Sidebar */}
        {(!mobile||sidebarOpen)&&(
          <>
            {mobile&&sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',zIndex:49}}/>}
            <aside style={{width:210,borderRight:`1px solid ${T.border}`,background:T.surface,display:'flex',flexDirection:'column',flexShrink:0,...(mobile?{position:'fixed',top:0,left:0,height:'100vh',zIndex:50,boxShadow:'4px 0 20px rgba(15,23,42,0.1)'}:{position:'sticky',top:61,height:'calc(100vh - 61px)'})}}>
              {mobile&&<div style={{padding:'16px 16px 12px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontWeight:700,fontSize:14}}>Menu</div>
                <button onClick={()=>setSidebarOpen(false)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:T.muted}}>✕</button>
              </div>}
              <nav style={{padding:'10px 8px',flex:1}}>
                {tabs.map(t=>(
                  <button key={t.id} onClick={()=>{setTab(t.id);setSidebarOpen(false)}} style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'9px 12px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:T.sans,fontSize:13,fontWeight:tab===t.id?700:400,background:tab===t.id?T.bgAlt:'transparent',color:tab===t.id?T.text:T.muted,marginBottom:2,justifyContent:'space-between'}}>
                    <span style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:12}}>{t.icon}</span>{t.label}</span>
                    {t.badge>0&&<span style={{background:t.id==='issues'?'#fef2f2':T.bgAlt,color:t.id==='issues'?'#b91c1c':T.muted,borderRadius:5,padding:'1px 6px',fontSize:11,fontWeight:700,border:`1px solid ${t.id==='issues'?'#fecaca':T.border}`}}>{t.badge}</span>}
                  </button>
                ))}
              </nav>
              <div style={{padding:'12px 12px',borderTop:`1px solid ${T.border}`}}>
                <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:11,padding:'12px 14px',marginBottom:8}}>
                  <div style={{fontSize:10,color:'#166534',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:600,marginBottom:3}}>Potential Savings</div>
                  <div style={{fontFamily:T.serif,fontSize:22,color:T.emerald,lineHeight:1}}>${(data.potentialSavings||0).toLocaleString()}</div>
                  <div style={{fontSize:11,color:'#4ade80',marginTop:3}}>if issues corrected</div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'0 2px'}}>
                  <span style={{color:T.dimmer}}>Due in</span>
                  <span style={{color:(data.daysUntilDue||99)<=7?T.rose:T.amber,fontWeight:700}}>{data.daysUntilDue||'—'} days</span>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Main content */}
        <div style={{flex:1,overflowY:'auto',padding:mobile?'14px':'20px',minWidth:0}}>

          {/* OVERVIEW */}
          {tab==='overview'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* Metrics - 2 col on mobile, 4 col on desktop */}
              <div style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:10}}>
                <LightMetricCard label="Total Billed"       value={`$${(data.totalBilled||0).toLocaleString()}`}  sub="Provider + facility"        valueColor={T.text}    accent="#64748b" chart={[40,55,48,66,60,46,72]}/>
                <LightMetricCard label="Insurance Paid"     value={`$${(data.insurerPaid||0).toLocaleString()}`}  sub={data.insurerName||'Insurer'} valueColor={T.emerald} accent={T.emerald} chart={[30,42,38,50,44,36,55]}/>
                <LightMetricCard label="You May Owe"        value={`$${(data.patientOwes||0).toLocaleString()}`}  sub="Current estimate"           valueColor={T.text}    accent="#64748b" chart={[20,28,22,30,26,20,28]}/>
                <LightMetricCard label="Disputable"         value={`$${(data.disputeAmount||0).toLocaleString()}`} sub={`${stats.high||0} high-priority`} valueColor={T.rose} accent={T.rose} chart={[10,18,14,22,18,12,20]} urgent/>
              </div>

              {/* Case clarity */}
              <div style={{...card,padding:18,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Case Clarity</div>
                <div style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(3,1fr)',gap:8}}>
                  {[['📎','Docs Linked',data.documentsLinked||2,false],['📅','Date of Service',data.dateOfService||'—',false],['⏰','Due Date',data.dueDate||'—',(data.daysUntilDue||99)<=7],['🏥','Providers',data.providerCount||1,false],['🌐','Out-of-Network',data.outOfNetworkConcern?'Detected ⚠':'No',data.outOfNetworkConcern],['📊','Match Confidence',`${data.matchConfidence||0}%`,(data.matchConfidence||0)<60]].map(([icon,l,v,u])=>(
                    <div key={l} style={{padding:'9px 11px',background:u?'#fffbeb':T.bgAlt,border:`1px solid ${u?'#fde68a':T.border}`,borderRadius:9}}>
                      <div style={{fontSize:9,color:T.dimmer,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>{icon} {l}</div>
                      <div style={{fontSize:12,fontWeight:600,color:u?T.amber:T.text}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issue detection */}
              <div style={{...card,padding:18,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Issue Detection</div>
                <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:12}}>
                  {[['High Priority',stats.high||0,'#e11d48'],['Medium Priority',stats.medium||0,'#d97706'],['Low Priority',stats.low||0,'#059669']].map(([l,v,c])=>(
                    <div key={l}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}}><span style={{color:T.muted}}>{l}</span><span style={{color:c,fontWeight:700}}>{v}</span></div>
                      <div style={{height:4,background:T.bgAlt,borderRadius:2,overflow:'hidden',border:`1px solid ${T.border}`}}>
                        <div style={{height:'100%',width:`${(stats.total||1)>0?(v/(stats.total||1))*100:0}%`,background:c,borderRadius:2,transition:'width 0.8s'}}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                  {[['Duplicates',stats.duplicates||0,stats.duplicates>0?'#e11d48':T.dimmer],['Mismatches',stats.mismatches||0,stats.mismatches>0?'#d97706':T.dimmer],['Itemization',stats.itemizationNeeded||0,stats.itemizationNeeded>0?'#d97706':T.dimmer],['Total',stats.total||0,T.muted]].map(([l,v,c])=>(
                    <div key={l} style={{padding:'7px 10px',background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:10,color:T.muted}}>{l}</span>
                      <span style={{fontSize:14,fontWeight:700,color:c,fontFamily:T.serif}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action metrics */}
              <div style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:10}}>
                {[
                  {label:'Next Action',value:actions[0]?.title||'None',color:T.text,onClick:()=>setTab('actions'),sub:'Tap to view'},
                  {label:'Generated',value:actions.length,sub:`${done.length} done`,color:T.text,numBig:true},
                  {label:'Due In',value:`${data.daysUntilDue||'?'}d`,color:(data.daysUntilDue||99)<=7?T.rose:T.amber,urgent:(data.daysUntilDue||99)<=7},
                  {label:'Status',value:actStats.awaitingResponse?'Awaiting':'Not sent',color:actStats.awaitingResponse?T.amber:T.dimmer},
                ].map(({label,value,sub,color,urgent,onClick,numBig})=>(
                  <div key={label} onClick={onClick} style={{...card,padding:14,cursor:onClick?'pointer':'default',background:urgent?'#fef2f2':T.surface,border:`1px solid ${urgent?'#fecaca':T.border}`,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                    <div style={{fontSize:9,color:T.dimmer,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8,fontWeight:500}}>{label}</div>
                    <div style={{fontSize:numBig?26:13,fontWeight:numBig?400:600,color,fontFamily:numBig?T.serif:T.sans,lineHeight:1.2,marginBottom:sub?3:0}}>{value}</div>
                    {sub&&<div style={{fontSize:11,color:T.dimmer}}>{sub}</div>}
                  </div>
                ))}
              </div>

              {/* Issues list */}
              <div style={{...card,padding:18,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>Detected Issues</div>
                  <button onClick={()=>setTab('issues')} style={{fontSize:12,color:T.muted,background:'none',border:'none',cursor:'pointer',fontFamily:T.sans}}>View all →</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {issues.map(issue=>{
                    const isHigh=issue.severity==='high',isMed=issue.severity==='medium'
                    const bg=isHigh?'#fef2f2':isMed?'#fffbeb':'#f0fdf4'
                    const bdr=isHigh?'#fecaca':isMed?'#fde68a':'#bbf7d0'
                    const dot=isHigh?'#e11d48':isMed?'#d97706':'#059669'
                    return(
                      <button key={issue.id} onClick={()=>{setSelIssue(issue);setTab('issues')}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderRadius:10,border:`1px solid ${bdr}`,background:bg,cursor:'pointer',fontFamily:T.sans,textAlign:'left',width:'100%'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                          <div style={{width:7,height:7,borderRadius:'50%',background:dot,flexShrink:0}}/>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:600,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{issue.title}</div>
                            <div style={{fontSize:11,color:T.muted,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{issue.description}</div>
                          </div>
                        </div>
                        <div style={{flexShrink:0,textAlign:'right',marginLeft:12}}>
                          <div style={{fontSize:12,fontWeight:700,color:isHigh?'#b91c1c':isMed?'#92400e':'#166534'}}>${(issue.amountAtRisk||0).toLocaleString()}</div>
                          <div style={{fontSize:9,color:T.dimmer}}>at risk</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ISSUES */}
          {tab==='issues'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{...card,padding:18,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Detected Issues</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {issues.map(issue=>{
                    const isHigh=issue.severity==='high',isMed=issue.severity==='medium'
                    const bg=isHigh?'#fef2f2':isMed?'#fffbeb':'#f0fdf4'
                    const bdr=isHigh?'#fecaca':isMed?'#fde68a':'#bbf7d0'
                    const dot=isHigh?'#e11d48':isMed?'#d97706':'#059669'
                    return(
                      <button key={issue.id} onClick={()=>setSelIssue(issue)} style={{padding:'13px 14px',borderRadius:10,border:`1px solid ${selIssue?.id===issue.id?dot:bdr}`,background:selIssue?.id===issue.id?bg:'#fff',cursor:'pointer',textAlign:'left',width:'100%',fontFamily:T.sans}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                              <div style={{width:6,height:6,borderRadius:'50%',background:dot,flexShrink:0}}/>
                              <span style={{fontSize:13,fontWeight:600,color:T.text}}>{issue.title}</span>
                            </div>
                            <div style={{fontSize:12,color:T.muted,lineHeight:1.5,paddingLeft:13}}>{issue.description}</div>
                          </div>
                          <div style={{fontSize:10,background:bg,color:isHigh?'#b91c1c':isMed?'#92400e':'#166534',border:`1px solid ${bdr}`,borderRadius:5,padding:'2px 7px',fontWeight:700,textTransform:'uppercase',flexShrink:0}}>{issue.severity}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selIssue&&(()=>{
                const isHigh=selIssue.severity==='high',isMed=selIssue.severity==='medium'
                const bg=isHigh?'#fef2f2':isMed?'#fffbeb':'#f0fdf4'
                const bdr=isHigh?'#fecaca':isMed?'#fde68a':'#bbf7d0'
                const color=isHigh?'#b91c1c':isMed?'#92400e':'#166534'
                return(
                  <div style={{...card,padding:18,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Issue Detail</div>
                    <div style={{padding:14,background:bg,border:`1px solid ${bdr}`,borderRadius:10,marginBottom:14}}>
                      <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:5}}>{selIssue.title}</div>
                      <div style={{fontSize:13,color:T.muted,lineHeight:1.6}}>{selIssue.description}</div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                      {[['Severity',selIssue.severity,color],['Confidence',`${Math.round((selIssue.confidence||0)*100)}%`,T.amber],['Amount at Risk',`$${(selIssue.amountAtRisk||0).toLocaleString()}`,'#b91c1c'],['Type',selIssue.type||'Other',T.muted]].map(([l,v,vc])=>(
                        <div key={l} style={{padding:'10px 12px',background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:9}}>
                          <div style={{fontSize:9,color:T.dimmer,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>{l}</div>
                          <div style={{fontSize:13,fontWeight:700,color:vc,textTransform:l==='Severity'?'capitalize':'none'}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>setTab('actions')} style={{width:'100%',background:T.bgAlt,border:`1px solid ${T.border}`,color:T.text,borderRadius:9,padding:'10px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:T.sans}}>View Recommended Actions →</button>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ACTIONS */}
          {tab==='actions'&&(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {actions.length>1&&(
                <div style={{...card,padding:16,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>Available Actions</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {actions.map(a=>(
                      <button key={a.id} onClick={()=>setSelAction(a)} style={{padding:'8px 14px',borderRadius:9,border:`1px solid ${selAction?.id===a.id?T.text:T.border}`,background:selAction?.id===a.id?T.text:T.surface,color:selAction?.id===a.id?'#fff':T.muted,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:T.sans,display:'flex',alignItems:'center',gap:7}}>
                        {a.icon} {a.title}
                        {done.includes(a.id)&&<span style={{fontSize:11,color:'#22c55e'}}>✓</span>}
                        {a.priority==='urgent'&&!done.includes(a.id)&&<span style={{fontSize:9,background:'#fef2f2',color:'#b91c1c',borderRadius:4,padding:'1px 5px',fontWeight:700,border:'1px solid #fecaca'}}>URGENT</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selAction&&(
                <div style={{...card,padding:mobile?16:20,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,gap:10}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:T.text}}>{selAction.icon} {selAction.title}</div>
                      <div style={{fontSize:12,color:T.muted,marginTop:3}}>{selAction.whyItMatters}</div>
                    </div>
                    {selAction.dueInDays&&<div style={{background:selAction.dueInDays<=3?'#fef2f2':'#fffbeb',border:`1px solid ${selAction.dueInDays<=3?'#fecaca':'#fde68a'}`,borderRadius:9,padding:'7px 12px',textAlign:'center',flexShrink:0}}>
                      <div style={{fontSize:18,fontWeight:700,color:selAction.dueInDays<=3?'#b91c1c':'#92400e',fontFamily:T.serif}}>{selAction.dueInDays}</div>
                      <div style={{fontSize:9,color:T.dimmer}}>days left</div>
                    </div>}
                  </div>
                  <div style={{background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 16px',fontFamily:T.mono,fontSize:11,lineHeight:1.9,color:T.muted,whiteSpace:'pre-wrap',marginBottom:12,maxHeight:240,overflowY:'auto'}}>
                    {showDraft?(selAction.draft||selAction.script||''):'— hidden —'}
                  </div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button onClick={()=>navigator.clipboard.writeText(selAction.draft||selAction.script||'').catch(()=>{})} style={{background:T.accent,color:'#fff',border:'none',borderRadius:9,padding:'9px 16px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:T.sans}}>Copy Draft</button>
                    <button onClick={()=>setShowDraft(p=>!p)} style={{background:T.bgAlt,border:`1px solid ${T.border}`,color:T.muted,borderRadius:9,padding:'9px 14px',fontSize:12,cursor:'pointer',fontFamily:T.sans}}>{showDraft?'Hide':'Show'}</button>
                    {done.includes(selAction.id)
                      ?<span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:5,background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#166534',borderRadius:9,padding:'9px 14px',fontSize:12,fontWeight:700}}>✓ Done</span>
                      :<button onClick={()=>setDone(p=>[...p,selAction.id])} style={{marginLeft:'auto',background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#166534',borderRadius:9,padding:'9px 14px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:T.sans}}>Mark Done ✓</button>
                    }
                  </div>
                </div>
              )}

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {[['Provider Contacted',actStats.providerContacted],['Insurer Contacted',actStats.insurerContacted],['Awaiting Response',actStats.awaitingResponse]].map(([l,v])=>(
                  <div key={l} style={{...card,padding:14,display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                    <div style={{fontSize:12,color:T.muted}}>{l}</div>
                    <div style={{width:26,height:26,borderRadius:'50%',background:v?'#f0fdf4':T.bgAlt,border:`1px solid ${v?'#bbf7d0':T.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:v?'#166534':T.dimmer,fontWeight:700}}>{v?'✓':'○'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FINANCIAL */}
          {tab==='financial'&&(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(3,1fr)',gap:10}}>
                {[['Total Billed',data.totalBilled||0,T.text,'Full amount charged'],['Insurance Paid',data.insurerPaid||0,T.emerald,'Covered by your plan'],['You May Owe',data.patientOwes||0,T.text,'Patient responsibility'],['Under Review',data.amountUnderReview||0,'#6366f1','Being verified'],['Potential Savings',data.potentialSavings||0,T.emerald,'If issues resolved'],['Overcharge Risk',data.estimatedOverchargeRisk||0,T.rose,'Estimated errors']].map(([l,v,c,s])=>(
                  <div key={l} style={{...card,padding:16,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                    <div style={{fontSize:9,color:T.dimmer,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8,fontWeight:500}}>{l}</div>
                    <div style={{fontFamily:T.serif,fontSize:mobile?26:30,color:c,lineHeight:1,marginBottom:4}}>${v.toLocaleString()}</div>
                    <div style={{fontSize:11,color:T.dimmer,marginBottom:10}}>{s}</div>
                    <div style={{height:3,background:T.bgAlt,borderRadius:2,overflow:'hidden',border:`1px solid ${T.border}`}}>
                      <div style={{height:'100%',width:`${Math.min((v/(data.totalBilled||1))*100,100)}%`,background:c,borderRadius:2,opacity:0.7}}/>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{...card,padding:mobile?16:20,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:16}}>Bill Breakdown</div>
                <div style={{display:'flex',gap:mobile?20:32,alignItems:'center',flexDirection:mobile?'column':'row'}}>
                  <LightDonutChart segments={[{value:data.insurerPaid||0,color:T.emerald},{value:Math.max((data.patientOwes||0)-(data.disputeAmount||0),0),color:'#d97706'},{value:data.disputeAmount||0,color:T.rose}]} total={data.totalBilled||1}/>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:12,width:mobile?'100%':'auto'}}>
                    {[['Insurance Paid',data.insurerPaid||0,T.emerald],['Confirmed Owed',Math.max((data.patientOwes||0)-(data.disputeAmount||0),0),'#d97706'],['Disputable',data.disputeAmount||0,T.rose]].map(([l,v,c])=>(
                      <div key={l}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:12}}>
                          <span style={{display:'flex',alignItems:'center',gap:7,color:T.muted}}><span style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}}/>{l}</span>
                          <span style={{color:c,fontWeight:700}}>${v.toLocaleString()}</span>
                        </div>
                        <div style={{height:4,background:T.bgAlt,borderRadius:2,overflow:'hidden',border:`1px solid ${T.border}`}}>
                          <div style={{height:'100%',width:`${(v/(data.totalBilled||1))*100}%`,background:c,borderRadius:2}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE */}
          {tab==='timeline'&&(
            <div style={{...card,padding:mobile?16:24,boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:20}}>Case Timeline</div>
              {timeline.map((event,i)=>(
                <div key={event.id} style={{display:'flex',gap:14}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:2}}>
                    <div style={{width:11,height:11,borderRadius:'50%',background:event.completed?T.emerald:T.border,border:`2px solid ${event.completed?T.emerald:T.border}`,flexShrink:0}}/>
                    {i<timeline.length-1&&<div style={{width:1,flex:1,background:event.completed?'#bbf7d0':T.border,minHeight:24,margin:'3px 0'}}/>}
                  </div>
                  <div style={{paddingBottom:20}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:13,fontWeight:event.completed?600:400,color:event.completed?T.text:T.dimmer}}>{event.label}</span>
                      {event.completed&&<span style={{fontSize:9,color:'#166534',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:4,padding:'1px 6px',fontWeight:600}}>Done</span>}
                    </div>
                    {event.date&&<div style={{fontSize:10,color:T.dimmer,marginTop:1,fontFamily:T.mono}}>{event.date}</div>}
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
    <div style={{background:urgent?'#fef2f2':'#fff',border:`1px solid ${urgent?'#fecaca':'#e2e8f0'}`,borderRadius:14,padding:'16px 16px 12px',overflow:'hidden',boxShadow:'0 1px 4px rgba(15,23,42,0.04)'}}>
      <div style={{fontSize:9,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8,fontWeight:500}}>{label}</div>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:'clamp(20px,4vw,28px)',color:valueColor,lineHeight:1,marginBottom:3}}>{value}</div>
      <div style={{fontSize:11,color:'#94a3b8',marginBottom:10}}>{sub}</div>
      <div style={{display:'flex',alignItems:'flex-end',gap:2,height:20}}>
        {chart.map((v,i)=><div key={i} style={{flex:1,borderRadius:1,background:i===chart.length-1?accent:`${accent}30`,height:`${(v/max)*100}%`,minHeight:2}}/>)}
      </div>
    </div>
  )
}

function LightDonutChart({segments,total}) {
  const size=130,cx=65,cy=65,r=48,stroke=16
  let cumAngle=-90
  const paths=segments.map(seg=>{
    const angle=(seg.value/total)*360
    const sa=(cumAngle*Math.PI)/180; cumAngle+=angle; const ea=(cumAngle*Math.PI)/180
    const x1=cx+r*Math.cos(sa),y1=cy+r*Math.sin(sa),x2=cx+r*Math.cos(ea),y2=cy+r*Math.sin(ea)
    return{path:`M ${x1} ${y1} A ${r} ${r} 0 ${angle>180?1:0} 1 ${x2} ${y2}`,color:seg.color}
  })
  return(
    <svg width={size} height={size} style={{flexShrink:0}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke}/>
      {paths.map((p,i)=><path key={i} d={p.path} fill="none" stroke={p.color} strokeWidth={stroke} strokeLinecap="round" opacity={0.9}/>)}
      <text x={cx} y={cy-3} textAnchor="middle" fill="#0f172a" fontSize="12" fontFamily="DM Serif Display,serif" fontWeight="bold">${Math.round(total/1000)}k</text>
      <text x={cx} y={cy+11} textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="DM Sans,sans-serif">total billed</text>
    </svg>
  )
}

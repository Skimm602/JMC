'use client'

import { useMemo, useState } from 'react'
import { Button, CurrentRule, Eyebrow, SectionHeading, cx } from './ui.jsx'
import { Checkbox, Field, Select, TextInput } from './form.jsx'
import { AlertIcon, ArrowRightIcon, CheckIcon, ShieldIcon, SpinnerIcon, UploadIcon, XIcon } from './icons.jsx'

/* ------------------------------ configuration ----------------------------- */

const COUNTRIES = [
  'Philippines',
  'United States',
  'Australia',
  'United Kingdom',
  'Germany',
  'Netherlands',
  'Spain',
  'India',
  'Indonesia',
  'Vietnam',
  'Malaysia',
  'Singapore',
  'United Arab Emirates',
  'South Africa',
  'Brazil',
  'Mexico',
]

const ROLES = ['Owner / director', 'Project manager', 'Lead electrician', 'Procurement', 'Homeowner', 'Other']

const CERTIFICATIONS = ['NABCEP', 'MCS', 'CEC Accredited', 'TÜV Rheinland', 'IEC 62446', 'Other / local scheme']

/**
 * Named slots rather than one "drop your files here" bucket. Installers can
 * see exactly which document is missing without reading an error message,
 * which is the whole point of asking for four specific things.
 */
const DOC_SLOTS = [
  { key: 'registration', label: 'Business registration', hint: 'DTI, SEC or equivalent', required: true },
  { key: 'licence', label: 'Contractor licence', hint: 'Electrical or PV licence', required: true },
  { key: 'insurance', label: 'Liability insurance', hint: 'Certificate of currency', required: true },
  { key: 'certs', label: 'PV certifications', hint: 'NABCEP, MCS, CEC…', required: false },
]

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'
const MAX_FILE_BYTES = 10 * 1024 * 1024

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  country: '',
  company: '',
  role: '',
  businessRegNo: '',
  licenceNo: '',
  licenceExpiry: '',
  yearsInstalling: '',
  annualVolume: '',
  serviceArea: '',
}

/* --------------------------------- helpers -------------------------------- */

const formatBytes = (b) =>
  b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`

const fileTypeOk = (f) => /\.(pdf|jpe?g|png|webp|docx?)$/i.test(f.name)

/** 0–4, drives the strength bars. Deliberately simple and explainable. */
const passwordScore = (pw) => {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}

const STRENGTH = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR = ['bg-ink-600', 'bg-bad', 'bg-warn', 'bg-volt-400', 'bg-good']

/* ------------------------------ document slot ----------------------------- */

function DocumentSlot({ slot, file, error, onPick, onRemove, disabled }) {
  const [dragging, setDragging] = useState(false)

  const handle = (list) => {
    const f = list?.[0]
    if (!f) return
    if (!fileTypeOk(f)) return onPick(slot.key, null, 'Unsupported format — use PDF, JPG, PNG or DOC.')
    if (f.size > MAX_FILE_BYTES) return onPick(slot.key, null, `${formatBytes(f.size)} is over the 10 MB limit.`)
    onPick(slot.key, f, null)
  }

  if (file) {
    return (
      <div className="border-good/40 bg-good/[0.07] clip-bevel-sm flex items-center gap-3 border px-3.5 py-3">
        <CheckIcon className="text-good h-4 w-4 shrink-0" strokeWidth={2.4} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-chalk">{slot.label}</span>
          <span className="text-mute-dim block truncate font-mono text-[10px]">
            {file.name} · {formatBytes(file.size)}
          </span>
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRemove(slot.key)}
          className="text-mute-dim hover:text-bad shrink-0 rounded p-1 transition-colors"
          aria-label={`Remove ${slot.label}`}
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handle(e.dataTransfer?.files)
        }}
        className={cx(
          'clip-bevel-sm flex cursor-pointer items-center gap-3 border border-dashed px-3.5 py-3 transition-colors duration-200',
          dragging
            ? 'border-solar-500 bg-solar-500/10'
            : error
              ? 'border-bad/60 bg-ink-900/40'
              : 'border-ink-600 bg-ink-900/40 hover:border-solar-500/60 hover:bg-ink-900/70',
        )}
      >
        <input
          type="file"
          accept={ACCEPT}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            handle(e.target.files)
            e.target.value = ''
          }}
          className="sr-only"
        />
        <UploadIcon className={cx('h-4 w-4 shrink-0', dragging ? 'text-solar-400' : 'text-mute-dim')} />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-chalk">
            {slot.label}
            {slot.required ? (
              <span className="text-solar-500 ml-1">*</span>
            ) : (
              <span className="text-mute-dim ml-1.5 font-normal">optional</span>
            )}
          </span>
          <span className="text-mute-dim block text-[10px]">{slot.hint}</span>
        </span>
        <span className="text-solar-400 shrink-0 font-mono text-[10px] tracking-wide uppercase">Attach</span>
      </label>
      {error && (
        <p role="alert" className="text-bad mt-1.5 flex items-center gap-1.5 text-xs">
          <AlertIcon className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

/* --------------------------------- section -------------------------------- */

export default function Registration() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [isInstaller, setIsInstaller] = useState(false)
  const [certs, setCerts] = useState([])
  const [docs, setDocs] = useState({})
  const [docErrors, setDocErrors] = useState({})
  const [terms, setTerms] = useState(false)
  const [updates, setUpdates] = useState(true)
  const [errors, setErrors] = useState({})
  const [stepId, setStepId] = useState('account')
  const [visited, setVisited] = useState(['account'])
  const [status, setStatus] = useState('idle')

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  // The verification step exists only for installers, so the stepper itself
  // communicates that ticking the box lengthens the flow.
  const steps = useMemo(
    () => [
      { id: 'account', label: 'Account' },
      { id: 'org', label: 'Organisation' },
      ...(isInstaller ? [{ id: 'verify', label: 'Verification' }] : []),
      { id: 'review', label: 'Review' },
    ],
    [isInstaller],
  )

  const rawIndex = steps.findIndex((s) => s.id === stepId)
  const index = rawIndex === -1 ? 1 : rawIndex
  const current = steps[index]
  const requiredDocs = DOC_SLOTS.filter((s) => s.required)
  const attachedRequired = requiredDocs.filter((s) => docs[s.key]).length

  /* ------------------------------ validation ----------------------------- */

  const validateStep = (id) => {
    const e = {}
    if (id === 'account') {
      if (!form.fullName.trim()) e.fullName = 'Enter your full name.'
      if (!form.email.trim()) e.email = 'Enter your email address.'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'That address looks incomplete.'
      if (form.password.length < 8) e.password = 'Use at least 8 characters.'
      if (form.confirm !== form.password) e.confirm = 'The two passwords do not match.'
      if (!form.country) e.country = 'Select your country.'
    }
    if (id === 'org') {
      if (isInstaller && !form.company.trim()) e.company = 'Required for installer accounts.'
    }
    if (id === 'verify') {
      if (!form.businessRegNo.trim()) e.businessRegNo = 'Enter your business registration number.'
      if (!form.licenceNo.trim()) e.licenceNo = 'Enter your contractor licence number.'
      if (!form.licenceExpiry) e.licenceExpiry = 'Enter the licence expiry date.'
      if (!form.yearsInstalling) e.yearsInstalling = 'Select your experience level.'
      if (attachedRequired < requiredDocs.length) e.documents = 'Attach all three required documents.'
    }
    if (id === 'review') {
      if (!terms) e.terms = 'Please accept the terms to continue.'
    }
    return e
  }

  const goNext = () => {
    const found = validateStep(current.id)
    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector('#register [aria-invalid="true"]')?.focus())
      return
    }
    const next = steps[index + 1]
    if (next) {
      setStepId(next.id)
      setVisited((v) => (v.includes(next.id) ? v : [...v, next.id]))
    }
  }

  const goBack = () => {
    const prev = steps[index - 1]
    if (prev) setStepId(prev.id)
  }

  const onSubmit = (event) => {
    event.preventDefault()
    // Re-check every step, not just the visible one.
    const all = steps.reduce((acc, s) => ({ ...acc, ...validateStep(s.id) }), {})
    setErrors(all)
    if (Object.keys(all).length) {
      const broken = steps.find((s) => Object.keys(validateStep(s.id)).length)
      if (broken) setStepId(broken.id)
      return
    }
    setStatus('submitting')
    setTimeout(() => setStatus('done'), 900)
  }

  const pickDoc = (key, file, error) => {
    setDocs((d) => ({ ...d, [key]: file ?? undefined }))
    setDocErrors((d) => ({ ...d, [key]: error ?? undefined }))
    if (file && errors.documents) setErrors((e) => ({ ...e, documents: undefined }))
  }

  const reset = () => {
    setForm(EMPTY_FORM)
    setIsInstaller(false)
    setCerts([])
    setDocs({})
    setDocErrors({})
    setTerms(false)
    setErrors({})
    setStepId('account')
    setVisited(['account'])
    setStatus('idle')
  }

  /* -------------------------------- success ------------------------------- */

  if (status === 'done') {
    return (
      <section id="register" className="relative overflow-hidden px-5 py-24 sm:px-8 lg:py-32 lg:pl-[128px]">
        <div className="bg-blueprint mask-fade-edges absolute inset-0" aria-hidden="true" />
        <div className="bloom-solar absolute top-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2" aria-hidden="true" />

        <div className="border-ink-700 bg-ink-850/80 clip-bevel relative mx-auto max-w-xl border p-10 text-center backdrop-blur-sm">
          <span className="border-good/40 bg-good/10 text-good clip-bevel-sm mx-auto grid h-14 w-14 place-items-center border">
            <CheckIcon className="h-7 w-7" strokeWidth={2.2} />
          </span>

          <h2 className="font-display mt-6 text-2xl font-bold">Application received</h2>
          <p className="text-mute mt-3 text-sm leading-relaxed">
            Thanks {form.fullName.split(' ')[0] || 'there'} — your reference is{' '}
            <span className="text-solar-400 font-mono">JMC-2026-4821</span>. A confirmation is on its way to{' '}
            <span className="text-chalk">{form.email}</span>.
          </p>

          <CurrentRule className="my-7" />

          <dl className="grid gap-3 text-left">
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-mute-dim font-mono text-xs tracking-wide uppercase">Account type</dt>
              <dd className="text-chalk">{isInstaller ? 'Installer — pending verification' : 'Standard'}</dd>
            </div>
            {isInstaller && (
              <>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-mute-dim font-mono text-xs tracking-wide uppercase">Company</dt>
                  <dd className="text-chalk">{form.company}</dd>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-mute-dim font-mono text-xs tracking-wide uppercase">Documents</dt>
                  <dd className="text-chalk">{Object.values(docs).filter(Boolean).length} attached</dd>
                </div>
              </>
            )}
          </dl>

          {isInstaller && (
            <p className="text-mute border-ink-700 mt-7 border-t pt-6 text-xs leading-relaxed">
              Trade verification usually takes 1–2 business days. You can sign in and browse at the Registered tier
              in the meantime.
            </p>
          )}

          <Button type="button" variant="outline" onClick={reset} className="mt-8">
            Register another account
          </Button>
        </div>
      </section>
    )
  }

  /* --------------------------------- form -------------------------------- */

  const pwScore = passwordScore(form.password)

  return (
    <section id="register" className="relative overflow-hidden px-5 py-20 sm:px-8 lg:py-28 lg:pr-10 lg:pl-[128px]">
      <div className="bg-blueprint mask-fade-edges absolute inset-0" aria-hidden="true" />
      <div className="bloom-solar pointer-events-none absolute top-[-12%] right-[-12%] h-[520px] w-[520px]" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        {/* --------------------------------- aside -------------------------------- */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow index="04">Create account</Eyebrow>
          <SectionHeading className="mt-5">Register once, order from anywhere</SectionHeading>
          <p className="text-mute mt-5 text-base leading-relaxed">
            One account covers datasheets, firmware, monitoring and ordering. Installers get one extra step that
            unlocks trade pricing and advance-replacement RMA.
          </p>

          <CurrentRule className="my-8" />

          <div className="border-ink-700 bg-ink-850/50 clip-bevel-sm flex gap-3 border p-4">
            <ShieldIcon className="text-volt-300 h-5 w-5 shrink-0" />
            <p className="text-mute text-xs leading-relaxed">
              Documents are used for trade verification only and are never shared outside JMC. You can request
              deletion at any time.
            </p>
          </div>
        </div>

        {/* --------------------------------- form --------------------------------- */}
        <form
          noValidate
          onSubmit={onSubmit}
          className="border-ink-700 bg-ink-850/70 clip-bevel border p-6 backdrop-blur-sm sm:p-9"
        >
          {/* ------------------------------- stepper ------------------------------ */}
          <ol className="mb-8 flex items-center gap-1.5">
            {steps.map((s, i) => {
              const done = i < index
              const on = i === index
              const reachable = visited.includes(s.id)
              return (
                <li key={s.id} className="flex flex-1 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => reachable && setStepId(s.id)}
                    disabled={!reachable || status === 'submitting'}
                    aria-current={on ? 'step' : undefined}
                    className="group flex min-w-0 flex-1 flex-col gap-2 text-left disabled:cursor-default"
                  >
                    <span
                      className={cx(
                        'h-[3px] w-full transition-colors duration-300',
                        on ? 'bg-solar-500' : done ? 'bg-solar-500/45' : 'bg-ink-700',
                      )}
                    />
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cx(
                          'font-mono text-[10px] tabular-nums',
                          on ? 'text-solar-400' : done ? 'text-solar-500/60' : 'text-mute-dim',
                        )}
                      >
                        {done ? '✓' : `0${i + 1}`}
                      </span>
                      <span
                        className={cx(
                          'truncate font-mono text-[10px] tracking-[0.1em] uppercase',
                          on ? 'text-chalk' : 'text-mute-dim',
                        )}
                      >
                        {s.label}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          <fieldset disabled={status === 'submitting'} className="contents">
            <legend className="sr-only">{current.label}</legend>

            {/* ------------------------------ 01 account --------------------------- */}
            {current.id === 'account' && (
              <div className="animate-reveal grid gap-5 sm:grid-cols-2">
                <Field label="Full name" required error={errors.fullName} span={2}>
                  {(p) => (
                    <TextInput {...p} value={form.fullName} onChange={set('fullName')} placeholder="Juan Dela Cruz" autoComplete="name" />
                  )}
                </Field>

                <Field label="Work email" required error={errors.email}>
                  {(p) => (
                    <TextInput {...p} type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" autoComplete="email" />
                  )}
                </Field>

                <Field label="Phone" error={errors.phone}>
                  {(p) => (
                    <TextInput {...p} type="tel" value={form.phone} onChange={set('phone')} placeholder="+63 917 000 0000" autoComplete="tel" />
                  )}
                </Field>

                <Field label="Password" required error={errors.password}>
                  {(p) => (
                    <TextInput {...p} type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
                  )}
                </Field>

                <Field label="Confirm password" required error={errors.confirm}>
                  {(p) => (
                    <TextInput {...p} type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
                  )}
                </Field>

                {/* strength meter */}
                <div className="sm:col-span-2 -mt-1">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <span
                          key={n}
                          className={cx(
                            'h-1 flex-1 transition-colors duration-300',
                            n <= pwScore ? STRENGTH_COLOR[pwScore] : 'bg-ink-700',
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-mute-dim w-14 font-mono text-[10px] tracking-wide uppercase">
                      {STRENGTH[pwScore]}
                    </span>
                  </div>
                </div>

                <Field label="Country / region" required error={errors.country} span={2}>
                  {(p) => (
                    <Select {...p} value={form.country} onChange={set('country')}>
                      <option value="">Select a country…</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>
            )}

            {/* --------------------------- 02 organisation ------------------------- */}
            {current.id === 'org' && (
              <div className="animate-reveal">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Company / business name"
                    required={isInstaller}
                    error={errors.company}
                    span={2}
                    hint={isInstaller ? undefined : 'Leave blank if you are registering as a homeowner.'}
                  >
                    {(p) => (
                      <TextInput {...p} value={form.company} onChange={set('company')} placeholder="Dela Cruz Solar Services" autoComplete="organization" />
                    )}
                  </Field>

                  <Field label="Your role" span={2}>
                    {(p) => (
                      <Select {...p} value={form.role} onChange={set('role')}>
                        <option value="">Select…</option>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </div>

                <CurrentRule className="my-7" />

                {/* the fork in the flow */}
                <div
                  className={cx(
                    'clip-bevel-sm border p-5 transition-colors duration-300',
                    isInstaller ? 'border-solar-500/45 bg-solar-500/[0.07]' : 'border-ink-600 bg-ink-900/40',
                  )}
                >
                  <Checkbox
                    tone="solar"
                    name="isInstaller"
                    checked={isInstaller}
                    onChange={setIsInstaller}
                    label="I am a solar installer / electrical contractor"
                    description="Only tick this box if you install PV systems professionally. Ticking it adds a verification step that asks for your licence details and supporting documents. Homeowners and general buyers should leave it unchecked."
                  />

                  {isInstaller && (
                    <p className="animate-reveal border-solar-500/25 text-solar-300 mt-4 flex items-center gap-2 border-t pt-4 font-mono text-[11px] tracking-wide">
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                      Verification step added to this application
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* --------------------------- 03 verification ------------------------- */}
            {current.id === 'verify' && (
              <div className="animate-reveal">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Business registration no." required error={errors.businessRegNo}>
                    {(p) => <TextInput {...p} value={form.businessRegNo} onChange={set('businessRegNo')} placeholder="DTI / SEC / EIN" />}
                  </Field>

                  <Field label="Contractor licence no." required error={errors.licenceNo}>
                    {(p) => <TextInput {...p} value={form.licenceNo} onChange={set('licenceNo')} placeholder="PEE-000000" />}
                  </Field>

                  <Field label="Licence expiry" required error={errors.licenceExpiry}>
                    {(p) => <TextInput {...p} type="date" value={form.licenceExpiry} onChange={set('licenceExpiry')} />}
                  </Field>

                  <Field label="Years installing PV" required error={errors.yearsInstalling}>
                    {(p) => (
                      <Select {...p} value={form.yearsInstalling} onChange={set('yearsInstalling')}>
                        <option value="">Select…</option>
                        <option value="<1">Less than 1 year</option>
                        <option value="1-3">1–3 years</option>
                        <option value="3-7">3–7 years</option>
                        <option value="7+">More than 7 years</option>
                      </Select>
                    )}
                  </Field>

                  <Field label="Annual install volume">
                    {(p) => (
                      <Select {...p} value={form.annualVolume} onChange={set('annualVolume')}>
                        <option value="">Select…</option>
                        <option value="<50kW">Under 50 kW</option>
                        <option value="50-250kW">50–250 kW</option>
                        <option value="250kW-1MW">250 kW – 1 MW</option>
                        <option value="1MW+">Over 1 MW</option>
                      </Select>
                    )}
                  </Field>

                  <Field label="Primary service area">
                    {(p) => <TextInput {...p} value={form.serviceArea} onChange={set('serviceArea')} placeholder="Cebu, Bohol, Negros" />}
                  </Field>
                </div>

                <fieldset className="mt-7">
                  <legend className="mb-3 block text-xs font-medium tracking-wide text-chalk/90">
                    Certifications held <span className="text-mute-dim font-normal">(optional)</span>
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {CERTIFICATIONS.map((c) => (
                      <Checkbox
                        key={c}
                        label={c}
                        checked={certs.includes(c)}
                        onChange={(on) => setCerts((prev) => (on ? [...prev, c] : prev.filter((x) => x !== c)))}
                      />
                    ))}
                  </div>
                </fieldset>

                {/* ---------------------- supporting documents --------------------- */}
                <div className="mt-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs font-medium tracking-wide text-chalk/90">Supporting documents</span>
                    <span className="text-mute-dim font-mono text-[10px] tabular-nums">
                      {attachedRequired}/{requiredDocs.length} required
                    </span>
                  </div>

                  {/* progress across the required slots */}
                  <div className="bg-ink-700 mt-2.5 h-[3px] w-full">
                    <div
                      className="bg-solar-500 h-full transition-all duration-500"
                      style={{ width: `${(attachedRequired / requiredDocs.length) * 100}%` }}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {DOC_SLOTS.map((slot) => (
                      <DocumentSlot
                        key={slot.key}
                        slot={slot}
                        file={docs[slot.key]}
                        error={docErrors[slot.key]}
                        onPick={pickDoc}
                        onRemove={(k) => pickDoc(k, null, null)}
                        disabled={status === 'submitting'}
                      />
                    ))}
                  </div>

                  <p className="text-mute-dim mt-3 text-xs">PDF, JPG, PNG or DOC — up to 10 MB per document.</p>

                  {errors.documents && (
                    <p role="alert" className="text-bad mt-2 flex items-center gap-1.5 text-xs">
                      <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                      {errors.documents}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------ 04 review --------------------------- */}
            {current.id === 'review' && (
              <div className="animate-reveal">
                <h3 className="font-display text-lg font-semibold text-chalk">Check before submitting</h3>

                <div className="mt-6 flex flex-col gap-5">
                  {[
                    {
                      step: 'account',
                      title: 'Account',
                      rows: [
                        ['Name', form.fullName],
                        ['Email', form.email],
                        ['Phone', form.phone || '—'],
                        ['Country', form.country],
                      ],
                    },
                    {
                      step: 'org',
                      title: 'Organisation',
                      rows: [
                        ['Company', form.company || '—'],
                        ['Role', form.role || '—'],
                        ['Account type', isInstaller ? 'Installer' : 'Standard'],
                      ],
                    },
                    ...(isInstaller
                      ? [
                          {
                            step: 'verify',
                            title: 'Verification',
                            rows: [
                              ['Business reg.', form.businessRegNo],
                              ['Licence', form.licenceNo],
                              ['Expiry', form.licenceExpiry],
                              ['Experience', form.yearsInstalling],
                              ['Certifications', certs.length ? certs.join(', ') : '—'],
                              ['Documents', `${Object.values(docs).filter(Boolean).length} attached`],
                            ],
                          },
                        ]
                      : []),
                  ].map((group) => (
                    <div key={group.step} className="border-ink-700 bg-ink-900/40 clip-bevel-sm border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="text-mute-dim font-mono text-[10px] tracking-[0.16em] uppercase">
                          {group.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setStepId(group.step)}
                          className="text-volt-300 hover:text-solar-400 text-xs underline underline-offset-2 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                      <dl className="divide-ink-700/60 mt-3 divide-y">
                        {group.rows.map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 py-2">
                            <dt className="text-mute-dim text-xs">{k}</dt>
                            <dd className="max-w-[60%] truncate text-right text-xs text-chalk">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>

                <CurrentRule className="my-7" />

                <div className="flex flex-col gap-4">
                  <Checkbox
                    checked={terms}
                    onChange={(v) => {
                      setTerms(v)
                      if (v) setErrors((e) => ({ ...e, terms: undefined }))
                    }}
                    error={errors.terms}
                    label="I accept the terms of sale and privacy policy"
                  />
                  <Checkbox
                    checked={updates}
                    onChange={setUpdates}
                    label="Send me firmware and product bulletins"
                    description="Roughly one email a month. Unsubscribe any time."
                  />
                </div>
              </div>
            )}

            {/* ------------------------------ navigation -------------------------- */}
            <div className="border-ink-700/70 mt-9 flex items-center justify-between gap-4 border-t pt-6">
              {index > 0 ? (
                <Button type="button" variant="ghost" onClick={goBack}>
                  Back
                </Button>
              ) : (
                <span className="text-mute-dim text-xs">
                  Step {index + 1} of {steps.length}
                </span>
              )}

              {current.id === 'review' ? (
                <Button type="submit" size="lg" disabled={status === 'submitting'}>
                  {status === 'submitting' ? (
                    <>
                      <SpinnerIcon className="h-4 w-4" />
                      Submitting…
                    </>
                  ) : isInstaller ? (
                    'Submit installer application'
                  ) : (
                    'Create account'
                  )}
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={goNext}>
                  Continue
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </fieldset>
        </form>
      </div>
    </section>
  )
}

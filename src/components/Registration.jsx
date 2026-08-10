'use client'

import { useRef, useState } from 'react'
import { Button, CurrentRule, Eyebrow, SectionHeading, cx } from './ui.jsx'
import { Checkbox, Field, Select, TextInput } from './form.jsx'
import { AlertIcon, CheckIcon, FileIcon, ShieldIcon, SpinnerIcon, UploadIcon, XIcon } from './icons.jsx'

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

const CERTIFICATIONS = ['NABCEP', 'MCS', 'CEC Accredited', 'TÜV Rheinland', 'IEC 62446', 'Other / local scheme']

const ACCEPTED_TYPES = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
}

const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILES = 8

const EMPTY_FORM = {
  fullName: '',
  company: '',
  email: '',
  phone: '',
  country: '',
  password: '',
  confirm: '',
  businessRegNo: '',
  licenceNo: '',
  licenceExpiry: '',
  yearsInstalling: '',
  annualVolume: '',
  serviceArea: '',
}

/* --------------------------------- helpers -------------------------------- */

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const extensionLabel = (file) => ACCEPTED_TYPES[file.type] ?? file.name.split('.').pop()?.toUpperCase() ?? 'FILE'

/* ------------------------------- the section ------------------------------ */

export default function Registration() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [isInstaller, setIsInstaller] = useState(false)
  const [certs, setCerts] = useState([])
  const [files, setFiles] = useState([])
  const [fileErrors, setFileErrors] = useState([])
  const [terms, setTerms] = useState(false)
  const [updates, setUpdates] = useState(true)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | done
  const [dragging, setDragging] = useState(false)

  const fileInputRef = useRef(null)
  const dragDepth = useRef(0)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  /* ------------------------------ file handling ---------------------------- */

  const addFiles = (incoming) => {
    const rejected = []
    const accepted = []

    for (const file of Array.from(incoming)) {
      const typeOk = file.type in ACCEPTED_TYPES || /\.(pdf|jpe?g|png|webp|docx?)$/i.test(file.name)
      if (!typeOk) {
        rejected.push(`${file.name} — unsupported format`)
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected.push(`${file.name} — ${formatBytes(file.size)}, over the 10 MB limit`)
        continue
      }
      accepted.push(file)
    }

    setFiles((prev) => {
      // De-duplicate on name+size so re-dropping the same file is a no-op.
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`))
      const merged = [...prev]
      for (const file of accepted) {
        const key = `${file.name}:${file.size}`
        if (seen.has(key)) continue
        if (merged.length >= MAX_FILES) {
          rejected.push(`${file.name} — maximum ${MAX_FILES} files`)
          continue
        }
        seen.add(key)
        merged.push(file)
      }
      return merged
    })

    setFileErrors(rejected)
    if (accepted.length) setErrors((e) => ({ ...e, documents: undefined }))
  }

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index))

  const onDrop = (e) => {
    e.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
  }

  /* ------------------------------- validation ------------------------------ */

  const validate = () => {
    const e = {}

    if (!form.fullName.trim()) e.fullName = 'Enter your full name.'
    if (!form.email.trim()) e.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'That email address looks incomplete.'
    if (!form.country) e.country = 'Select your country.'
    if (form.password.length < 8) e.password = 'Use at least 8 characters.'
    if (form.confirm !== form.password) e.confirm = 'The two passwords do not match.'
    if (!terms) e.terms = 'Please accept the terms to continue.'

    // Everything below only applies once the installer box is ticked.
    if (isInstaller) {
      if (!form.company.trim()) e.company = 'Required for installer accounts.'
      if (!form.businessRegNo.trim()) e.businessRegNo = 'Enter your business registration number.'
      if (!form.licenceNo.trim()) e.licenceNo = 'Enter your contractor licence number.'
      if (!form.licenceExpiry) e.licenceExpiry = 'Enter the licence expiry date.'
      if (!form.yearsInstalling) e.yearsInstalling = 'Select your experience level.'
      if (files.length === 0) e.documents = 'Upload at least one supporting document.'
    }

    return e
  }

  const onSubmit = (event) => {
    event.preventDefault()
    const found = validate()
    setErrors(found)

    if (Object.keys(found).length > 0) {
      // Move focus to the first thing that failed.
      requestAnimationFrame(() => {
        document.querySelector('#register [aria-invalid="true"]')?.focus()
      })
      return
    }

    setStatus('submitting')
    // No backend yet — this stands in for the POST so the UX can be reviewed.
    setTimeout(() => setStatus('done'), 900)
  }

  const reset = () => {
    setForm(EMPTY_FORM)
    setIsInstaller(false)
    setCerts([])
    setFiles([])
    setFileErrors([])
    setTerms(false)
    setErrors({})
    setStatus('idle')
  }

  /* -------------------------------- success -------------------------------- */

  if (status === 'done') {
    return (
      <section id="register" className="relative overflow-hidden px-5 py-24 sm:px-8 lg:py-32">
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
                  <dd className="text-chalk">
                    {files.length} file{files.length === 1 ? '' : 's'} submitted
                  </dd>
                </div>
              </>
            )}
          </dl>

          {isInstaller && (
            <p className="text-mute border-ink-700 mt-7 border-t pt-6 text-xs leading-relaxed">
              Trade verification usually takes 1–2 business days. You can sign in and browse pricing at the
              Registered tier in the meantime.
            </p>
          )}

          <Button type="button" variant="outline" onClick={reset} className="mt-8">
            Register another account
          </Button>
        </div>
      </section>
    )
  }

  /* --------------------------------- form ---------------------------------- */

  return (
    <section id="register" className="relative overflow-hidden px-5 py-20 sm:px-8 lg:py-28">
      <div className="bg-blueprint mask-fade-edges absolute inset-0" aria-hidden="true" />
      <div
        className="bloom-solar pointer-events-none absolute top-[-10%] right-[-10%] h-[520px] w-[520px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        {/* ------------------------------- aside ------------------------------ */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow index="04">Create account</Eyebrow>
          <SectionHeading className="mt-5">Register once, order from anywhere</SectionHeading>
          <p className="text-mute mt-5 text-base leading-relaxed">
            One account covers datasheets, firmware, monitoring and ordering. Installers get an extra verification
            step that unlocks trade pricing and advance-replacement RMA.
          </p>

          <CurrentRule className="my-8" />

          <ol className="flex flex-col gap-5">
            {[
              { n: '1', t: 'Fill in your details', d: 'Takes about two minutes. Email verification is instant.' },
              {
                n: '2',
                t: 'Tick the installer box — if it applies',
                d: 'That reveals the licence fields and document upload. Skip it and you are done.',
              },
              {
                n: '3',
                t: 'We verify and upgrade the tier',
                d: 'Our trade team reviews documents within 1–2 business days.',
              },
            ].map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="border-ink-600 bg-ink-850 text-solar-400 clip-bevel-sm grid h-8 w-8 shrink-0 place-items-center border font-mono text-xs">
                  {s.n}
                </span>
                <div>
                  <p className="text-sm font-semibold text-chalk">{s.t}</p>
                  <p className="text-mute mt-1 text-xs leading-relaxed">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="border-ink-700 bg-ink-850/50 clip-bevel-sm mt-8 flex gap-3 border p-4">
            <ShieldIcon className="text-volt-300 h-5 w-5 shrink-0" />
            <p className="text-mute text-xs leading-relaxed">
              Documents are used for trade verification only and are never shared outside JMC. You can request
              deletion at any time.
            </p>
          </div>
        </div>

        {/* -------------------------------- form ------------------------------ */}
        <form
          noValidate
          onSubmit={onSubmit}
          className="border-ink-700 bg-ink-850/70 clip-bevel border p-6 backdrop-blur-sm sm:p-9"
        >
          <fieldset disabled={status === 'submitting'} className="contents">
            <legend className="sr-only">Account registration</legend>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" required error={errors.fullName} span={2}>
                {(p) => <TextInput {...p} value={form.fullName} onChange={set('fullName')} placeholder="Juan Dela Cruz" autoComplete="name" />}
              </Field>

              <Field
                label="Company / business name"
                required={isInstaller}
                error={errors.company}
                span={2}
                hint={isInstaller ? undefined : 'Leave blank if you are registering as a homeowner.'}
              >
                {(p) => (
                  <TextInput
                    {...p}
                    value={form.company}
                    onChange={set('company')}
                    placeholder="Dela Cruz Solar Services"
                    autoComplete="organization"
                  />
                )}
              </Field>

              <Field label="Work email" required error={errors.email}>
                {(p) => (
                  <TextInput
                    {...p}
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                )}
              </Field>

              <Field label="Phone" error={errors.phone}>
                {(p) => (
                  <TextInput {...p} type="tel" value={form.phone} onChange={set('phone')} placeholder="+63 917 000 0000" autoComplete="tel" />
                )}
              </Field>

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

              <Field label="Password" required error={errors.password} hint="Minimum 8 characters.">
                {(p) => (
                  <TextInput {...p} type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
                )}
              </Field>

              <Field label="Confirm password" required error={errors.confirm}>
                {(p) => (
                  <TextInput {...p} type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
                )}
              </Field>
            </div>

            <CurrentRule className="my-8" />

            {/* ----------------------- the installer gate ---------------------- */}
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
                description="Only tick this box if you install PV systems professionally. Ticking it adds a short licence section and asks for supporting documents so we can verify your trade account. Homeowners and general buyers should leave it unchecked."
              />
            </div>

            {/* --------------- conditional: installer verification -------------- */}
            {isInstaller && (
              <div className="animate-reveal mt-6">
                <div className="border-ink-700 clip-bevel-sm border border-dashed p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="bg-solar-500 text-ink-950 clip-bevel-sm px-2 py-1 font-mono text-[9px] font-semibold tracking-[0.16em] uppercase">
                      Installer only
                    </span>
                    <h3 className="text-sm font-semibold text-chalk">Trade verification</h3>
                  </div>
                  <p className="text-mute mt-2.5 text-xs leading-relaxed">
                    We check these against your local licensing registry. Nothing here is published on your public
                    installer profile.
                  </p>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
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

                  {/* certifications */}
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

                  {/* ------------------ supporting documents ------------------ */}
                  <div className="mt-8">
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="text-xs font-medium tracking-wide text-chalk/90">
                        Supporting documents
                        <span className="text-solar-500 ml-1" aria-hidden="true">
                          *
                        </span>
                      </span>
                      <span className="text-mute-dim font-mono text-[10px]">
                        {files.length}/{MAX_FILES}
                      </span>
                    </div>
                    <p className="text-mute-dim mb-3 text-xs leading-relaxed">
                      Business registration, contractor licence, insurance certificate and any PV certifications.
                      PDF, JPG, PNG or DOC — up to 10 MB each.
                    </p>

                    <label
                      onDragEnter={(e) => {
                        e.preventDefault()
                        dragDepth.current += 1
                        setDragging(true)
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDragLeave={(e) => {
                        e.preventDefault()
                        dragDepth.current -= 1
                        if (dragDepth.current <= 0) setDragging(false)
                      }}
                      onDrop={onDrop}
                      className={cx(
                        'clip-bevel-sm flex cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-9 text-center transition-colors duration-200',
                        dragging
                          ? 'border-solar-500 bg-solar-500/10'
                          : errors.documents
                            ? 'border-bad/60 bg-ink-900/40'
                            : 'border-ink-600 bg-ink-900/40 hover:border-solar-500/60 hover:bg-ink-900/70',
                      )}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        aria-invalid={errors.documents ? true : undefined}
                        onChange={(e) => {
                          addFiles(e.target.files)
                          e.target.value = '' // allow re-selecting the same file
                        }}
                        className="sr-only"
                      />
                      <UploadIcon className={cx('h-7 w-7', dragging ? 'text-solar-400' : 'text-mute-dim')} />
                      <p className="mt-3 text-sm text-chalk">
                        <span className="text-solar-400 font-medium">Choose files</span> or drag them here
                      </p>
                      <p className="text-mute-dim mt-1 text-xs">Up to {MAX_FILES} files, 10 MB each</p>
                    </label>

                    {errors.documents && (
                      <p role="alert" className="text-bad mt-2 flex items-center gap-1.5 text-xs">
                        <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                        {errors.documents}
                      </p>
                    )}

                    {fileErrors.length > 0 && (
                      <ul className="border-bad/40 bg-bad/[0.07] clip-bevel-sm mt-3 space-y-1 border p-3">
                        {fileErrors.map((msg) => (
                          <li key={msg} className="text-bad flex gap-2 text-xs">
                            <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
                            {msg}
                          </li>
                        ))}
                      </ul>
                    )}

                    {files.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {files.map((file, i) => (
                          <li
                            key={`${file.name}-${file.size}`}
                            className="border-ink-700 bg-ink-900/60 clip-bevel-sm flex items-center gap-3 border px-3 py-2.5"
                          >
                            <FileIcon className="text-volt-300 h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate text-xs text-chalk">{file.name}</span>
                            <span className="text-mute-dim shrink-0 font-mono text-[10px] tracking-wide">
                              {extensionLabel(file)} · {formatBytes(file.size)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="text-mute-dim hover:text-bad shrink-0 rounded p-1 transition-colors"
                              aria-label={`Remove ${file.name}`}
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            <CurrentRule className="my-8" />

            <div className="flex flex-col gap-4">
              <Checkbox
                checked={terms}
                onChange={setTerms}
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

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" size="lg" disabled={status === 'submitting'} className="w-full sm:w-auto">
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
              <p className="text-mute-dim text-xs">
                Already registered?{' '}
                <a href="#register" className="text-volt-300 hover:text-solar-400 underline underline-offset-2">
                  Sign in
                </a>
              </p>
            </div>
          </fieldset>
        </form>
      </div>
    </section>
  )
}

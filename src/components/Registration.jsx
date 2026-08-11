'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import LegalDialog from './LegalDialog.jsx'
import LoginDialog from './LoginDialog.jsx'
import { Button, Eyebrow, Rule, SectionHeading, cx } from './ui.jsx'
import { Checkbox, Field, Select, TextInput } from './form.jsx'
import { AlertIcon, ArrowRightIcon, CheckIcon, ShieldIcon, SpinnerIcon, UploadIcon, XIcon } from './icons.jsx'
import { signUp } from '@/app/actions/auth'
import { submitVerification } from '@/app/actions/verification'

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

/**
 * Named slots rather than one "drop your files here" bucket. Installers can
 * see exactly which document is missing without reading an error message.
 */
const DOC_SLOTS = [
  { key: 'registration', label: 'Business registration', hint: 'DTI, SEC or equivalent', required: true },
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
  address: '',
  country: '',
  company: '',
  role: '',
  businessRegNo: '',
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
/** Weak reads hot, strong reads cool — the same axis the rest of the page uses. */
const STRENGTH_COLOR = ['bg-rule', 'bg-hot-600', 'bg-hot-400', 'bg-cool-500', 'bg-cool-600']

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
      <div className="border-cool-600/45 bg-cool-600/[0.07] flex items-center gap-3 border px-3.5 py-3">
        <CheckIcon className="text-cool-600 h-4 w-4 shrink-0" strokeWidth={2.4} />
        <span className="min-w-0 flex-1">
          <span className="text-ink block truncate text-xs font-medium">{slot.label}</span>
          <span className="text-ink-soft block truncate font-mono text-[11px]">
            {file.name} · {formatBytes(file.size)}
          </span>
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRemove(slot.key)}
          className="text-ink-soft hover:text-hot-600 shrink-0 p-1 transition-colors"
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
          'flex cursor-pointer items-center gap-3 border border-dashed px-3.5 py-3 transition-colors duration-200',
          dragging
            ? 'border-cool-600 bg-cool-600/10'
            : error
              ? 'border-hot-600 bg-glare'
              : 'border-rule-strong bg-glare hover:border-cool-600 hover:bg-cool-600/[0.05]',
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
        <UploadIcon className={cx('h-4 w-4 shrink-0', dragging ? 'text-cool-600' : 'text-ink-soft')} />
        <span className="min-w-0 flex-1">
          <span className="text-ink block text-xs font-medium">
            {slot.label}
            {slot.required ? (
              <span className="text-hot-600 ml-1">*</span>
            ) : (
              <span className="text-ink-soft ml-1.5 font-normal">optional</span>
            )}
          </span>
          <span className="text-ink-soft block text-[10px]">{slot.hint}</span>
        </span>
        <span className="text-cool-600 shrink-0 label">Attach</span>
      </label>
      {error && (
        <p role="alert" className="text-hot-600 mt-2 flex items-center gap-1.5 text-xs">
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
  const [docs, setDocs] = useState({})
  const [docErrors, setDocErrors] = useState({})
  const [terms, setTerms] = useState(false)
  const [updates, setUpdates] = useState(true)
  const [errors, setErrors] = useState({})
  const [stepId, setStepId] = useState('account')
  const [visited, setVisited] = useState(['account'])
  const [status, setStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [verificationNote, setVerificationNote] = useState('')
  const [login, setLogin] = useState(false)
  const [legalDoc, setLegalDoc] = useState(null)
  const successRef = useRef(null)

  // Submitting swaps the whole section out. Without moving focus, a keyboard
  // or screen-reader user got silence after the most consequential action on
  // the site, with focus stranded on a button that no longer exists.
  useEffect(() => {
    if (status === 'done') successRef.current?.focus()
  }, [status])

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
    // Nothing on the organisation step blocks progress — company name is
    // optional for installers as well as homeowners.

    if (id === 'verify') {
      if (!form.businessRegNo.trim()) e.businessRegNo = 'Enter your business registration number.'
      if (!form.yearsInstalling) e.yearsInstalling = 'Select your experience level.'
      if (attachedRequired < requiredDocs.length) e.documents = 'Attach your business registration document.'
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

  const onSubmit = async (event) => {
    event.preventDefault()
    // Re-check every step, not just the visible one.
    const all = steps.reduce((acc, s) => ({ ...acc, ...validateStep(s.id) }), {})
    setErrors(all)
    if (Object.keys(all).length) {
      const broken = steps.find((s) => Object.keys(validateStep(s.id)).length)
      if (broken) setStepId(broken.id)
      return
    }

    setSubmitError('')
    setVerificationNote('')
    setStatus('submitting')

    const signUpData = new FormData()
    signUpData.set('email', form.email.trim())
    signUpData.set('password', form.password)
    signUpData.set('customer_type', isInstaller ? 'installer' : 'individual')
    signUpData.set('full_name', form.fullName.trim())
    if (form.company.trim()) signUpData.set('company_name', form.company.trim())

    const signUpResult = await signUp(signUpData)

    if (signUpResult.error) {
      setSubmitError(signUpResult.error)
      setStatus('idle')
      setStepId('account')
      return
    }

    if (isInstaller) {
      if (!signUpResult.hasSession) {
        // No session yet (email confirmation required) — verification docs
        // need an authenticated user, so they can't be uploaded until the
        // installer confirms their email and logs in.
        setVerificationNote(
          'Confirm your email, then log in to finish submitting your verification documents.',
        )
      } else {
        const verifyData = new FormData()
        verifyData.set('business_registration_number', form.businessRegNo.trim())
        verifyData.set('years_installing', form.yearsInstalling)
        if (form.annualVolume) verifyData.set('annual_install_volume', form.annualVolume)
        if (form.serviceArea.trim()) verifyData.set('primary_service_area', form.serviceArea.trim())
        verifyData.set('business_registration', docs.registration)
        if (docs.certs) verifyData.set('pv_certification', docs.certs)

        const verifyResult = await submitVerification(verifyData)
        if (verifyResult.error) {
          setVerificationNote(
            `Your account was created, but the verification documents could not be submitted: ${verifyResult.error} You can resubmit them after logging in.`,
          )
        }
      }
    }

    setStatus('done')
  }

  const pickDoc = (key, file, error) => {
    setDocs((d) => ({ ...d, [key]: file ?? undefined }))
    setDocErrors((d) => ({ ...d, [key]: error ?? undefined }))
    if (file && errors.documents) setErrors((e) => ({ ...e, documents: undefined }))
  }

  const reset = () => {
    setForm(EMPTY_FORM)
    setIsInstaller(false)
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
      /* Same vertical rhythm as the form it replaces, so submitting does not
         make the page jump. */
      <section id="register" className="band-sheet rail py-24 lg:py-32 xl:py-40">
        <div className="border-rule bg-glare corner-ticks text-ink max-w-xl border p-10">
          <span className="border-cool-600 text-cool-600 grid h-12 w-12 place-items-center border">
            <CheckIcon className="h-6 w-6" strokeWidth={2.2} />
          </span>

          <h2 ref={successRef} tabIndex={-1} className="display-wide text-display-2 mt-7 font-semibold outline-none">
            Application received
          </h2>
          <p className="text-ink-soft mt-4 leading-relaxed">
            Thanks {form.fullName.split(' ')[0] || 'there'} — your account has been created. A confirmation is on its
            way to <span className="text-ink">{form.email}</span>.
          </p>

          {verificationNote && (
            <p
              role="status"
              className="border-hot-600/40 bg-hot-600/[0.06] text-ink mt-5 flex items-start gap-2.5 border px-3.5 py-3 text-xs leading-relaxed"
            >
              <AlertIcon className="text-hot-600 mt-px h-3.5 w-3.5 shrink-0" />
              {verificationNote}
            </p>
          )}

          <Rule className="my-8" />

          <dl className="grid gap-px">
            <div className="border-rule flex justify-between gap-4 border-b py-2.5 text-sm">
              <dt className="label text-ink-soft">Account type</dt>
              <dd className="text-ink">{isInstaller ? 'Installer — pending verification' : 'Standard'}</dd>
            </div>
            {isInstaller && (
              <>
                <div className="border-rule flex justify-between gap-4 border-b py-2.5 text-sm">
                  <dt className="label text-ink-soft">Company</dt>
                  <dd className="text-ink">{form.company || '—'}</dd>
                </div>
                <div className="border-rule flex justify-between gap-4 border-b py-2.5 text-sm">
                  <dt className="label text-ink-soft">Documents</dt>
                  <dd className="text-ink">{Object.values(docs).filter(Boolean).length} attached</dd>
                </div>
              </>
            )}
          </dl>

          {isInstaller && (
            <p className="text-ink-soft mt-7 text-sm leading-relaxed">
              Trade verification usually takes 1–2 business days. You can log in and browse at the Registered tier in
              the meantime.
            </p>
          )}

          {/* The account exists now, so the next errand is getting into it —
              that becomes the primary action, and registering again drops to
              the quieter one. */}
          <p className="text-ink-soft mt-9 text-sm leading-relaxed">Click to log in to your new account.</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" size="lg" onClick={() => setLogin(true)}>
              Log in
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={reset}>
              Register another account
            </Button>
          </div>
        </div>

        <LoginDialog open={login} onClose={() => setLogin(false)} />
      </section>
    )
  }

  /* --------------------------------- form -------------------------------- */

  const pwScore = passwordScore(form.password)

  return (
    <section id="register" className="band-sheet rail py-24 lg:py-32 xl:py-40">
      <div className="rail-inner grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        {/* --------------------------------- aside -------------------------------- */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>Create account</Eyebrow>
          <SectionHeading className="mt-6">Register once, order from anywhere</SectionHeading>
          <p className="text-ink-soft mt-6 leading-relaxed">
            One account covers datasheets, firmware, monitoring and ordering. Installers get one extra step that unlocks
            trade pricing and advance-replacement RMA.
          </p>

          <Rule className="my-8" />

          <div className="border-rule flex gap-3 border p-4">
            <ShieldIcon className="text-cool-600 h-5 w-5 shrink-0" />
            <p className="text-ink-soft text-xs leading-relaxed">
              Documents are used for trade verification only and are never shared outside VIP. You can request deletion
              at any time.
            </p>
          </div>
        </div>

        {/* --------------------------------- form --------------------------------- */}
        <form noValidate onSubmit={onSubmit} className="border-rule bg-glare corner-ticks text-ink border p-6 sm:p-9">
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
                        on ? 'bg-cool-600' : done ? 'bg-cool-500' : 'bg-rule',
                      )}
                    />
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cx(
                          'label tabular-nums',
                          on ? 'text-cool-600' : done ? 'text-cool-500' : 'text-ink-soft',
                        )}
                      >
                        {done ? '✓' : `0${i + 1}`}
                      </span>
                      <span className={cx('label truncate', on ? 'text-ink' : 'text-ink-soft')}>{s.label}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          {submitError && (
            <p
              role="alert"
              className="border-hot-600/40 bg-hot-600/[0.06] text-hot-600 mb-6 flex items-start gap-2.5 border px-3.5 py-3 text-xs leading-relaxed"
            >
              <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
              {submitError}
            </p>
          )}

          <fieldset disabled={status === 'submitting'} className="contents">
            <legend className="sr-only">{current.label}</legend>

            {/* ------------------------------ 01 account --------------------------- */}
            {current.id === 'account' && (
              <div className="animate-reveal grid gap-5 sm:grid-cols-2">
                <Field label="Full name" required error={errors.fullName} span={2}>
                  {(p) => (
                    <TextInput
                      {...p}
                      value={form.fullName}
                      onChange={set('fullName')}
                      placeholder="Juan Dela Cruz"
                      autoComplete="name"
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
                    <TextInput
                      {...p}
                      type="tel"
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="+63 917 000 0000"
                      autoComplete="tel"
                    />
                  )}
                </Field>

                <Field label="Password" required error={errors.password}>
                  {(p) => (
                    <TextInput
                      {...p}
                      type="password"
                      value={form.password}
                      onChange={set('password')}
                      autoComplete="new-password"
                    />
                  )}
                </Field>

                <Field label="Confirm password" required error={errors.confirm}>
                  {(p) => (
                    <TextInput
                      {...p}
                      type="password"
                      value={form.confirm}
                      onChange={set('confirm')}
                      autoComplete="new-password"
                    />
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
                            n <= pwScore ? STRENGTH_COLOR[pwScore] : 'bg-rule',
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-ink-soft label w-14">{STRENGTH[pwScore]}</span>
                  </div>
                </div>

                <Field label="Street address" span={2} hint="Optional — where deliveries and paperwork should go.">
                  {(p) => (
                    <TextInput
                      {...p}
                      value={form.address}
                      onChange={set('address')}
                      placeholder="123 Mango Ave, Barangay Kamputhaw, Cebu City"
                      autoComplete="street-address"
                    />
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
              </div>
            )}

            {/* --------------------------- 02 organisation ------------------------- */}
            {current.id === 'org' && (
              <div className="animate-reveal">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Company / business name"
                    span={2}
                    hint="Optional — leave blank if you are registering as a homeowner."
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

                <Rule className="my-8" />

                {/* the fork in the flow */}
                <div
                  className={cx(
                    'border p-5 transition-colors duration-300',
                    isInstaller ? 'border-hot-600/50 bg-hot-600/[0.06]' : 'border-rule-strong bg-sheet/60',
                  )}
                >
                  <Checkbox
                    tone="hot"
                    name="isInstaller"
                    checked={isInstaller}
                    onChange={setIsInstaller}
                    label="I am a solar installer / electrical contractor"
                    description="Only tick this box if you install PV systems professionally. Ticking it adds a verification step that asks for your licence details and supporting documents. Homeowners and general buyers should leave it unchecked."
                  />

                  {isInstaller && (
                    <p className="animate-reveal border-hot-600/25 text-hot-600 mt-4 flex items-center gap-2 border-t pt-4 font-mono text-[11px] tracking-wide">
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
                    {(p) => (
                      <TextInput
                        {...p}
                        value={form.businessRegNo}
                        onChange={set('businessRegNo')}
                        placeholder="DTI / SEC / EIN"
                      />
                    )}
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
                    {(p) => (
                      <TextInput
                        {...p}
                        value={form.serviceArea}
                        onChange={set('serviceArea')}
                        placeholder="Cebu, Bohol, Negros"
                      />
                    )}
                  </Field>
                </div>

                {/* ---------------------- supporting documents --------------------- */}
                <div className="mt-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="label text-ink">Supporting documents</span>
                    <span className="label text-ink-soft tabular-nums">
                      {attachedRequired}/{requiredDocs.length} required
                    </span>
                  </div>

                  {/* progress across the required slots */}
                  <div className="bg-rule mt-3 h-[3px] w-full">
                    <div
                      className="bg-cool-600 h-full transition-all duration-500"
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

                  <p className="text-ink-soft mt-3 text-xs">PDF, JPG, PNG or DOC — up to 10 MB per document.</p>

                  {errors.documents && (
                    <p role="alert" className="text-hot-600 mt-2 flex items-center gap-1.5 text-xs">
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
                <h3 className="display-wide text-ink text-xl font-semibold">Check before submitting</h3>

                <div className="mt-6 flex flex-col gap-5">
                  {[
                    {
                      step: 'account',
                      title: 'Account',
                      rows: [
                        ['Name', form.fullName],
                        ['Email', form.email],
                        ['Phone', form.phone || '—'],
                        ['Address', form.address || '—'],
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
                              ['Experience', form.yearsInstalling],
                              ['Annual volume', form.annualVolume || '—'],
                              ['Service area', form.serviceArea || '—'],
                              ['Documents', `${Object.values(docs).filter(Boolean).length} attached`],
                            ],
                          },
                        ]
                      : []),
                  ].map((group) => (
                    <div key={group.step} className="border-rule bg-sheet/60 border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="label text-ink-soft">{group.title}</h4>
                        <button
                          type="button"
                          onClick={() => setStepId(group.step)}
                          className="text-ink-soft hover:text-ink text-xs underline underline-offset-2 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                      <dl className="divide-rule mt-3 divide-y">
                        {group.rows.map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 py-2">
                            <dt className="text-ink-soft text-xs">{k}</dt>
                            <dd className="text-ink max-w-[60%] truncate text-right text-xs">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>

                <Rule className="my-8" />

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

                  {/* Below the checkbox rather than inside its label: a link
                      nested in a <label> toggles the box on the way through,
                      so opening the document would tick the consent you had
                      not read yet. */}
                  <p className="text-ink-soft -mt-1 pl-8 text-xs leading-relaxed">
                    Read the{' '}
                    <button
                      type="button"
                      onClick={() => setLegalDoc('terms')}
                      className="text-ink border-b border-current/40 pb-px font-medium transition-colors hover:border-current"
                    >
                      terms of sale
                    </button>{' '}
                    and the{' '}
                    <button
                      type="button"
                      onClick={() => setLegalDoc('privacy')}
                      className="text-ink border-b border-current/40 pb-px font-medium transition-colors hover:border-current"
                    >
                      privacy policy
                    </button>
                    .
                  </p>
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
            <div className="border-rule mt-10 flex items-center justify-between gap-4 border-t pt-6">
              {index > 0 ? (
                <Button type="button" variant="ghost" onClick={goBack}>
                  Back
                </Button>
              ) : (
                <span className="label text-ink-soft">
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

      <LegalDialog doc={legalDoc} onSelect={setLegalDoc} onClose={() => setLegalDoc(null)} />
    </section>
  )
}

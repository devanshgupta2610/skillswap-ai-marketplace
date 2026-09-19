import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

const features = [
  {
    icon: Sparkles,
    title: 'AI Portfolio Builder',
    body: 'Upload work once. Get polished titles, descriptions, skills, and portfolio cards in seconds.',
  },
  {
    icon: Brain,
    title: 'Trust-weighted matching',
    body: 'Clients find creators by skills, portfolio similarity, and trust — not race-to-bottom pricing.',
  },
  {
    icon: Shield,
    title: 'Milestone-safe bookings',
    body: 'Projects move Pending → Completed with milestones that protect student creators.',
  },
  {
    icon: Users,
    title: 'Creator-first marketplace',
    body: 'Built for students and young creators who need proof of skill, not years of experience.',
  },
]

const steps = [
  { n: '01', title: 'Showcase with AI', body: 'Generate a portfolio that reads professional from day one.' },
  { n: '02', title: 'Get matched', body: 'Jobs surface creators with compatibility scores and clear reasons.' },
  { n: '03', title: 'Deliver safely', body: 'Book, milestone, submit, and collect verified reviews.' },
]

const faqs = [
  {
    q: 'Is this another Fiverr clone?',
    a: 'No. SkillSwap AI prioritizes AI portfolios and trust-weighted matching over lowest-price bidding.',
  },
  {
    q: 'Do I need an OpenAI key?',
    a: 'Optional. Without a key the backend uses smart heuristics so demos still work end-to-end.',
  },
  {
    q: 'Who is this for?',
    a: 'Students, campus creators, early freelancers, and clients who want verified youthful talent.',
  },
]

export function LandingPage() {
  const { user } = useAuth()
  const dash = user ? (user.role === 'creator' ? '/creator' : '/client') : '/register'

  return (
    <div className="gradient-mesh min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="text-xl font-semibold tracking-tight">
          SkillSwap <span className="text-accent">AI</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-text-muted md:flex">
          <a href="#features" className="hover:text-text">
            Features
          </a>
          <a href="#how" className="hover:text-text">
            How it works
          </a>
          <a href="#faq" className="hover:text-text">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button onClick={() => (window.location.href = dash)}>Dashboard</Button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/register">
                <Button>Get started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Smart India Hackathon · Track 2
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-text sm:text-6xl">
            SkillSwap <span className="text-accent">AI</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-text-muted sm:text-lg">
            The AI marketplace where students showcase real skill, get matched with clients
            intelligently, and complete projects with milestone protection.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to={dash}>
              <Button size="lg">
                Start building <ArrowRight size={16} />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="secondary">
                See how it works
              </Button>
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
            <span>AI portfolios</span>
            <span>Trust-weighted match</span>
            <span>Milestone-safe bookings</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="glass mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl"
        >
          <div className="border-b border-border px-5 py-3 text-left text-xs text-text-muted">
            Live product preview
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            {['AI Portfolio Card', '92% Match Score', 'Milestone Escrow'].map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.1 }}
                className="rounded-2xl border border-border bg-white/[0.03] p-4 text-left"
              >
                <p className="text-xs text-accent">{label}</p>
                <p className="mt-2 text-sm text-text-muted">
                  {i === 0 && 'Generated title, skills, and tools from raw project notes.'}
                  {i === 1 && 'Trust + portfolio similarity beat lowest-price ranking.'}
                  {i === 2 && 'Pending → Accepted → In Progress → Submitted → Completed.'}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">Built differently</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-text-muted">
          Experience-first hiring locks students out. SkillSwap leads with proof of work and AI.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6"
            >
              <f.icon className="text-accent" size={22} />
              <h3 className="mt-4 text-lg font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border p-6">
              <p className="text-sm font-semibold text-accent">{s.n}</p>
              <h3 className="mt-3 text-lg font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">What creators say</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              name: 'Ananya · NIT',
              quote: 'My AI portfolio finally looked client-ready. I booked my first design gig in a week.',
            },
            {
              name: 'Rahul · Startup founder',
              quote: 'Matching reasons made hiring transparent. We picked skill fit over cheapest bid.',
            },
            {
              name: 'Meera · Freelancer',
              quote: 'Milestones meant I never shipped full work without clarity. Huge for student freelancers.',
            },
          ].map((t) => (
            <blockquote key={t.name} className="glass rounded-2xl p-6">
              <p className="text-sm text-text-muted">“{t.quote}”</p>
              <footer className="mt-4 text-sm font-medium text-text">{t.name}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <FaqItem key={f.q} {...f} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <div className="glass rounded-3xl px-6 py-12 text-center sm:px-12">
          <CheckCircle2 className="mx-auto text-accent" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">Ready to swap skills smarter?</h2>
          <p className="mx-auto mt-3 max-w-lg text-text-muted">
            Join as a creator or client and experience AI portfolios, intelligent matching, and safe delivery.
          </p>
          <Link to="/register" className="mt-6 inline-block">
            <Button size="lg">Create free account</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-text-muted">
        SkillSwap AI · Smart India Hackathon Track 2 · Not a Fiverr clone
      </footer>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        {q}
        <ChevronDown size={16} className={open ? 'rotate-180 transition' : 'transition'} />
      </button>
      {open && <p className="border-t border-border px-4 py-3 text-sm text-text-muted">{a}</p>}
    </div>
  )
}

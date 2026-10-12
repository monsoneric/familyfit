import { useState } from 'react'

const WARMUP = [
  { name: 'Kettlebell Halos', reps: '5 each direction', cue: 'Keep the bell close to your head. Move slowly and controlled. Great for shoulder mobility.' },
  { name: 'Bodyweight Squats', reps: '10 reps', cue: 'Feet shoulder-width apart, chest up, knees track over toes. Full depth if comfortable.' },
  { name: 'Hip Hinges (Good Mornings)', reps: '10 reps', cue: 'Soft knee bend, push hips back like closing a car door with your hips. Feel the hamstring stretch.' },
]

const EXERCISES = [
  {
    id: 'deadlift-swing',
    name: 'KB Deadlift → Two-Hand Swing',
    sets: '3 sets',
    reps: '5 deadlifts + 10 swings',
    rest: '90 sec rest',
    videoId: 'op9kVnSso6Q',
    swingVideoId: 'm-S9H2XVvYg',
    cues: [
      'Deadlift: Bell between feet, hinge at hips, flat back, drive through heels to stand.',
      'Swing: After 5 deadlifts, hike the bell back like a football snap, then drive hips forward explosively.',
      'Top of swing: Stand tall, glutes squeezed, bell floats to chest height.',
      'Let the bell swing back between your legs — don\'t squat it down.',
    ],
    note: 'Focus on the hip hinge pattern — this is the foundation of all kettlebell work.',
  },
  {
    id: 'floor-press',
    name: 'KB Floor Press',
    sets: '3 sets',
    reps: '8–10 reps each side',
    rest: '90 sec rest',
    videoId: 'pKv-FiGFaWI',
    cues: [
      'Lie on your back, knee on same side as working arm bent, opposite leg flat.',
      'Press bell straight up, then lower until upper arm touches floor.',
      'Keep wrist straight over elbow over shoulder.',
      'Pause briefly on the floor — don\'t bounce.',
    ],
    note: 'Great upper-body press that\'s safe on the shoulder and lower back.',
  },
  {
    id: 'goblet-squat',
    name: 'KB Goblet Squat',
    sets: '3 sets',
    reps: '10–12 reps',
    rest: '90 sec rest',
    videoId: 'MxsFDhcyFyE',
    cues: [
      'Hold bell by the horns (handles) at chest height.',
      'Feet slightly wider than shoulder-width, toes turned out slightly.',
      'Squat deep — elbows inside knees at the bottom.',
      'Drive knees out, chest stays tall throughout.',
    ],
    note: 'One of the best exercises to own your squat pattern. Go as deep as your mobility allows.',
  },
  {
    id: 'one-arm-row',
    name: 'KB One-Arm Row',
    sets: '3 sets',
    reps: '8–10 reps each side',
    rest: '90 sec rest',
    videoId: 'Ib1GapYAHnI',
    cues: [
      'Place opposite hand on a bench or knee for support.',
      'Hinge forward at hips, back flat and parallel to floor.',
      'Pull bell to hip — not up to shoulder.',
      'Think: lead with your elbow, squeeze shoulder blade at the top.',
    ],
    note: 'Builds back strength that balances out pressing work and protects your shoulders.',
  },
  {
    id: 'suitcase-carry',
    name: 'KB Suitcase Carry',
    sets: '3 sets',
    reps: '30–40 steps each side',
    rest: '90 sec rest',
    videoId: 'SgeFBMBdPJc',
    cues: [
      'Hold one bell at your side like a suitcase.',
      'Stand tall — don\'t lean toward or away from the bell.',
      'Shoulders level, core braced, natural gait.',
      'Walk slowly and deliberately — this is harder than it looks.',
    ],
    note: 'Killer core and grip exercise. The goal is to look like you\'re carrying nothing.',
  },
]

const FINISHER = {
  name: 'Front Plank',
  duration: '3 × 20–30 seconds',
  videoId: 'pSHjTRCQxIw',
  cues: [
    'Forearms on floor, elbows under shoulders.',
    'Body in a straight line — don\'t let hips sag or pike up.',
    'Squeeze glutes and brace your abs like you\'re about to take a punch.',
    'Breathe steadily throughout.',
  ],
}

const PROGRESSION = [
  {
    phase: 'Weeks 1–2: Learn the Movements',
    weight: '8–12 kg (18–26 lb)',
    focus: 'Focus on form over speed. Rest as long as you need. Log every session.',
    goals: ['Master the hip hinge for deadlifts and swings', 'Build comfort holding and moving the bell', 'Complete all sets with good form'],
  },
  {
    phase: 'Weeks 3–4: Build Consistency',
    weight: '12–16 kg (26–35 lb)',
    focus: 'Reduce rest to 60–75 sec if feeling strong. Increase swing reps to 15.',
    goals: ['Increase swing reps to 15 per set', 'Reduce rest intervals', 'Add a second circuit day'],
  },
  {
    phase: 'Week 5+: Progress the Load',
    weight: '16–20 kg (35–44 lb)',
    focus: 'Increase weight when you can complete all sets with perfect form at full reps.',
    goals: ['Move to heavier bell', 'Try 4 sets of the full circuit', 'Explore adding a swing ladder (10-20-30)'],
  },
]

function VideoLink({ videoId, label = 'Watch tutorial ↗' }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 mt-2"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z"/>
      </svg>
      {label}
    </a>
  )
}

function ExerciseCard({ ex, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        className="w-full text-left px-4 py-4 flex items-center gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{ex.name}</p>
          <p className="text-xs text-gray-500">{ex.sets} · {ex.reps} · {ex.rest}</p>
        </div>
        <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <ul className="mt-3 space-y-1">
            {ex.cues.map((c, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-emerald-500 font-bold flex-shrink-0">•</span>
                {c}
              </li>
            ))}
          </ul>
          {ex.note && (
            <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              💡 {ex.note}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            <VideoLink videoId={ex.videoId} label={ex.id === 'deadlift-swing' ? 'Deadlift tutorial ↗' : 'Watch tutorial ↗'} />
            {ex.swingVideoId && <VideoLink videoId={ex.swingVideoId} label="Swing tutorial ↗" />}
          </div>
        </div>
      )}
    </div>
  )
}

export default function WorkoutsPage() {
  const [tab, setTab] = useState('workout')

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">🏋️ Kettlebell Fat Loss</h1>
        <p className="text-sm text-gray-500">3 days/week · ~35 minutes · All levels</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {[['workout', 'Workout'], ['progression', 'Progression']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'workout' && (
        <div className="space-y-5">
          {/* Warm-up */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Warm-Up · 5 min</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {WARMUP.map((w, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-800">{w.name}</p>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{w.reps}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{w.cue}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Main Circuit */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Circuit · 25 min</h2>
            <div className="space-y-2">
              {EXERCISES.map((ex, i) => <ExerciseCard key={ex.id} ex={ex} index={i} />)}
            </div>
          </section>

          {/* Finisher */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Finisher · 3 min</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-4">
              <div className="flex justify-between items-start">
                <p className="text-sm font-semibold text-gray-900">{FINISHER.name}</p>
                <span className="text-xs text-gray-400 ml-2">{FINISHER.duration}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {FINISHER.cues.map((c, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-emerald-500 font-bold flex-shrink-0">•</span>
                    {c}
                  </li>
                ))}
              </ul>
              <VideoLink videoId={FINISHER.videoId} />
            </div>
          </section>

          {/* Kidney note */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700">
            <strong>Kidney Health Note:</strong> Stay well hydrated throughout. Stop and rest if you feel dizzy or unusually fatigued. This routine avoids high-impact moves and focuses on controlled strength — safe for most kidney patients, but always check with your care team before starting.
          </div>
        </div>
      )}

      {tab === 'progression' && (
        <div className="space-y-4">
          {PROGRESSION.map((p, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-4">
              <p className="font-semibold text-gray-900 text-sm">{p.phase}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Recommended weight: {p.weight}</p>
              <p className="text-sm text-gray-600 mt-2">{p.focus}</p>
              <ul className="mt-3 space-y-1">
                {p.goals.map((g, j) => (
                  <li key={j} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="bg-amber-50 rounded-xl px-4 py-3 text-xs text-amber-700">
            <strong>General rule:</strong> Move up in weight only when you can complete all sets and reps with perfect form. There's no rush — consistency beats intensity every time.
          </div>
        </div>
      )}
    </div>
  )
}

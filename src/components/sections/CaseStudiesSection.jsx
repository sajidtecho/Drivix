import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import shardaImg from '../../assets/sharda_parking_solution_1776455072363.png'; // Using the generated image

const CASE_STUDIES = [
  {
    id: 'sharda',
    title: 'Solving student parking at Sharda University',
    shortDesc: 'Automating entry for 20,000+ students and staff.',
    image: shardaImg,
    fullStory: {
      problem: "With a massive influx of students and staff daily, the campus faced severe congestion at entry points. Traditional manual ticketing led to 15-minute wait times and unauthorized parking on internal roads.",
      solution: "Drivix implemented a high-speed ANPR (Automatic Number Plate Recognition) system integrated with the Multi-Level Parking (MLP) facility. We launched a dedicated mobile dashboard for students to book slots in advance.",
      results: [
        "40% reduction in peak-hour traffic congestion.",
        "Average entry time reduced from 12 mins to 15 seconds.",
        "100% digital tracking of all campus vehicles."
      ],
      stats: [
        { label: 'Wait Time', value: '-85%', icon: TrendingUp },
        { label: 'Authorized', value: '100%', icon: CheckCircle2 },
        { label: 'Daily Users', value: '2k+', icon: Users }
      ]
    }
  },
  {
    id: 'phoenix',
    title: 'Optimizing capacity at Phoenix Mall',
    shortDesc: 'Scaling weekend throughput by 30% through dynamic routing.',
    image: 'https://images.unsplash.com/photo-1573111804705-40f4258f9672?auto=format&fit=crop&q=80&w=800',
    fullStory: {
      problem: "Weekend surges caused 1km long queues outside the mall, discouraging shoppers and affecting surrounding city traffic.",
      solution: "We deployed dynamic digital signage and real-time floor-level guidance to distribute load across 4 parking levels.",
      results: [
        "30% increase in weekend parking turnaround.",
        "Eliminated street queues during festive seasons.",
        "Direct UPI-based exit reduced payment desk friction."
      ],
      stats: [
        { label: 'Turnaround', value: '+30%', icon: TrendingUp },
        { label: 'Exit Speed', value: '2x', icon: CheckCircle2 },
        { label: 'NPS', value: '4.8', icon: Users }
      ]
    }
  },
  {
    id: 'emaar',
    title: 'Premium security for Emaar Palm Drive',
    shortDesc: 'Transitioning to a keyless, automated residential experience.',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800',
    fullStory: {
      problem: "Managing guest vehicles and preventing unauthorized residential entry was a manual, error-prone task for security guards.",
      solution: "Biometric tag integration for residents and 'Invite-link' based pre-registration for guests.",
      results: [
        "Zero unauthorized entries reported since launch.",
        "Residents can track family car arrivals in real-time.",
        "Automated log maintenance for facility management."
      ],
      stats: [
        { label: 'Security', value: '100%', icon: CheckCircle2 },
        { label: 'Guests', value: 'Purely Digital', icon: Users },
        { label: 'Efficiency', value: 'Saved 2 Guards', icon: TrendingUp }
      ]
    }
  }
];

const CaseStudiesSection = () => {
  const [selected, setSelected] = useState(null);

  return (
    <section style={{ padding: '80px 0', background: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '40px', maxWidth: '600px' }}>
          Check out our <span className="text-gradient">impressive solutions</span> to some crucial parking problems
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {CASE_STUDIES.map((study) => (
            <motion.div
              key={study.id}
              whileHover={{ y: -10 }}
              onClick={() => setSelected(study)}
              className="glass-panel"
              style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
            >
              <div style={{ height: '320px', overflow: 'hidden', position: 'relative' }}>
                <img src={study.image} alt={study.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
              </div>
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.3 }}>{study.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{study.shortDesc}</p>
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.85rem' }}>
                   VIEW CASE STUDY →
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selected && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelected(null)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }} 
              />
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                className="glass-panel"
                style={{
                  width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
                  background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)',
                  position: 'relative', zIndex: 1001, padding: '0'
                }}
              >
                <button 
                  onClick={() => setSelected(null)}
                  style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', cursor: 'pointer', zIndex: 2 }}
                >
                  <X size={24} />
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                  <div style={{ height: '100%', minHeight: '350px' }}>
                    <img src={selected.image} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '48px 40px' }}>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '12px' }}>Case Study Solution</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '32px' }}>{selected.title}</h2>
                    
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ color: '#ff4b4b', fontWeight: 800, marginBottom: '8px' }}>The Problem</h4>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.fullStory.problem}</p>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ color: '#00cc6a', fontWeight: 800, marginBottom: '8px' }}>Our Solution</h4>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.fullStory.solution}</p>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                      <h4 style={{ color: 'var(--accent-primary)', fontWeight: 800, marginBottom: '12px' }}>Key Results</h4>
                      <ul style={{ paddingLeft: '20px' }}>
                        {selected.fullStory.results.map((res, i) => (
                          <li key={i} style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>{res}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '32px' }}>
                      {selected.fullStory.stats.map((stat, i) => (
                        <div key={i} style={{ flex: 1 }}>
                          <stat.icon size={18} color="var(--accent-primary)" style={{ marginBottom: '8px' }} />
                          <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{stat.value}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default CaseStudiesSection;

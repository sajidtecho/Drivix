import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CreditCard, RefreshCw, FileCheck, ShieldAlert, CarFront } from 'lucide-react';
import { db } from "../firebase";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const VehicleServices = () => {
  const services = [
    { title: 'Challan Management', icon: ShieldAlert, desc: 'View and pay pending traffic fines securely.', color: '#ff4b4b' },
    { title: 'FASTag Recharge', icon: CreditCard, desc: 'Instant FASTag balance top-up.', color: 'var(--accent-primary)' },
    { title: 'Document Manager', icon: FileText, desc: 'Digital vault for RC, DL, and Insurance.', color: 'var(--accent-secondary)' },
    { title: 'Registration Renewal', icon: RefreshCw, desc: 'Renew your vehicle registration easily.', color: '#bc00ff' },
    { title: 'Pollution Certificate', icon: FileCheck, desc: 'Apply or renew PUCC online.', color: '#00ffcc' },
    { title: 'Ownership Transfer', icon: CarFront, desc: 'Seamlessly transfer vehicle ownership.', color: '#ffc107' },
  ];

  return (
    <div style={{ paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh', background: 'var(--bg-primary)', padding: '100px 5% 60px', maxWidth: '1200px', margin: '0 auto' }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '16px' }}>
            All-in-One <span className="text-gradient">Vehicle Services</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Manage your FASTag, challans, documentation, and renewals all under one smart roof.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
              className="glass-panel"
              style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', background: service.color, width: '100px', height: '100px', borderRadius: '50%', filter: 'blur(50px)', opacity: 0.15 }}></div>

              <div style={{ marginBottom: '24px', background: 'var(--bg-tertiary)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}>
                <service.icon color={service.color} size={32} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '12px' }}>{service.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', flex: 1 }}>{service.desc}</p>
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
                Access Service <span style={{ transition: 'transform var(--transition-fast)' }}>→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default VehicleServices;

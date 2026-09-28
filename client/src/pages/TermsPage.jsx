import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileTextIcon } from '../components/Icons';

export default function TermsPage() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'Terms & Conditions | IkiGai';
  }, []);

  return (
    <div className="page-card legal-page">
      <div className="page-head" style={{ marginBottom: '24px' }}>
        <div>
          <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileTextIcon size={14} /> Agreement
          </p>
          <h1>Terms & Conditions</h1>
          <p className="muted">Last updated: September 28, 2026</p>
        </div>
        <Link to={isAuthenticated ? '/' : '/login'} className="btn">
          {isAuthenticated ? 'Back to Dashboard' : 'Back to Sign In'}
        </Link>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using IkiGai (&quot;the Service&quot;), you agree to be bound by these Terms &amp; Conditions.
            If you do not agree to all terms, you may not access or use the Service.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Account Responsibilities</h2>
          <p>
            You are responsible for safeguarding your login credentials and maintaining the confidentiality of your account.
            You agree to notify us immediately of any unauthorized access or breach of security.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Permitted Use</h2>
          <p>
            IkiGai is provided for personal productivity and habit tracking. You agree not to misuse the Service,
            attempt unauthorized access to underlying infrastructure, inject malicious code, or use automated systems
            to disrupt application performance.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Accuracy of Estimates & Guidance</h2>
          <p>
            Nutritional values, calorie computations, and spending aggregations generated or displayed by the Service are
            approximate informational references. They do not constitute formal medical, dietary, or financial advice.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Service Availability & Modifications</h2>
          <p>
            We strive for maximum reliability and uptime. However, we reserve the right to perform routine maintenance,
            update features, or adjust system requirements as necessary to preserve system security and functionality.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, IkiGai and its developers shall not be liable for any indirect,
            incidental, consequential, or punitive damages arising from the use or inability to use the Service.
          </p>
        </section>
      </div>
    </div>
  );
}

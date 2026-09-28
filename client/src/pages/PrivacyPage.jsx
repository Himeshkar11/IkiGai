import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheckIcon } from '../components/Icons';

export default function PrivacyPage() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'Privacy Policy | IkiGai';
  }, []);

  return (
    <div className="page-card legal-page">
      <div className="page-head" style={{ marginBottom: '24px' }}>
        <div>
          <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheckIcon size={14} /> Legal & Compliance
          </p>
          <h1>Privacy Policy</h1>
          <p className="muted">Last updated: September 28, 2026</p>
        </div>
        <Link to={isAuthenticated ? '/' : '/login'} className="btn">
          {isAuthenticated ? 'Back to Dashboard' : 'Back to Sign In'}
        </Link>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Overview</h2>
          <p>
            IkiGai (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;) is a personal productivity, nutrition,
            living space, and expense tracking platform. We believe personal productivity data is deeply private,
            and we are committed to transparent and responsible data handling.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <p>We collect only information essential to providing the features of the Service:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, and hashed authentication credentials provided upon registration.</li>
            <li><strong>Productivity Records:</strong> Tasks, completion statuses, priorities, and historical task records.</li>
            <li><strong>Nutritional Entries:</strong> Food item descriptions, portion sizes, and estimated macronutrient values.</li>
            <li><strong>Living Space Records:</strong> Daily check-in logs (water, tidiness, laundry) and recurring maintenance chores.</li>
            <li><strong>Financial Entries:</strong> User-inputted expense descriptions, amounts, and dates for personal budgeting.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Information</h2>
          <p>We use your data solely for the following purposes:</p>
          <ul>
            <li>To authenticate your identity and deliver personal dashboard metrics.</li>
            <li>To calculate daily activity streaks, completion percentages, and monthly aggregates.</li>
            <li>To process food descriptions through nutrition analysis APIs when requested by you.</li>
            <li>To maintain application reliability, prevent abuse, and deliver customer support.</li>
          </ul>
          <p>We do not sell, rent, or monetize your personal data to data brokers or third-party advertisers.</p>
        </section>

        <section className="legal-section">
          <h2>4. Data Storage & Security</h2>
          <p>
            Your information is transmitted using TLS/HTTPS encryption and stored in protected database environments.
            Passwords are cryptographically hashed using industry-standard salt and hash algorithms (bcrypt) prior to storage.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Your Rights and Data Export</h2>
          <p>
            You retain ownership of all data entered into IkiGai. You may edit or delete your tasks, logs, and transactions
            at any time through the respective interfaces. To request full account and data deletion, please contact your
            system administrator or reach out via your account settings.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Updates to This Policy</h2>
          <p>
            We may periodically update this Privacy Policy to reflect enhancements or changes in regulatory obligations.
            Continued use of the platform after updates constitutes acceptance of the revised terms.
          </p>
        </section>
      </div>
    </div>
  );
}

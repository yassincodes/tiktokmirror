import React, { useState } from 'react';

const App = () => {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const styles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #0a0a0a;
      color: #f5f5f5;
      overflow-x: hidden;
    }

    .landing-page {
      min-height: 100vh;
      position: relative;
      overflow: hidden;
    }

    .bg-animation {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }

    .bg-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.05;
    }

    .bg-blob-1 {
      width: 400px;
      height: 400px;
      top: 80px;
      right: 80px;
      background: #ff2d55;
      animation: float 8s ease-in-out infinite;
    }

    .bg-blob-2 {
      width: 350px;
      height: 350px;
      bottom: 160px;
      left: 40px;
      background: #ff2d55;
      animation: float 10s ease-in-out infinite;
      animation-delay: 2s;
    }

    .bg-blob-3 {
      width: 380px;
      height: 380px;
      top: 50%;
      left: 33%;
      background: #404040;
      animation: float 12s ease-in-out infinite;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(30px); }
    }

    .navbar {
      position: sticky;
      top: 0;
      z-index: 50;
      border-bottom: 1px solid #2a2a2a;
      background: rgba(10, 10, 10, 0.8);
      backdrop-filter: blur(10px);
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #f5f5f5;
      font-size: 1.25rem;
      font-weight: bold;
      transition: transform 0.3s ease;
    }

    .nav-logo:hover {
      transform: scale(1.05);
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: #ff2d55;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .nav-links {
      display: flex;
      gap: 2rem;
      list-style: none;
    }

    .nav-links a {
      text-decoration: none;
      color: #f5f5f5;
      font-size: 0.875rem;
      transition: color 0.3s ease;
    }

    .nav-links a:hover {
      color: #ff2d55;
    }

    .cta-button {
      background: #ff2d55;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s ease;
      font-size: 0.875rem;
    }

    .cta-button:hover {
      background: #ff1744;
    }

    .hero {
      position: relative;
      z-index: 10;
      max-width: 1200px;
      margin: 0 auto;
      padding: 5rem 1.5rem;
      text-align: center;
    }

    .hero-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }

    .hero-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: rgba(255, 45, 85, 0.1);
      border: 1px solid rgba(255, 45, 85, 0.2);
      border-radius: 9999px;
      font-size: 0.875rem;
      color: #ff2d55;
      font-weight: 500;
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: bold;
      line-height: 1.2;
      max-width: 800px;
    }

    .accent-text {
      color: #ff2d55;
    }

    .hero-subtitle {
      font-size: 1.125rem;
      color: #a0a0a0;
      max-width: 600px;
      line-height: 1.6;
    }

    .hero-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .secondary-button {
      background: transparent;
      color: #f5f5f5;
      border: 1px solid #2a2a2a;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .secondary-button:hover {
      background: rgba(42, 42, 42, 0.5);
      border-color: #ff2d55;
    }

    .hero-footer {
      font-size: 0.875rem;
      color: #a0a0a0;
    }

    .stats-section {
      position: relative;
      z-index: 10;
      max-width: 1200px;
      margin: 0 auto;
      padding: 4rem 1.5rem;
    }

    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      border-color: rgba(255, 45, 85, 0.5);
    }

    .stat-value {
      font-size: 1.875rem;
      font-weight: bold;
      color: #ff2d55;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #a0a0a0;
      margin-top: 0.5rem;
    }

    .features-section {
      position: relative;
      z-index: 10;
      max-width: 1200px;
      margin: 0 auto;
      padding: 6rem 1.5rem;
    }

    .section-container {
      display: flex;
      flex-direction: column;
    }

    .section-header {
      text-align: center;
      margin-bottom: 4rem;
    }

    .section-header h2 {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .section-header p {
      font-size: 1.125rem;
      color: #a0a0a0;
      max-width: 600px;
      margin: 0 auto;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .feature-card {
      position: relative;
      padding: 2rem;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 16px;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .feature-card:hover {
      border-color: rgba(255, 45, 85, 0.5);
      background: rgba(255, 45, 85, 0.02);
    }

    .feature-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 45, 85, 0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ff2d55;
      margin-bottom: 1rem;
      transition: all 0.3s ease;
      font-size: 1.5rem;
    }

    .feature-card:hover .feature-icon {
      background: rgba(255, 45, 85, 0.3);
    }

    .feature-card h3 {
      font-size: 1.25rem;
      font-weight: bold;
      margin-bottom: 0.75rem;
    }

    .feature-card p {
      color: #a0a0a0;
      line-height: 1.6;
    }

    .how-it-works-section {
      position: relative;
      z-index: 10;
      max-width: 1200px;
      margin: 0 auto;
      padding: 6rem 1.5rem;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .step-card {
      position: relative;
    }

    .step-number {
      font-size: 3.5rem;
      font-weight: bold;
      color: rgba(255, 45, 85, 0.2);
      margin-bottom: 1rem;
    }

    .step-card h3 {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.75rem;
    }

    .step-card p {
      color: #a0a0a0;
      line-height: 1.6;
    }

    .cta-section {
      position: relative;
      z-index: 10;
      max-width: 1200px;
      margin: 0 auto;
      padding: 6rem 1.5rem;
    }

    .cta-container {
      background: linear-gradient(135deg, rgba(255, 45, 85, 0.2), rgba(255, 45, 85, 0.05));
      border: 1px solid rgba(255, 45, 85, 0.2);
      border-radius: 24px;
      padding: 4rem 2rem;
      text-align: center;
    }

    .cta-container h2 {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .cta-container p {
      font-size: 1.125rem;
      color: #a0a0a0;
      max-width: 600px;
      margin: 0 auto 2rem;
    }

    .footer {
      position: relative;
      z-index: 10;
      border-top: 1px solid #2a2a2a;
      background: rgba(10, 10, 10, 0.5);
      backdrop-filter: blur(10px);
      margin-top: 6rem;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .footer-column h4 {
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .footer-column ul {
      list-style: none;
    }

    .footer-column li {
      margin-bottom: 0.5rem;
    }

    .footer-column a {
      color: #a0a0a0;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.3s ease;
    }

    .footer-column a:hover {
      color: #ff2d55;
    }

    .footer-bottom {
      border-top: 1px solid #2a2a2a;
      padding-top: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.875rem;
      color: #a0a0a0;
    }

    .footer-links {
      display: flex;
      gap: 2rem;
    }

    .footer-links a {
      color: #a0a0a0;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .footer-links a:hover {
      color: #ff2d55;
    }

    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }

      .hero-title {
        font-size: 2.5rem;
      }

      .section-header h2 {
        font-size: 2rem;
      }

      .hero-buttons {
        flex-direction: column;
      }

      .cta-button, .secondary-button {
        width: 100%;
      }

      .footer-bottom {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="landing-page">
        {/* Animated background elements */}
        <div className="bg-animation">
          <div className="bg-blob bg-blob-1"></div>
          <div className="bg-blob bg-blob-2"></div>
          <div className="bg-blob bg-blob-3"></div>
        </div>

        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-container">
            <a href="/" className="nav-logo">
              <div className="logo-icon">✨</div>
              <span>TikTokMirror</span>
            </a>

            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#pricing">Pricing</a>
              <a href="https://github.com">GitHub</a>
            </div>

            <button className="cta-button">Get Started</button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-container">
            <div className="hero-badge">
              ✨ Organize your TikTok videos beautifully
            </div>

            <h1 className="hero-title">
              Your TikTok data,<br />
              <span className="accent-text">beautifully</span> organized.
            </h1>

            <p className="hero-subtitle">
              Upload your full data export or paste video links. Everything stays in your browser—no servers, no tracking. Just pure simplicity.
            </p>

            <div className="hero-buttons">
              <button className="cta-button">Start organizing →</button>
              <button className="secondary-button">
                ★ View on GitHub
              </button>
            </div>

            <p className="hero-footer">Free • Open source • Privacy-first</p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stats-container">
            {[
              { label: 'Active Users', value: '10K+' },
              { label: 'Videos Organized', value: '100M+' },
              { label: 'Zero Downtime', value: '99.9%' },
              { label: 'Data Private', value: '100%' }
            ].map((stat, i) => (
              <div key={i} className="stat-card">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="section-container">
            <div className="section-header">
              <h2>Why TikTokMirror?</h2>
              <p>Everything you need to manage and explore your TikTok collection.</p>
            </div>

            <div className="features-grid">
              {[
                {
                  icon: '✨',
                  title: 'Beautiful Interface',
                  description: 'Clean, minimal design that makes browsing your videos a joy. Fast, responsive, and built with care.'
                },
                {
                  icon: '⚡',
                  title: 'Lightning Fast',
                  description: 'Instant search and filtering across thousands of videos. No lag, no wait times, pure performance.'
                },
                {
                  icon: '🔒',
                  title: 'Privacy First',
                  description: 'All processing happens in your browser. Your data never leaves your device. Zero tracking.'
                }
              ].map((feature, i) => (
                <div
                  key={i}
                  className="feature-card"
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className="feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="how-it-works-section">
          <div className="section-container">
            <div className="section-header">
              <h2>How It Works</h2>
              <p>Get started in three simple steps.</p>
            </div>

            <div className="steps-grid">
              {[
                {
                  step: '01',
                  title: 'Export Your Data',
                  description: 'Go to TikTok Settings → Privacy → Download your data. Request it as JSON format.'
                },
                {
                  step: '02',
                  title: 'Upload or Paste',
                  description: 'Upload the JSON file directly or paste video links. Everything stays on your device.'
                },
                {
                  step: '03',
                  title: 'Explore & Organize',
                  description: 'Search, filter, and browse your videos. Find exactly what you\'re looking for instantly.'
                }
              ].map((item, i) => (
                <div key={i} className="step-card">
                  <div className="step-number">{item.step}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <h2>Ready to organize your TikTok?</h2>
            <p>Join thousands of users who've already taken control of their TikTok library.</p>
            <button className="cta-button">Start Free Today →</button>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-grid">
              <div className="footer-column">
                <h4>Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#faq">FAQ</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Community</h4>
                <ul>
                  <li><a href="https://github.com">GitHub</a></li>
                  <li><a href="https://twitter.com">Twitter</a></li>
                  <li><a href="https://discord.com">Discord</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li><a href="#about">About</a></li>
                  <li><a href="#blog">Blog</a></li>
                  <li><a href="#contact">Contact</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <ul>
                  <li><a href="#privacy">Privacy</a></li>
                  <li><a href="#terms">Terms</a></li>
                  <li><a href="#license">License</a></li>
                </ul>
              </div>
            </div>

            <div className="footer-bottom">
              <p>&copy; 2026 TikTokMirror. All rights reserved.</p>
              <div className="footer-links">
                <a href="#privacy">Privacy Policy</a>
                <a href="#terms">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default App;
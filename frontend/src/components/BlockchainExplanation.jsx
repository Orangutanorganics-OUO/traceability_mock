import React, { useState } from 'react';
import './BlockchainExplanation.css';

function BlockchainExplanation({ verification, batchHash, onChainHash }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="blockchain-explanation">
      <div className="explanation-header">
        <h3>🔐 How We Verify Authenticity Using Blockchain</h3>
        <button
          className="toggle-details-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="explanation-summary">
        <p>
          We use <strong>blockchain technology</strong> to guarantee that the information you see hasn't been tampered with.
          Think of it as a <strong>permanent, public receipt</strong> that cannot be altered by anyone - not even us!
        </p>
      </div>

      {showDetails && (
        <div className="explanation-details">
          <div className="step-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>When We Create This Batch</h4>
                <p>We collect all the information: farmer details, harvest dates, certifications, etc.</p>
              </div>
            </div>

            <div className="arrow-down">↓</div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>We Create a Digital Fingerprint</h4>
                <p>
                  All this data is converted into a unique "hash" (digital fingerprint) using SHA-256 encryption.
                  This hash is like a seal - if anything changes in the data, the hash becomes completely different.
                </p>
                <div className="hash-display-small">
                  <strong>Our Data Hash:</strong>
                  <code>{batchHash?.substring(0, 20)}...</code>
                </div>
              </div>
            </div>

            <div className="arrow-down">↓</div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>We Store the Hash on Blockchain</h4>
                <p>
                  This hash is permanently recorded on the <strong>Polygon blockchain</strong> - a public,
                  decentralized ledger that no single person or company controls.
                </p>
                <ul>
                  <li>✅ Cannot be deleted</li>
                  <li>✅ Cannot be modified</li>
                  <li>✅ Publicly verifiable</li>
                  <li>✅ Timestamped permanently</li>
                </ul>
              </div>
            </div>

            <div className="arrow-down">↓</div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>When You Scan the QR Code</h4>
                <p>Here's what happens automatically behind the scenes:</p>
                <ol>
                  <li>We fetch the batch data from our database</li>
                  <li>We fetch the original hash from the blockchain</li>
                  <li>We recompute the hash from the current data</li>
                  <li>We compare both hashes</li>
                </ol>
              </div>
            </div>

            <div className="arrow-down">↓</div>

            <div className="step verification-step">
              <div className="step-number">✓</div>
              <div className="step-content">
                <h4>Verification Result</h4>
                {verification?.status === 'AUTHENTIC' ? (
                  <div className="authentic-result">
                    <p className="result-text">✓ AUTHENTIC - Data Verified!</p>
                    <p className="result-explanation">
                      The hash stored on the blockchain <strong>exactly matches</strong> the hash
                      computed from the current data. This proves that:
                    </p>
                    <ul>
                      <li>✅ No information has been changed</li>
                      <li>✅ The data is exactly as it was when registered</li>
                      <li>✅ This product is genuine</li>
                    </ul>
                    {onChainHash && batchHash && (
                      <div className="hash-comparison">
                        <div className="hash-item">
                          <strong>Blockchain Hash:</strong>
                          <code>{onChainHash}</code>
                        </div>
                        <div className="equals">=</div>
                        <div className="hash-item">
                          <strong>Current Data Hash:</strong>
                          <code>{batchHash}</code>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="tampered-result">
                    <p className="result-text">⚠ WARNING - Data Mismatch!</p>
                    <p className="result-explanation">
                      The hashes don't match, which means the data may have been altered
                      after blockchain registration.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="why-trust">
            <h4>Why Can You Trust This?</h4>
            <div className="trust-points">
              <div className="trust-point">
                <span className="icon">🔒</span>
                <div>
                  <h5>We Can't Cheat</h5>
                  <p>Even we cannot modify data on the blockchain. It's mathematically impossible.</p>
                </div>
              </div>
              <div className="trust-point">
                <span className="icon">🌐</span>
                <div>
                  <h5>Publicly Verifiable</h5>
                  <p>Anyone can check the blockchain record independently. It's not controlled by us.</p>
                </div>
              </div>
              <div className="trust-point">
                <span className="icon">⏰</span>
                <div>
                  <h5>Timestamped Forever</h5>
                  <p>The blockchain permanently records when this data was registered.</p>
                </div>
              </div>
              <div className="trust-point">
                <span className="icon">🔍</span>
                <div>
                  <h5>Mathematical Proof</h5>
                  <p>This isn't based on trust - it's based on cryptographic mathematics.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="learn-more">
            <h4>Want to Learn More?</h4>
            <p>
              Blockchain technology creates trust through transparency and mathematics, not through
              centralized authority. This is why it's perfect for verifying organic product authenticity.
            </p>
            <a
              href="https://polygon.technology/"
              target="_blank"
              rel="noopener noreferrer"
              className="learn-link"
            >
              Learn about Polygon Blockchain →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlockchainExplanation;

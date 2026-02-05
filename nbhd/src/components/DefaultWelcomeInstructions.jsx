import React from 'react';
import styles from './DefaultWelcomeInstructions.module.css';

/**
 * DefaultWelcomeInstructions - Shown when a neighborhood has no custom welcome content
 * Provides helpful instructions for getting started
 */
export default function DefaultWelcomeInstructions() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Welcome to the Neighborhood!</h1>
        <p className={styles.subtitle}>
          This neighborhood hasn't set up a welcome page yet.
        </p>

        <div className={styles.instructionsBox}>
          <h2>Getting Started</h2>
          <ol>
            <li>Join this neighborhood to become a member</li>
            <li>Admins can customize this welcome page with content</li>
            <li>Check back soon for updates and announcements</li>
          </ol>
        </div>

        <div className={styles.infoSection}>
          <h3>What is a Neighborhood?</h3>
          <p>
            Neighborhoods on nbhd.city are collaborative communities where
            members can create and share content together.
          </p>
        </div>

        <div className={styles.features}>
          <h3>Features Coming Soon</h3>
          <ul>
            <li>Customizable welcome pages</li>
            <li>Community announcements</li>
            <li>Shared project sites</li>
            <li>Member collaboration tools</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

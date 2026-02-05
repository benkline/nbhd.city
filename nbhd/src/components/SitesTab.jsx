import React from 'react';
import { SiteManagementDashboard } from './SiteBuilder/SiteManagementDashboard';
import styles from './SitesTab.module.css';

export function SitesTab({ nbhdId }) {
  return (
    <div className={styles.container}>
      <p className={styles.description}>
        Manage project sites for this neighborhood. These sites are associated with
        your neighborhood and can be managed by neighborhood members.
      </p>
      <SiteManagementDashboard
        site_type="project"
        nbhd_id={nbhdId}
      />
    </div>
  );
}

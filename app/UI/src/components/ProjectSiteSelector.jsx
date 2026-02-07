import React from 'react';
import { useMyNbhds } from '../hooks/useMyNeighborhoods';
import styles from './ProjectSiteSelector.module.css';

export function ProjectSiteSelector({ selectedNbhdId, onNbhdChange }) {
  const { nbhds, loading } = useMyNbhds();

  return (
    <div className={styles.filterContainer}>
      <label htmlFor="nbhd-filter" className={styles.label}>
        Filter by Neighborhood:
      </label>
      <select
        id="nbhd-filter"
        value={selectedNbhdId}
        onChange={(e) => onNbhdChange(e.target.value)}
        className={styles.select}
        disabled={loading}
      >
        <option value="all">All Neighborhoods</option>
        {nbhds.map(nbhd => (
          <option key={nbhd.id} value={nbhd.id}>
            {nbhd.name}
          </option>
        ))}
      </select>
    </div>
  );
}

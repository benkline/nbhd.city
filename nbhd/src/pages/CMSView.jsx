import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { nbhdContentService } from '../services/nbhdContentService';
import RecordFilterBar from '../components/RecordFilterBar';
import ContentRecordsList from '../components/ContentRecordsList';
import ATProtocolInspector from '../components/ATProtocolInspector';
import styles from './CMSView.module.css';

export default function CMSView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cmsData, setCmsData] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    dateFrom: null,
    dateTo: null,
    sort: 'newest'
  });

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch CMS data
  useEffect(() => {
    const fetchCMSData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await nbhdContentService.getCMSView(id);
        const data = response.data;
        setCmsData(data);

        // Build records array from CMS data
        const records = [];

        if (data.welcome_content) {
          records.push({
            ...data.welcome_content,
            type: 'app.nbhd.welcome'
          });
        }

        if (data.announcements && Array.isArray(data.announcements)) {
          records.push(
            ...data.announcements.map(a => ({
              ...a,
              type: 'app.nbhd.announcement'
            }))
          );
        }

        setAllRecords(records);
        applyFilters(records, filters);
      } catch (err) {
        const message = err.response?.data?.detail ||
                       err.message ||
                       'Failed to load CMS view';
        setError(message);
        console.error('Error fetching CMS data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && user) {
      fetchCMSData();
    }
  }, [id, user, isAuthenticated, authLoading]);

  // Apply filters to records
  const applyFilters = (records, currentFilters) => {
    let filtered = [...records];

    // Type filter
    if (currentFilters.type && currentFilters.type !== 'all') {
      filtered = filtered.filter(r => {
        if (currentFilters.type === 'welcome') {
          return r.type === 'app.nbhd.welcome';
        } else if (currentFilters.type === 'announcement') {
          return r.type === 'app.nbhd.announcement';
        }
        return true;
      });
    }

    // Search filter
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(r => {
        const title = r.value?.title || '';
        const content = r.value?.content || '';
        return title.toLowerCase().includes(searchLower) ||
               content.toLowerCase().includes(searchLower);
      });
    }

    // Date range filter
    if (currentFilters.dateFrom) {
      const fromDate = new Date(currentFilters.dateFrom);
      filtered = filtered.filter(r => {
        const recordDate = new Date(r.created_at);
        return recordDate >= fromDate;
      });
    }

    if (currentFilters.dateTo) {
      const toDate = new Date(currentFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => {
        const recordDate = new Date(r.created_at);
        return recordDate <= toDate;
      });
    }

    // Sort
    if (currentFilters.sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setFilteredRecords(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    applyFilters(allRecords, newFilters);
  };

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading CMS view...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  if (!cmsData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>CMS data not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>CMS View</h1>
        <p className={styles.subtitle}>
          All AT Protocol records for {cmsData.nbhd_name}
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.filterSection}>
          <RecordFilterBar onFilterChange={handleFilterChange} />
        </div>

        <div className={styles.mainSection}>
          <ContentRecordsList
            records={filteredRecords}
            onInspect={setSelectedRecord}
          />
        </div>

        {selectedRecord && (
          <div className={styles.inspectorSection}>
            <ATProtocolInspector
              record={selectedRecord}
              isOpen={true}
              onClose={() => setSelectedRecord(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

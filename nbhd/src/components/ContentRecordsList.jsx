import React, { useState, useMemo } from 'react';
import styles from './ContentRecordsList.module.css';

export default function ContentRecordsList({ records = [], onInspect = null, pageSize = 10 }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  const paginatedRecords = useMemo(() => {
    const startIdx = currentPage * pageSize;
    return records.slice(startIdx, startIdx + pageSize);
  }, [records, currentPage, pageSize]);

  const totalPages = Math.ceil(records.length / pageSize);

  const getRecordTypeLabel = (type) => {
    if (type === 'app.nbhd.welcome') return 'Welcome';
    if (type === 'app.nbhd.announcement') return 'Announcement';
    return type;
  };

  const getContentPreview = (record, length = 100) => {
    const content = record.value?.content || record.value?.title || '';
    if (content.length > length) {
      return content.substring(0, length) + '...';
    }
    return content;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleRowClick = (record) => {
    setExpandedRecordId(expandedRecordId === record.rkey ? null : record.rkey);
    if (onInspect) {
      onInspect(record);
    }
  };

  if (records.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No records found</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Title / Content</th>
            <th>Type</th>
            <th>Created</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRecords.map((record) => (
            <React.Fragment key={record.rkey}>
              <tr
                className={styles.recordRow}
                onClick={() => handleRowClick(record)}
              >
                <td className={styles.titleCell}>
                  <span className={styles.recordTitle}>
                    {record.value?.title || record.type}
                  </span>
                  <span className={styles.preview}>
                    {getContentPreview(record, 60)}
                  </span>
                </td>
                <td>
                  <span className={styles.typeBadge}>
                    {getRecordTypeLabel(record.type)}
                  </span>
                </td>
                <td className={styles.dateCell}>
                  {formatDate(record.created_at)}
                </td>
                <td className={styles.dateCell}>
                  {formatDate(record.updated_at || record.created_at)}
                </td>
                <td className={styles.actionsCell}>
                  <button
                    className={styles.detailsButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(record);
                    }}
                    title="View details"
                  >
                    Details
                  </button>
                </td>
              </tr>

              {expandedRecordId === record.rkey && (
                <tr className={styles.expandedRow}>
                  <td colSpan="5">
                    <div className={styles.detailsPanel}>
                      <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                          <label>URI:</label>
                          <code className={styles.code}>{record.uri}</code>
                        </div>
                        <div className={styles.detailItem}>
                          <label>CID:</label>
                          <code className={styles.code}>{record.cid}</code>
                        </div>
                        <div className={styles.detailItem}>
                          <label>Record Key:</label>
                          <code className={styles.code}>{record.rkey}</code>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            aria-label="Previous page"
          >
            ‹ Previous
          </button>

          <span className={styles.pageInfo}>
            Page {currentPage + 1} of {totalPages}
          </span>

          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            aria-label="Next page"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}

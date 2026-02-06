import React, { useState } from 'react';
import styles from './ATProtocolInspector.module.css';

export default function ATProtocolInspector({
  record,
  isOpen = true,
  isModal = false,
  onClose = null
}) {
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !record) {
    return null;
  }

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const extractDIDFromURI = (uri) => {
    const match = uri.match(/(did:plc:[a-z0-9]+)/);
    return match ? match[1] : 'Unknown';
  };

  const extractCollectionFromURI = (uri) => {
    const match = uri.match(/\/([a-z.]+)\//);
    return match ? match[1] : 'Unknown';
  };

  const CopyButton = ({ text, field, label }) => (
    <button
      className={`${styles.copyButton} ${copiedField === field ? styles.copied : ''}`}
      onClick={() => copyToClipboard(text, field)}
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copiedField === field ? '✓ Copied' : 'Copy'}
    </button>
  );

  const content = (
    <div className={styles.inspector}>
      <div className={styles.header}>
        <h3>AT Protocol Record Details</h3>
        {isModal && onClose && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.content}>
        {/* Identity Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Identity</h4>

          <div className={styles.field}>
            <label>DID (Decentralized Identifier)</label>
            <div className={styles.fieldValue}>
              <code>{extractDIDFromURI(record.uri)}</code>
              <CopyButton
                text={extractDIDFromURI(record.uri)}
                field="did"
                label="DID"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Collection</label>
            <div className={styles.fieldValue}>
              <code>{extractCollectionFromURI(record.uri)}</code>
              <CopyButton
                text={extractCollectionFromURI(record.uri)}
                field="collection"
                label="Collection"
              />
            </div>
          </div>
        </div>

        {/* Content & Location Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Content & Location</h4>

          <div className={styles.field}>
            <label>Record URI (at://)</label>
            <div className={styles.fieldValue}>
              <code className={styles.longCode}>{record.uri}</code>
              <CopyButton
                text={record.uri}
                field="uri"
                label="URI"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Content Identifier (CID)</label>
            <div className={styles.fieldValue}>
              <code>{record.cid}</code>
              <CopyButton
                text={record.cid}
                field="cid"
                label="CID"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Record Key (rkey)</label>
            <div className={styles.fieldValue}>
              <code>{record.rkey}</code>
              <CopyButton
                text={record.rkey}
                field="rkey"
                label="rkey"
              />
            </div>
          </div>
        </div>

        {/* Metadata Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Metadata</h4>

          <div className={styles.field}>
            <label>Record Type</label>
            <div className={styles.fieldValue}>
              <code>{record.type || record.value?.$type || 'Unknown'}</code>
              <CopyButton
                text={record.type || record.value?.$type || 'Unknown'}
                field="type"
                label="Type"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Created At</label>
            <div className={styles.fieldValue}>
              <span>{formatDate(record.created_at)}</span>
              <code className={styles.iso}>{record.created_at || 'N/A'}</code>
            </div>
          </div>

          <div className={styles.field}>
            <label>Updated At</label>
            <div className={styles.fieldValue}>
              <span>{formatDate(record.updated_at || record.created_at)}</span>
              <code className={styles.iso}>{record.updated_at || record.created_at || 'N/A'}</code>
            </div>
          </div>
        </div>

        {/* Record Content Preview */}
        {record.value && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Record Value</h4>
            <div className={styles.valuePreview}>
              <pre>{JSON.stringify(record.value, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className={styles.modal} role="dialog">
        <div className={styles.modalBackdrop} onClick={onClose} />
        <div className={styles.modalContent}>
          {content}
        </div>
      </div>
    );
  }

  return <div className={styles.panel}>{content}</div>;
}

/**
 * Markdown Editor Toolbar Component
 *
 * Provides formatting buttons for common markdown operations:
 * - Bold (Cmd+B)
 * - Italic (Cmd+I)
 * - Code (Cmd+`)
 * - Link (Cmd+K)
 * - List
 * - Quote
 */

import React from 'react';
import styles from './EnhancedContentEditor.module.css';

export function MarkdownEditorToolbar({ onAction }) {
  const buttons = [
    {
      id: 'bold',
      label: 'Bold',
      shortcut: 'Cmd+B',
      icon: 'B',
      title: 'Bold (Cmd+B)'
    },
    {
      id: 'italic',
      label: 'Italic',
      shortcut: 'Cmd+I',
      icon: 'I',
      title: 'Italic (Cmd+I)'
    },
    {
      id: 'code',
      label: 'Code',
      shortcut: 'Cmd+`',
      icon: '<>',
      title: 'Inline code (Cmd+`)'
    },
    {
      id: 'link',
      label: 'Link',
      shortcut: 'Cmd+K',
      icon: '🔗',
      title: 'Link (Cmd+K)'
    },
    {
      id: 'list',
      label: 'List',
      shortcut: null,
      icon: '•',
      title: 'Bulleted list'
    },
    {
      id: 'quote',
      label: 'Quote',
      shortcut: null,
      icon: '"',
      title: 'Block quote'
    }
  ];

  return (
    <div className={styles.toolbar}>
      {buttons.map((button) => (
        <button
          key={button.id}
          className={styles.toolbarButton}
          onClick={() => onAction(button.id)}
          title={button.title}
          aria-label={button.label}
        >
          <span className={styles.buttonIcon}>{button.icon}</span>
          {button.shortcut && (
            <span className={styles.buttonShortcut}>{button.shortcut}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export default MarkdownEditorToolbar;

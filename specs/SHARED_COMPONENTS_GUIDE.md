# Shared Components & Hooks Guide
## CMS Phase 11 Consolidation Components

This guide documents the new shared components and hooks created during Phase 11 consolidation to reduce code duplication across CMS tickets.

---

## 1. TabContainer Component
**Location**: `/src/components/common/TabContainer.jsx`
**Usage**: For any multi-tab interface

### Features
- Reusable tabbed interface with proper ARIA attributes
- Tab state management
- Clean, semantic HTML
- Mobile responsive

### Example Usage
```jsx
import { useState } from 'react';
import TabContainer from '../common/TabContainer';
import SEOMetadata from './SEOMetadata';
import PublishingMetadata from './PublishingMetadata';

export function ContentMetadataManager() {
  const [activeTab, setActiveTab] = useState('seo');

  const tabs = [
    {
      id: 'seo',
      label: 'SEO',
      panel: <SEOMetadata data={seoData} onChange={handleSeoChange} />
    },
    {
      id: 'publishing',
      label: 'Publishing',
      panel: <PublishingMetadata data={pubData} onChange={handlePubChange} />
    }
  ];

  return (
    <TabContainer
      tabs={tabs}
      activeTab={activeTab}
      onChange={setActiveTab}
    />
  );
}
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tabs | Array | [] | Array of `{ id, label, panel }` objects |
| activeTab | String | '' | Currently selected tab ID |
| onChange | Function | () => {} | Callback when tab changes |
| disabled | Boolean | false | Disable all tabs |

---

## 2. FormField Component
**Location**: `/src/components/common/FormField.jsx`
**Usage**: For form inputs with consistent styling and validation

### Supported Types
- `text`, `email`, `password`, `number`, `date`, `datetime-local`, `time`, `tel`, `url`
- `textarea`
- `select`
- `checkbox`
- `radio`

### Example Usage
```jsx
import { FormField } from '../common/FormField';

export function SEOSettings() {
  const [title, setTitle] = useState('');
  const [errors, setErrors] = useState({});

  return (
    <>
      <FormField
        label="Meta Title"
        id="meta-title"
        type="text"
        value={title}
        onChange={setTitle}
        maxLength={60}
        helperText={`${title.length}/60 characters`}
        error={errors.title}
        required
      />

      <FormField
        label="Description"
        id="description"
        type="textarea"
        value={description}
        onChange={setDescription}
        rows={4}
        helperText="Recommended: 150-160 characters"
      />

      <FormField
        label="Status"
        id="status"
        type="select"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' }
        ]}
      />

      <FormField
        label="Featured"
        id="featured"
        type="checkbox"
        value={featured}
        onChange={setFeatured}
      />
    </>
  );
}
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | String | - | Field label |
| id | String | - | Field ID (required) |
| type | String | 'text' | Input type |
| value | String/Boolean | '' | Field value |
| onChange | Function | () => {} | Change callback |
| placeholder | String | '' | Input placeholder |
| maxLength | Number | null | Max character length |
| helperText | String | '' | Help text below field |
| error | String | null | Error message |
| disabled | Boolean | false | Disable field |
| required | Boolean | false | Mark as required |
| options | Array | [] | For select/radio types |
| rows | Number | 4 | Textarea row count |
| className | String | '' | Additional CSS classes |

---

## 3. PublishingEditor Component
**Location**: `/src/components/CMS/PublishingEditor.jsx`
**Usage**: For publishing metadata with status, BlueSky, scheduling

### Two Variants
1. **`variant="tabs"`**: For use in tabbed metadata managers
2. **`variant="sidebar"`**: For use in content editors

### Tab Variant Example
```jsx
import { PublishingEditor } from './PublishingEditor';

export function ContentMetadataManager() {
  const [publishingData, setPublishingData] = useState({
    status: 'draft',
    publishDate: '',
    scheduledTime: '',
    publishToBluesky: false,
    visibility: 'public',
    author: ''
  });

  const handlePublishingChange = (field, value) => {
    setPublishingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <PublishingEditor
      variant="tabs"
      status={publishingData.status}
      onStatusChange={(val) => handlePublishingChange('status', val)}
      publishDate={publishingData.publishDate}
      onPublishDateChange={(val) => handlePublishingChange('publishDate', val)}
      scheduledTime={publishingData.scheduledTime}
      onScheduledTimeChange={(val) => handlePublishingChange('scheduledTime', val)}
      publishToBluesky={publishingData.publishToBluesky}
      onBlueskyToggle={(val) => handlePublishingChange('publishToBluesky', val)}
      blueskyPreview={seoMetadata.metaDescription}
      visibility={publishingData.visibility}
      onVisibilityChange={(val) => handlePublishingChange('visibility', val)}
      author={publishingData.author}
      onAuthorChange={(val) => handlePublishingChange('author', val)}
    />
  );
}
```

### Sidebar Variant Example
```jsx
import { PublishingEditor } from './PublishingEditor';

export function EnhancedContentEditor() {
  const [publishStatus, setPublishStatus] = useState('draft');
  const [scheduledDate, setScheduledDate] = useState('');
  const [publishToBluesky, setPublishToBluesky] = useState(false);
  const [autoRebuild, setAutoRebuild] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  return (
    <PublishingEditor
      variant="sidebar"
      status={publishStatus}
      onStatusChange={setPublishStatus}
      scheduledDate={scheduledDate}
      onScheduledDateChange={setScheduledDate}
      publishToBluesky={publishToBluesky}
      onBlueskyToggle={setPublishToBluesky}
      autoRebuild={autoRebuild}
      onAutoRebuildToggle={setAutoRebuild}
      onPublish={handlePublish}
      onSaveDraft={handleSaveDraft}
      hasUnsavedChanges={unsavedChanges}
    />
  );
}
```

### Props (Both Variants)
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | String | 'tabs' | 'tabs' or 'sidebar' |
| status | String | 'draft' | Current status |
| onStatusChange | Function | () => {} | Status change handler |
| publishDate | String | '' | Publish date (YYYY-MM-DD) |
| onPublishDateChange | Function | () => {} | Date change handler |
| scheduledTime | String | '' | Scheduled time (HH:MM) |
| onScheduledTimeChange | Function | () => {} | Time change handler |
| publishToBluesky | Boolean | false | BlueSky toggle state |
| onBlueskyToggle | Function | () => {} | BlueSky toggle handler |
| blueskyPreview | String | '' | Preview text for BlueSky |
| visibility | String | 'public' | Content visibility |
| onVisibilityChange | Function | () => {} | Visibility change handler |
| author | String | '' | Selected author ID |
| onAuthorChange | Function | () => {} | Author change handler |
| authors | Array | [] | Available authors list |

### Sidebar-Only Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onPublish | Function | null | Publish button handler |
| onSaveDraft | Function | null | Save draft button handler |
| hasUnsavedChanges | Boolean | false | Show unsaved indicator |
| autoRebuild | Boolean | true | Auto-rebuild toggle |
| onAutoRebuildToggle | Function | () => {} | Auto-rebuild handler |

---

## 4. useUnsavedChanges Hook
**Location**: `/src/hooks/useUnsavedChanges.js`
**Usage**: For managing unsaved changes, auto-save, and unload warnings

### Features
- Auto-save with debounce
- beforeunload warning
- Save error tracking
- Loading state

### Example Usage
```jsx
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';

export function EnhancedContentEditor() {
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const { isSaving, lastSaved, saveError } = useUnsavedChanges(
    isDirty,
    async () => {
      // Auto-save logic
      await apiClient.put('/api/content/draft', {
        content,
        timestamp: new Date().toISOString()
      });
    },
    30000, // Auto-save every 30 seconds
    'You have unsaved changes. Are you sure you want to leave?'
  );

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setIsDirty(true);
  };

  return (
    <>
      <textarea value={content} onChange={handleContentChange} />
      {isSaving && <p>Auto-saving...</p>}
      {lastSaved && <p>Last saved: {lastSaved.toLocaleTimeString()}</p>}
      {saveError && <p className="error">Save failed: {saveError}</p>}
    </>
  );
}
```

### Hook Returns
```jsx
const {
  isSaving,           // Boolean - is currently auto-saving
  lastSaved,          // Date | null - timestamp of last save
  saveError,          // String | null - error message if save failed
  hasSaveError        // Boolean - convenience flag for error state
} = useUnsavedChanges(isDirty, onSave, interval, warningMessage);
```

### Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| isDirty | Boolean | - | Whether changes are unsaved |
| onSave | Async Function | () => {} | Async save handler |
| autosaveInterval | Number | 30000 | Debounce interval in ms |
| warningMessage | String | '...' | beforeunload warning text |

---

## 5. Shared Toast Component
**Location**: `/src/components/common/Toast.jsx`
**Already Used By**: ContentBrowser, SiteSettingsManager

### Updated Usage
SiteSettingsManager has been updated to use the shared Toast instead of defining it inline.

### Example Usage
```jsx
import Toast from '../common/Toast';

export function MyComponent() {
  const [toast, setToast] = useState(null);

  const handleSuccess = () => {
    setToast({ type: 'success', message: 'Saved successfully!' });
  };

  const handleError = (error) => {
    setToast({ type: 'error', message: `Error: ${error.message}` });
  };

  return (
    <>
      {/* Your component content */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}
    </>
  );
}
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | String | 'info' | 'success', 'error', 'info' |
| message | String | - | Toast message |
| onClose | Function | - | Close handler |
| duration | Number | 4000 | Auto-close duration in ms |

---

## Migration Checklist for Agents

When restarting agents to refactor with these components:

### CMS-002 (ContentBrowser)
- [ ] No changes needed - already uses shared Toast correctly
- [ ] Ready to complete PR

### CMS-003 (EnhancedContentEditor)
- [ ] Option: Add Toast notifications using shared Toast
- [ ] Option: Refactor PublishingControls to use PublishingEditor (sidebar variant)
- [ ] Tests should pass as-is since logic unchanged

### CMS-006 (SiteSettingsManager)
- [ ] ✅ Already fixed: Replaced inline Toast with shared Toast import
- [ ] ✅ Ready: Refactor tabs to use TabContainer component
- [ ] ✅ Ready: Refactor GeneralSettings/SEOSettings/AdvancedSettings to use FormField
- [ ] Hook: Add useUnsavedChanges if dirty flag should trigger auto-save

### CMS-007 (ContentMetadataManager)
- [ ] ✅ Refactor tabs to use TabContainer component
- [ ] ✅ Refactor PublishingMetadata to use PublishingEditor (tabs variant)
- [ ] ✅ Refactor SEOMetadata to use FormField for text inputs
- [ ] ✅ Refactor ContentMetadata to use FormField for tag/category inputs

---

## Styling & CSS Modules

All shared components use CSS modules with consistent variable names:
- `--color-primary`: Primary action color (blue)
- `--color-error`: Error state color (red)
- `--color-success`: Success state color (green)
- `--color-background`: Main background
- `--color-background-secondary`: Secondary background
- `--color-text`: Main text color
- `--color-text-secondary`: Secondary text color
- `--color-border`: Border color

These are inherited from your main design system or can be customized per component.

---

## Notes for Agents

1. **Test Strategy**: Since these are frontend components without complex logic, simple render checks are sufficient. Verify components render without errors and props are applied correctly.

2. **CSS Imports**: Each component has a corresponding `.module.css` file. Make sure to import them:
   ```jsx
   import styles from './ComponentName.module.css';
   ```

3. **Props API**: Follow the exact prop names and types documented. Props are designed for maximum flexibility across different use cases.

4. **Accessibility**: All components include proper ARIA attributes and semantic HTML. Maintain these when using.

5. **Mobile Responsive**: All components include mobile-responsive CSS. Test across breakpoints (640px, 768px).

---

## Summary of Consolidations

| Ticket | Action | Components |
|--------|--------|-----------|
| CMS-006 | Refactor | Use TabContainer for tabs + FormField for inputs |
| CMS-007 | Refactor | Use TabContainer for tabs + PublishingEditor + FormField |
| CMS-003 | Optional | Use PublishingEditor sidebar variant |
| CMS-002 | None | Already complete and correct |

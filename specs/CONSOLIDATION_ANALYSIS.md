# CMS Phase 11 Consolidation Analysis
## Code Duplication & Reusability Opportunities

**Analysis Date**: 2026-02-20
**Tickets Analyzed**: CMS-002, CMS-003, CMS-006, CMS-007
**Current Status**: 4 frontend components with significant duplication identified

---

## EXECUTIVE SUMMARY

After analyzing the 4 paused CMS agent implementations (ContentBrowser, EnhancedContentEditor, SiteSettingsManager, ContentMetadataManager), we identified **5 major duplication patterns** and **4 key reusable component opportunities**.

**Key Finding**: While components are functional and complete, they would benefit from:
1. Consolidating the Toast component usage (1 inline definition vs 1 shared)
2. Extracting publishing metadata logic into a reusable component
3. Creating shared tab interface patterns
4. Abstracting form field patterns
5. Extracting unsaved changes tracking into a custom hook

---

## DUPLICATION PATTERNS IDENTIFIED

### 1. **Toast Component (CRITICAL DUPLICATION)**

| Location | Implementation | Status |
|----------|-----------------|--------|
| `/components/common/Toast.jsx` | Shared component - fully featured | ✅ EXISTS |
| `SiteSettingsManager.jsx` (lines 10-21) | Inline definition - duplicated | ❌ UNUSED |
| `ContentBrowser.jsx` | Uses common Toast correctly | ✅ CORRECT |
| `EnhancedContentEditor.jsx` | Does not use Toast | ⚠️ MISSING |

**Issue**: SiteSettingsManager reinvents the Toast instead of importing the shared version.

**Fix Required**:
```jsx
// INSTEAD OF:
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (...);
}

// USE:
import Toast from '../common/Toast';
```

---

### 2. **Publishing Metadata Fields (MAJOR DUPLICATION)**

Two separate implementations of nearly identical publishing controls exist:

#### PublishingControls.jsx (EnhancedContentEditor sidebar)
```
- Status selector (draft/scheduled/published)
- Scheduled date picker (conditional on scheduled status)
- BlueSky toggle
- Auto-rebuild toggle
- Publish button
- Save Draft button
```

#### PublishingMetadata.jsx (ContentMetadataManager tab)
```
- Publish date picker
- Scheduled time (conditional on future date)
- Status selector (draft/scheduled/published)
- Visibility selector
- BlueSky toggle + preview
- Author selector
```

**Overlap**: ~70% identical functionality with different layout patterns

**Duplication Points**:
- Status selector logic (both have exact same 3 options)
- Scheduled date handling (both check if date is in future)
- BlueSky toggle logic
- Layout and styling (different CSS but similar structure)

**Consolidation Opportunity**: Create `PublishingEditor` component that can render in both sidebar and tab layouts.

---

### 3. **Tabbed Interface Pattern (STRUCTURAL DUPLICATION)**

#### ContentMetadataManager.jsx (lines 168-231)
```jsx
<div className={styles.tabsContainer}>
  <div className={styles.tabs} role="tablist">
    <button role="tab" aria-selected={activeTab === 'seo'} onClick={...}>
      SEO
    </button>
    // ... more tabs
  </div>
</div>

<div className={styles.content}>
  {activeTab === 'seo' && <SEOMetadata ... />}
  {activeTab === 'publishing' && <PublishingMetadata ... />}
  // ... more panels
</div>
```

#### SiteSettingsManager.jsx (lines 111-162)
```jsx
<div className={styles.tabsContainer}>
  <div className={styles.tabs}>
    <button onClick={() => setActiveTab('general')} role="tab">
      General
    </button>
    // ... more tabs
  </div>
</div>

<div className={styles.tabContent}>
  {activeTab === 'general' && <GeneralSettings ... />}
  {activeTab === 'seo' && <SEOSettings ... />}
  // ... more panels
</div>
```

**Pattern Duplication**: ~90% identical structure

**Consolidation Opportunity**: Create reusable `TabContainer` component.

---

### 4. **Form Field Pattern (PERVASIVE DUPLICATION)**

Used across all form-based components:

```jsx
<div className={styles.formGroup}>
  <label htmlFor="field-id">Label</label>
  <input
    id="field-id"
    type="text"
    value={data.field}
    onChange={(e) => onChange('field', e.target.value)}
    className={styles.input}
    maxLength={60}
  />
  <small className={styles.helperText}>
    {data.field?.length || 0}/60 characters
  </small>
</div>
```

**Locations**:
- SEOMetadata.jsx (meta title, description, slug, canonical URL)
- PublishingMetadata.jsx (date fields)
- FrontmatterForm.jsx (dynamic fields)
- GeneralSettings.jsx (various settings)
- SEOSettings.jsx (various settings)
- AdvancedSettings.jsx (various settings)

**Consolidation Opportunity**: Create `FormField` component with variants for text, textarea, select, checkbox, etc.

---

### 5. **Unsaved Changes Tracking (LOGIC DUPLICATION)**

#### EnhancedContentEditor.jsx (lines 38-102)
```jsx
const [unsavedChanges, setUnsavedChanges] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [lastSaved, setLastSaved] = useState(null);

useEffect(() => {
  if (unsavedChanges) {
    setIsSaving(true);
    autosaveTimerRef.current = setTimeout(() => {
      localStorage.setItem(`draft-${siteId}`, JSON.stringify(draft));
      setLastSaved(new Date());
      setIsSaving(false);
    }, AUTOSAVE_INTERVAL);
  }
  return () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
  };
}, [content, frontmatter, unsavedChanges, siteId]);
```

#### SiteSettingsManager.jsx (lines 28-93)
```jsx
const [isDirty, setIsDirty] = useState(false);
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  try {
    setIsSaving(true);
    const response = await fetch(`/api/sites/${siteId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    setIsDirty(false);
  } finally {
    setIsSaving(false);
  }
};
```

**Consolidation Opportunity**: Create `useUnsavedChanges` hook to centralize logic.

---

## REUSABLE COMPONENT OPPORTUNITIES

### Opportunity 1: TabContainer Component
**Priority**: HIGH
**Affected Tickets**: CMS-006 (SiteSettingsManager), CMS-007 (ContentMetadataManager)

```jsx
// src/components/common/TabContainer.jsx
export function TabContainer({
  tabs,           // Array of { id, label, panel }
  activeTab,      // Currently selected tab
  onChange,       // Handler for tab changes
  disabled = false
}) {
  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabs} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            onClick={() => onChange(tab.id)}
            disabled={disabled}
            className={...}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>
        {tabs.find(tab => tab.id === activeTab)?.panel}
      </div>
    </div>
  );
}
```

**Migration Path**:
1. Create `/components/common/TabContainer.jsx`
2. Update CMS-007 to use TabContainer
3. Update CMS-006 to use TabContainer

---

### Opportunity 2: PublishingEditor Component
**Priority**: HIGH
**Affected Tickets**: CMS-003 (EnhancedContentEditor), CMS-007 (ContentMetadataManager)

```jsx
// src/components/CMS/PublishingEditor.jsx
export function PublishingEditor({
  status = 'draft',
  scheduledDate = '',
  publishToBluesky = false,
  visibility = 'public',
  author = '',
  onStatusChange = () => {},
  onScheduledDateChange = () => {},
  onBlueskyToggle = () => {},
  onVisibilityChange = () => {},
  onAuthorChange = () => {},
  variant = 'tabs',  // 'tabs' | 'sidebar'
  disabled = false
}) {
  // Shared logic, two render variants
}
```

**Benefits**:
- Deduplicates 70% of publishing field logic
- Maintains layout flexibility (tabs vs sidebar)
- Single source of truth for publishing states

---

### Opportunity 3: FormField Component
**Priority**: MEDIUM
**Affected Tickets**: CMS-006, CMS-007 (and any future settings forms)

```jsx
// src/components/common/FormField.jsx
export function FormField({
  label,
  id,
  type = 'text',  // 'text' | 'textarea' | 'select' | 'checkbox' | 'date'
  value,
  onChange,
  options = [],   // for select/radio
  placeholder = '',
  maxLength = null,
  helperText = '',
  error = null,
  disabled = false
}) {
  // Renders appropriate input type with label, helper, error
}
```

**Usage Example**:
```jsx
<FormField
  label="Meta Title"
  id="meta-title"
  value={data.metaTitle}
  onChange={(val) => onChange('metaTitle', val)}
  maxLength={60}
  helperText={`${data.metaTitle?.length || 0}/60 characters`}
  error={errors.metaTitle}
/>
```

---

### Opportunity 4: useUnsavedChanges Hook
**Priority**: MEDIUM
**Affected Tickets**: CMS-003 (EnhancedContentEditor), CMS-006 (SiteSettingsManager)

```jsx
// src/hooks/useUnsavedChanges.js
export function useUnsavedChanges(
  isDirty,
  onSave = () => {},
  autosaveInterval = 30000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isDirty) return;

    setIsSaving(true);
    timerRef.current = setTimeout(async () => {
      await onSave();
      setLastSaved(new Date());
      setIsSaving(false);
    }, autosaveInterval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, onSave, autosaveInterval]);

  // Handle beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes...';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return { isSaving, lastSaved };
}
```

---

## IMPLEMENTATION ROADMAP

### Phase 1: Quick Wins (30 minutes)
1. **Fix Toast duplication in SiteSettingsManager**
   - Replace inline Toast definition with import from common
   - Remove duplicate Toast component code

2. **Import Toast in EnhancedContentEditor**
   - Add toast notifications where needed (publish/save feedback)

### Phase 2: Component Extraction (1-2 hours)
3. **Create TabContainer component** (requires restarting agents to use it)
   - Extract tab logic into reusable component
   - Update CMS-007 and CMS-006 to use TabContainer

4. **Create PublishingEditor component** (optional, more complex refactor)
   - Extract publishing fields into shared component
   - Support both sidebar and tab layouts

### Phase 3: Optional Enhancements
5. **Create FormField component**
   - Reduce boilerplate across settings forms
   - Standardize form field appearance and behavior

6. **Create useUnsavedChanges hook**
   - Centralize unsaved changes logic
   - Reduce duplication in editors

---

## RECOMMENDED NEXT STEPS

**Option A: Minimal Consolidation (Proceed as-is)**
- Fix Toast duplication in SiteSettingsManager
- All 4 components work and are production-ready
- Leave tab and form patterns for future refactor
- **Time**: 15-20 minutes to fix Toast

**Option B: Moderate Consolidation (Recommended)**
- Fix Toast duplication
- Create TabContainer component
- Restart CMS-006 and CMS-007 agents to refactor with TabContainer
- **Time**: 1-2 hours, better code quality

**Option C: Comprehensive Consolidation**
- All of Option B plus:
- Create PublishingEditor component (complex)
- Create FormField component
- Create useUnsavedChanges hook
- **Time**: 3-4 hours, best long-term code quality

---

## CURRENT COMPLETION STATUS

| Ticket | Component | Status | Issues | Consolidation Impact |
|--------|-----------|--------|--------|----------------------|
| CMS-002 | ContentBrowser | ✅ Working | API mocks need setup | Low - uses common Toast correctly |
| CMS-003 | EnhancedContentEditor | ✅ Working | No Toast feedback | Low - sidebar layout is unique |
| CMS-006 | SiteSettingsManager | ✅ Working | Toast duplication | High - uses inline Toast, should use TabContainer |
| CMS-007 | ContentMetadataManager | ✅ Working | Tabs work | High - should use TabContainer + PublishingEditor |

---

## SUMMARY FOR USER DECISION

**All 4 tickets are functionally complete and working**. The consolidation opportunities are about code quality and maintainability, not functionality.

**Recommendation**: Proceed with **Option A (minimal)** to fix the Toast duplication, then restart all 4 agents sequentially to complete their PRs. Later, if more CMS components are added, these consolidation patterns can be extracted.

**Alternative**: If you want best code quality now, implement **Option B (moderate)** by:
1. Fixing Toast in SiteSettingsManager
2. Creating TabContainer component
3. Restarting CMS-006 and CMS-007 agents to refactor with TabContainer
4. Completing their PRs with refactored code

Which option would you prefer?

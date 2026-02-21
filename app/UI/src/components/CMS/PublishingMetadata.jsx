/**
 * PublishingMetadata Component
 *
 * Publishing tab for ContentMetadataManager with fields:
 * - Publish date picker
 * - Scheduled time
 * - Status selector
 * - Visibility
 * - BlueSky toggle and preview
 * - Author selector
 *
 * Refactored to use PublishingEditor component (tabs variant)
 */

import { PublishingEditor } from './PublishingEditor';

export function PublishingMetadata({
  data = {},
  onChange = () => {},
  seoMetadata = {},
  disabled = false
}) {
  return (
    <PublishingEditor
      variant="tabs"
      status={data.status || 'draft'}
      onStatusChange={(val) => onChange('status', val)}
      publishDate={data.publishDate || ''}
      onPublishDateChange={(val) => onChange('publishDate', val)}
      scheduledTime={data.scheduledTime || ''}
      onScheduledTimeChange={(val) => onChange('scheduledTime', val)}
      publishToBluesky={data.publishToBluesky || false}
      onBlueskyToggle={(val) => onChange('publishToBluesky', val)}
      blueskyPreview={seoMetadata.metaDescription || ''}
      visibility={data.visibility || 'public'}
      onVisibilityChange={(val) => onChange('visibility', val)}
      author={data.author || ''}
      onAuthorChange={(val) => onChange('author', val)}
      disabled={disabled}
    />
  );
}

export default PublishingMetadata;

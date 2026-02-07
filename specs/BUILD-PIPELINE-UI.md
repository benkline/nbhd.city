# Build Pipeline UI Design

**Document Version:** 1.0
**Phase:** 2h (BUILD-001, BUILD-002, BUILD-003)
**Last Updated:** 2026-01-31

## Overview

Phase 2h completes the build pipeline UI for the existing backend infrastructure (SSG-015, SSG-016). This document defines the frontend components for triggering builds, monitoring status, and viewing build history.

## Architecture Overview

The build pipeline consists of three layers:

```
Layer 1: Build Trigger
  └── User clicks "Deploy Site"
      → BuildTriggerButton
      → POST /api/sites/{id}/build
      → Returns job_id immediately (202 Accepted)

Layer 2: Build Monitoring
  └── Poll /api/sites/{id}/builds/{job_id} every 5 seconds
      → BuildStatusPoller
      → Shows: pending → running → completed/failed
      → Displays logs in real-time

Layer 3: Build History
  └── View past builds with status/duration
      → BuildHistory component
      → GET /api/sites/{id}/builds
      → Table with all build records
```

## API Integration

### Build Trigger Endpoint

```
POST /api/sites/{id}/build
{
  "force": boolean (optional, rebuild even if no changes)
}

Response (202 Accepted):
{
  "job_id": "build-20260131-abc123",
  "status": "pending",
  "site_id": "{id}",
  "triggered_at": "2026-01-31T10:00:00Z"
}
```

### Build Status Endpoint

```
GET /api/sites/{id}/builds/{job_id}

Response:
{
  "job_id": "build-20260131-abc123",
  "site_id": "{id}",
  "status": "running",
  "started_at": "2026-01-31T10:00:05Z",
  "logs": [
    "Cloning template repository...",
    "Fetching content records...",
    "Running npm install...",
    "Building site with 11ty..."
  ],
  "last_updated": "2026-01-31T10:01:30Z"
}
```

### Build List Endpoint

```
GET /api/sites/{id}/builds?limit=50&offset=0

Response:
{
  "total": 127,
  "limit": 50,
  "offset": 0,
  "builds": [
    {
      "job_id": "build-20260131-abc123",
      "status": "completed",
      "started_at": "2026-01-31T10:00:00Z",
      "completed_at": "2026-01-31T10:05:30Z",
      "duration_seconds": 330,
      "error_message": null,
      "url": "https://site.nbhd.city"
    },
    {
      "job_id": "build-20260130-xyz789",
      "status": "failed",
      "started_at": "2026-01-30T14:00:00Z",
      "completed_at": "2026-01-30T14:02:15Z",
      "duration_seconds": 135,
      "error_message": "npm install timeout after 60 seconds"
    }
  ]
}
```

## Status Lifecycle

```
Build states:

pending
  └─ Initial state after triggering
  └─ Job queued in Lambda
  └─ Duration: 0-10 seconds typically

running
  └─ Build Lambda executing
  └─ Cloning repo, building site
  └─ Duration: 30-300 seconds typical
  └─ Log output available

completed
  └─ Build succeeded
  └─ Site deployed to S3/CloudFront
  └─ Site live at URL
  └─ Polling stops

failed
  └─ Build error occurred
  └─ Error message provided
  └─ Logs contain error details
  └─ Polling stops

canceled (optional)
  └─ User canceled the build
  └─ Treated as failed
  └─ Polling stops
```

## Component Specifications

### BUILD-001: Site Build Trigger UI

#### `BuildTriggerButton.jsx`

```jsx
<BuildTriggerButton
  site={site}           // { id, name, status }
  onBuildTriggered={handleBuildTriggered}
/>
```

**Behavior:**

1. **Normal State**
   - Button text: "Deploy Site"
   - Icon: 🚀
   - Enabled: True (unless build already in progress)
   - Tooltip: "Build and deploy this site"

2. **Click Handler**
   - Show confirmation dialog:
     ```
     Are you sure you want to rebuild this site?
     [Cancel] [Deploy]
     ```
   - On confirm: POST /api/sites/{id}/build
   - Show loading spinner

3. **After Trigger**
   - Disable button while loading
   - Show success toast: "Build started (job_id: build-xxx)"
   - Call `onBuildTriggered(job_id)` callback
   - Callback opens BuildStatusPoller

4. **Error Handling**
   - Show error toast with message
   - Re-enable button
   - Log error to console

**Implementation Notes:**
- Use existing toast/modal components from codebase
- Disable if site status is "building"
- Add optional "force rebuild" toggle
- Track request state locally

**Integration:**
- Added to `SiteManagementDashboard.jsx`
- Position: Action column for each site

#### Component Code Structure

```jsx
function BuildTriggerButton({ site, onBuildTriggered }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleTrigger() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sites/${site.id}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      showToast('success', `Build started: ${data.job_id}`);
      onBuildTriggered(data.job_id);
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  }

  const isBuilding = site.status === 'building';

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isLoading || isBuilding}
      >
        🚀 {isLoading ? 'Deploying...' : 'Deploy Site'}
      </button>

      {showConfirm && (
        <ConfirmDialog
          title="Rebuild Site?"
          message="Are you sure you want to rebuild and deploy this site?"
          onConfirm={handleTrigger}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
```

### BUILD-002: Build Status Poller

#### `BuildStatusPoller.jsx`

```jsx
<BuildStatusPoller
  site={site}           // { id, name }
  jobId={jobId}         // Job ID from build trigger
  onBuildComplete={handleBuildComplete}
  onError={handleError}
/>
```

**Behavior:**

1. **On Mount**
   - Immediately fetch status
   - Start polling interval (5 seconds)
   - Display current status

2. **Polling Loop**
   ```
   Get Status
     ├─ If pending/running: continue polling
     ├─ If completed/failed: stop polling
     └─ Update UI with status and logs
   ```

3. **Display**
   - Status badge (color-coded)
   - Progress indicator (if running)
   - Log viewer (last 50 lines, auto-scrolling)
   - Elapsed time
   - Manual refresh button

4. **Stop Conditions**
   - Build status is "completed" → green checkmark
   - Build status is "failed" → red X, show error
   - User navigates away → cleanup (stop polling)
   - 30-minute timeout (safety limit)

**Component Structure:**

```jsx
function BuildStatusPoller({ site, jobId, onBuildComplete, onError }) {
  const [status, setStatus] = useState('pending');
  const [logs, setLogs] = useState([]);
  const [isPolling, setIsPolling] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  async function fetchStatus() {
    try {
      const response = await fetch(
        `/api/sites/${site.id}/builds/${jobId}`
      );
      const data = await response.json();

      setStatus(data.status);
      setLogs(data.logs || []);

      if (data.status === 'completed' || data.status === 'failed') {
        setIsPolling(false);
        onBuildComplete(data);
      }
    } catch (error) {
      onError(error);
    }
  }

  useEffect(() => {
    // Fetch immediately
    fetchStatus();

    // Set up polling
    if (isPolling) {
      pollIntervalRef.current = setInterval(fetchStatus, 5000);
    }

    // Set up timer for elapsed time
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);

    return () => {
      clearInterval(pollIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    };
  }, [isPolling]);

  return (
    <BuildStatusDisplay
      status={status}
      logs={logs}
      elapsedSeconds={elapsedSeconds}
      onRefresh={fetchStatus}
      isPolling={isPolling}
    />
  );
}
```

#### `BuildStatusDisplay.jsx` (display component)

```jsx
function BuildStatusDisplay({ status, logs, elapsedSeconds, onRefresh, isPolling }) {
  const statusColors = {
    pending: 'yellow',
    running: 'blue',
    completed: 'green',
    failed: 'red'
  };

  const statusIcons = {
    pending: '⏳',
    running: '⚙️',
    completed: '✅',
    failed: '❌'
  };

  return (
    <div className="build-status-panel">
      <div className="header">
        <div className="status-badge" style={{ borderColor: statusColors[status] }}>
          {statusIcons[status]} {status.toUpperCase()}
        </div>
        <div className="elapsed-time">
          Elapsed: {formatSeconds(elapsedSeconds)}
        </div>
        <button onClick={onRefresh} disabled={!isPolling}>
          🔄 Refresh
        </button>
      </div>

      <div className="logs-viewer">
        <div className="logs-header">Build Logs</div>
        <pre className="logs-content">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </pre>
      </div>

      {status === 'failed' && (
        <div className="error-section">
          <strong>Build Failed</strong>
          <p>Check the logs above for details.</p>
        </div>
      )}

      {status === 'completed' && (
        <div className="success-section">
          <strong>Build Successful!</strong>
          <p>Your site has been deployed.</p>
          <a href={/* site url */} target="_blank">
            View Site →
          </a>
        </div>
      )}

      {isPolling && (
        <div className="polling-indicator">
          Polling for updates...
        </div>
      )}
    </div>
  );
}
```

**Integration:**
- Modal or slide-out panel
- Triggered by BuildTriggerButton callback
- Can stay open while user edits other sites
- Closes on user request or build completion

### BUILD-003: Build History Dashboard

#### `BuildHistory.jsx`

```jsx
<BuildHistory
  siteId={siteId}
  onBuildClick={handleBuildClick}  // Optional: click to see logs
/>
```

**Behavior:**

1. **Load Builds**
   - Fetch GET /api/sites/{id}/builds?limit=50
   - Display table with pagination

2. **Columns**
   ```
   Status | Started | Duration | Error | Actions
   ──────────────────────────────────────────────
   ✅     | Jan 31  | 5m 30s   | -     | [Logs]
   ❌     | Jan 30  | 2m 15s   | Timeout | [Logs]
   ```

3. **Status Visualization**
   - completed: Green checkmark + duration
   - failed: Red X + error message
   - pending/running: Not in history (only completed builds)

4. **Pagination**
   - Show 50 builds per page
   - "Previous" / "Next" buttons
   - Show "1-50 of 127 builds"

5. **Sorting**
   - Default: newest first (by started_at)
   - User can click column headers to sort
   - Support reverse sort on any column

**Component Code:**

```jsx
function BuildHistory({ siteId, onBuildClick }) {
  const [builds, setBuilds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 50;

  useEffect(() => {
    fetchBuilds((page - 1) * LIMIT);
  }, [page]);

  async function fetchBuilds(offset) {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/sites/${siteId}/builds?limit=${LIMIT}&offset=${offset}`
      );
      const data = await response.json();
      setBuilds(data.builds);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch builds:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  return (
    <div className="build-history">
      <h3>Build History</h3>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <table className="builds-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Started</th>
                <th>Duration</th>
                <th>Error</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {builds.map((build) => (
                <tr key={build.job_id}>
                  <td>
                    {build.status === 'completed' && '✅'}
                    {build.status === 'failed' && '❌'}
                  </td>
                  <td>{formatDate(build.started_at)}</td>
                  <td>
                    {build.duration_seconds
                      ? formatDuration(build.duration_seconds)
                      : '-'}
                  </td>
                  <td className="error-cell">
                    {build.error_message || '-'}
                  </td>
                  <td>
                    <button onClick={() => onBuildClick(build)}>
                      View Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              ← Previous
            </button>
            <span>
              {(page - 1) * LIMIT + 1} - {Math.min(page * LIMIT, total)} of {total}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * LIMIT >= total}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

**Integration:**
- Add to `SiteManagementDashboard.jsx` as expandable section
- Or separate tab in SiteDetail page
- Shows last 50 builds by default
- Can expand to view older builds via pagination

## UI Layout Examples

### In SiteManagementDashboard

```
┌─────────────────────────────────────────────────┐
│ Sites                                           │
├─────────────────────────────────────────────────┤
│ [+ New Site]  [Filter] [Sort]                  │
├─────────────────────────────────────────────────┤
│ Site Name      Status    Last Build  Actions   │
│ ──────────────────────────────────────────────  │
│ My Blog        Draft     Jan 31      [🚀 Deploy]
│ Portfolio      Published Jan 29      [🚀 Deploy]
│ Resume         Published Dec 15      [🚀 Deploy]
│
│ [BUILD HISTORY - EXPANDED]
│ ────────────────────────────────────────────────
│ Build Trigger:
│   [🚀 Deploy Site] (or "Deploying..." if in progress)
│
│ Build Status (if in progress):
│   ⚙️ RUNNING  Elapsed: 1m 23s  [🔄 Refresh]
│
│   Build Logs:
│   ┌──────────────────────────────────┐
│   │ Cloning template repository...   │
│   │ Fetching content records...      │
│   │ Running npm install... (50%)     │
│   │ Building with 11ty...            │
│   └──────────────────────────────────┘
│
│ Build History:
│   Status | Started  | Duration | Error | Actions
│   ────────────────────────────────────────────────
│   ✅     | Jan 29   | 5m 30s   | -     | [Logs]
│   ❌     | Jan 28   | 2m 45s   | Timeout | [Logs]
│   ✅     | Jan 27   | 4m 12s   | -     | [Logs]
│
│   [← Previous]  1-3 of 27 builds  [Next →]
└─────────────────────────────────────────────────┘
```

## Error Handling

### Build Trigger Errors

```
Common errors:
- 404: Site not found
- 403: Not authorized to deploy this site
- 409: Build already in progress for this site
- 500: Lambda invocation failed

Display:
  Show toast with user-friendly message
  Log full error to console
  Disable button temporarily, re-enable after 5 seconds
```

### Build Status Errors

```
Network errors during polling:
  - Continue polling (don't fail immediately)
  - Show warning icon
  - After 3 consecutive failures, show error message
  - Offer "retry" button

Build timeout (>30 minutes):
  - Stop polling
  - Show "Build took too long" error
  - Offer to manually check logs
```

## Performance Considerations

### Polling Optimization

```
- Poll interval: 5 seconds (balance between freshness and load)
- Stop polling once build completes (don't waste requests)
- Use conditional requests (If-Modified-Since header)
- Debounce refresh button (min 1 second between clicks)
- Unsubscribe from polling on component unmount
```

### Build History Optimization

```
- Paginate: 50 items per page (balance between load time and scrolling)
- Cache most recent build history (5-minute TTL)
- Lazy load logs (don't fetch all logs upfront)
- Virtual scrolling for large tables (if needed)
```

## Testing Strategy

### Backend Tests (API integration)

```
test_build_trigger.py
├── Trigger returns 202 Accepted
├── job_id is generated and unique
├── Lambda is invoked asynchronously
└── Build job created in DynamoDB

test_build_status.py
├── Polling returns correct status
├── Logs are accumulated and returned
├── Status updates correctly
└── Non-existent job returns 404

test_build_history.py
├── List builds paginated
├── Pagination works correctly
├── Sorting works on all columns
└── Failed builds show error messages
```

### Frontend Tests

```
BuildTriggerButton.test.jsx
├── Button renders and is clickable
├── Confirmation dialog shown on click
├── API call triggered on confirm
├── Loading state shown
├── Success toast displayed
├── Error toast on failure
└── Callback called with job_id

BuildStatusPoller.test.jsx
├── Fetches status on mount
├── Starts polling immediately
├── Updates status correctly
├── Logs display and auto-scroll
├── Stops polling on completion
├── Handles network errors
└── Cleans up intervals on unmount

BuildHistory.test.jsx
├── Loads and displays builds
├── Pagination works
├── Sorting works
├── Status indicators display correctly
├── "View Logs" links work
└── Empty state shows when no builds
```

## References

- **Ticket**: BUILD-001 (Site Build Trigger UI), BUILD-002 (Build Status Poller), BUILD-003 (Build History Dashboard)
- **Backend**: [BUILD_PIPELINE.md](./BUILD_PIPELINE.md)
- **API**: [API.md](./API.md)
- **Frontend**: [FRONTEND.md](./FRONTEND.md)

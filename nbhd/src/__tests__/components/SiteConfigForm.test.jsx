import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SiteConfigForm } from '../../components/SiteBuilder/SiteConfigForm';

// Mock useMyNbhds hook for site type tests
vi.mock('../../hooks/useMyNeighborhoods', () => ({
  useMyNbhds: () => ({
    nbhds: [
      { id: 'nbhd-1', name: 'Tech Neighborhood' },
      { id: 'nbhd-2', name: 'Arts Neighborhood' }
    ],
    loading: false,
    error: null,
    refresh: vi.fn()
  })
}));

// Mock template data with schema
const mockTemplate = {
  id: 'blog',
  name: 'Blog',
  schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        label: 'Site Title',
        required: true,
        maxLength: 100
      },
      author: {
        type: 'string',
        label: 'Author Name',
        required: true
      },
      description: {
        type: 'string',
        label: 'Site Description',
        widget: 'textarea',
        maxLength: 500
      },
      accentColor: {
        type: 'string',
        label: 'Accent Color',
        widget: 'color',
        default: '#007bff'
      }
    }
  }
};

describe('SiteConfigForm', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // [x] Read `config.schema.json` from selected template
  it('renders form with template schema', () => {
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('config-form')).toBeInTheDocument();
  });

  // [x] Form renders all schema fields correctly
  it('renders all form fields from schema', () => {
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} />
      </BrowserRouter>
    );

    // Check for all fields
    expect(screen.getByLabelText(/Site Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Author Name/)).toBeInTheDocument();
    expect(screen.getByLabelText('Site Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Accent Color')).toBeInTheDocument();
  });

  // [x] Generate form inputs based on schema (text, textarea, color picker, etc)
  it('generates correct input types based on schema widget', () => {
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} />
      </BrowserRouter>
    );

    const textarea = screen.getByLabelText('Site Description');
    expect(textarea.tagName).toBe('TEXTAREA');

    const colorInput = screen.getByLabelText('Accent Color');
    expect(colorInput.type).toBe('color');

    const titleInput = screen.getByLabelText(/Site Title/);
    expect(titleInput.type).toBe('text');
  });

  // [x] Real-time preview updates as user types
  it('triggers preview updates when user types', () => {
    const mockOnPreviewUpdate = vi.fn();
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} onPreviewUpdate={mockOnPreviewUpdate} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText(/Site Title/);
    fireEvent.change(titleInput, { target: { value: 'My Blog' } });

    expect(mockOnPreviewUpdate).toHaveBeenCalled();
  });

  // [x] "Preview" and "Deploy" buttons
  it('renders Preview and Deploy buttons', () => {
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deploy/i })).toBeInTheDocument();
  });

  // [x] Save draft configurations locally (localStorage)
  it('saves draft configuration to localStorage after delay', () => {
    vi.useFakeTimers();
    const siteId = 'site-001';

    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} siteId={siteId} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText(/Site Title/);
    act(() => {
      fireEvent.change(titleInput, { target: { value: 'My Blog' } });
      // Advance timers 30 seconds
      vi.advanceTimersByTime(30000);
    });

    const saved = localStorage.getItem(`site-draft-${siteId}`);
    expect(saved).toBeTruthy();
    const config = JSON.parse(saved);
    expect(config.title).toBe('My Blog');

    vi.useRealTimers();
  });

  // [x] Draft auto-saves every 30 seconds
  it('auto-saves draft every 30 seconds', () => {
    vi.useFakeTimers();
    const siteId = 'site-002';
    const mockOnSave = vi.fn();

    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} siteId={siteId} onSave={mockOnSave} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText(/Site Title/);
    act(() => {
      fireEvent.change(titleInput, { target: { value: 'New Blog' } });
      // Auto-save happens after 30 seconds
      vi.advanceTimersByTime(30000);
    });

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Blog'
    }));

    vi.useRealTimers();
  });

  // [x] Validation matches schema constraints
  it('validates form inputs against schema constraints (maxLength)', () => {
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText(/Site Title/);

    // Try to exceed maxLength
    fireEvent.change(titleInput, {
      target: { value: 'A'.repeat(101) }
    });

    // Component should prevent exceeding maxLength
    expect(titleInput.value.length).toBeLessThanOrEqual(100);
  });

  // [x] Form persists across page refreshes
  it('persists form data across page refreshes from localStorage', () => {
    const siteId = 'site-003';
    const initialConfig = {
      title: 'My Blog',
      author: 'John Doe',
      description: 'A blog about life',
      accentColor: '#ff0000'
    };

    // Pre-populate localStorage
    localStorage.setItem(`site-draft-${siteId}`, JSON.stringify(initialConfig));

    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} siteId={siteId} />
      </BrowserRouter>
    );

    // Component should load from localStorage
    expect(screen.getByLabelText(/Site Title/)).toHaveValue('My Blog');
    expect(screen.getByLabelText(/Author Name/)).toHaveValue('John Doe');
    expect(screen.getByLabelText('Site Description')).toHaveValue('A blog about life');
  });

  // Test required field validation
  it('prevents deploy if required fields are missing', () => {
    const mockOnDeploy = vi.fn();
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} onDeploy={mockOnDeploy} />
      </BrowserRouter>
    );

    const deployButton = screen.getByRole('button', { name: /deploy/i });
    fireEvent.click(deployButton);

    // Should not call deploy when validation fails
    expect(mockOnDeploy).not.toHaveBeenCalled();
  });

  // Test Preview button functionality
  it('calls preview handler when Preview button is clicked with valid data', () => {
    const mockOnPreview = vi.fn();
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} onPreview={mockOnPreview} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText(/Site Title/);
    const authorInput = screen.getByLabelText(/Author Name/);

    fireEvent.change(titleInput, { target: { value: 'My Blog' } });
    fireEvent.change(authorInput, { target: { value: 'John Doe' } });

    const previewButton = screen.getByRole('button', { name: /preview/i });
    fireEvent.click(previewButton);

    expect(mockOnPreview).toHaveBeenCalledWith(expect.objectContaining({
      title: 'My Blog',
      author: 'John Doe'
    }));
  });

  // Test Deploy button functionality
  it('calls deploy handler when Deploy button is clicked with valid data', () => {
    const mockOnDeploy = vi.fn().mockResolvedValue({});
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} onDeploy={mockOnDeploy} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText(/Site Title/);
    const authorInput = screen.getByLabelText(/Author Name/);

    act(() => {
      fireEvent.change(titleInput, { target: { value: 'My Blog' } });
      fireEvent.change(authorInput, { target: { value: 'John Doe' } });
    });

    const deployButton = screen.getByRole('button', { name: /deploy/i });
    act(() => {
      fireEvent.click(deployButton);
    });

    expect(mockOnDeploy).toHaveBeenCalledWith(expect.objectContaining({
      title: 'My Blog',
      author: 'John Doe'
    }));
  });

  // [ ] Site type selector shown with personal as default
  it('shows site type selector with personal as default', () => {
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} />
      </BrowserRouter>
    );

    const personalRadio = screen.getByLabelText(/Personal Site/);
    const projectRadio = screen.getByLabelText(/Project Site/);

    expect(personalRadio).toBeInTheDocument();
    expect(projectRadio).toBeInTheDocument();
    expect(personalRadio).toBeChecked();
    expect(projectRadio).not.toBeChecked();
  });

  // [ ] Neighborhood selector hidden for personal sites
  it('hides neighborhood selector for personal sites', () => {
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} />
      </BrowserRouter>
    );

    // Personal is default, so neighborhood selector should not be visible
    expect(screen.queryByLabelText(/Neighborhood/)).not.toBeInTheDocument();
  });

  // [ ] Neighborhood selector shown when project type selected
  it('shows neighborhood selector when project type selected', () => {
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} />
      </BrowserRouter>
    );

    const projectRadio = screen.getByLabelText(/Project Site/);
    act(() => {
      fireEvent.click(projectRadio);
    });

    // Neighborhood selector should now be visible
    const nbhdSelect = screen.getByLabelText(/Neighborhood/);
    expect(nbhdSelect).toBeInTheDocument();
    expect(screen.getByText('Tech Neighborhood')).toBeInTheDocument();
    expect(screen.getByText('Arts Neighborhood')).toBeInTheDocument();
  });

  // [ ] Validation error when project site submitted without neighborhood
  it('validates that project sites require nbhd_id', () => {
    const mockOnDeploy = vi.fn();
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} onDeploy={mockOnDeploy} />
      </BrowserRouter>
    );

    // Fill in required fields
    const titleInput = screen.getByLabelText(/Site Title/);
    const authorInput = screen.getByLabelText(/Author Name/);

    act(() => {
      fireEvent.change(titleInput, { target: { value: 'My Blog' } });
      fireEvent.change(authorInput, { target: { value: 'John Doe' } });
    });

    // Select project type
    const projectRadio = screen.getByLabelText(/Project Site/);
    act(() => {
      fireEvent.click(projectRadio);
    });

    // Try to deploy without selecting neighborhood
    const deployButton = screen.getByRole('button', { name: /deploy/i });
    act(() => {
      fireEvent.click(deployButton);
    });

    // Should show validation error (get all and check at least one exists)
    const errors = screen.queryAllByText(/Neighborhood is required/);
    expect(errors.length).toBeGreaterThan(0);

    // Should not call deploy
    expect(mockOnDeploy).not.toHaveBeenCalled();
  });

  // [ ] Form submission includes site_type and nbhd_id for project sites
  it('passes site_type and nbhd_id to onDeploy for project sites', () => {
    const mockOnDeploy = vi.fn().mockResolvedValue({});
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} onDeploy={mockOnDeploy} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText(/Site Title/);
    const authorInput = screen.getByLabelText(/Author Name/);

    act(() => {
      fireEvent.change(titleInput, { target: { value: 'My Blog' } });
      fireEvent.change(authorInput, { target: { value: 'John Doe' } });
    });

    // Select project type
    const projectRadio = screen.getByLabelText(/Project Site/);
    act(() => {
      fireEvent.click(projectRadio);
    });

    // Select neighborhood
    const nbhdSelect = screen.getByLabelText(/Neighborhood/);
    act(() => {
      fireEvent.change(nbhdSelect, { target: { value: 'nbhd-1' } });
    });

    // Deploy
    const deployButton = screen.getByRole('button', { name: /deploy/i });
    act(() => {
      fireEvent.click(deployButton);
    });

    expect(mockOnDeploy).toHaveBeenCalledWith(expect.objectContaining({
      site_type: 'project',
      nbhd_id: 'nbhd-1'
    }));
  });

  // [ ] Form submission includes site_type for personal sites
  it('passes site_type and null nbhd_id to onDeploy for personal sites', () => {
    const mockOnDeploy = vi.fn().mockResolvedValue({});
    render(
      <BrowserRouter>
        <SiteConfigForm template={mockTemplate} onDeploy={mockOnDeploy} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText(/Site Title/);
    const authorInput = screen.getByLabelText(/Author Name/);

    act(() => {
      fireEvent.change(titleInput, { target: { value: 'My Blog' } });
      fireEvent.change(authorInput, { target: { value: 'John Doe' } });
    });

    // Personal is already selected, deploy
    const deployButton = screen.getByRole('button', { name: /deploy/i });
    act(() => {
      fireEvent.click(deployButton);
    });

    expect(mockOnDeploy).toHaveBeenCalledWith(expect.objectContaining({
      site_type: 'personal',
      nbhd_id: null
    }));
  });
});

# Web Dashboard Approval Board Implementation Guide

## Overview
A complete Jira-style approval board has been implemented for the TreeMapper web dashboard. The board allows admins to manage intervention approvals with a kanban-style interface, comments, and full audit trails.

## Features Implemented

### 1. Kanban Board UI
- **4 Columns**: New Request → In Review → Approved → Rejected
- **Color-coded**: Orange (New), Blue (In Review), Green (Approved), Red (Rejected)
- **Responsive Cards**: Show key intervention information at a glance
- **Desktop-optimized**: Not responsive for small screens (as requested)

### 2. Intervention Cards
Each card displays:
- Intervention ID (#HID)
- Intervention type (formatted)
- Tree count and area
- Creator name
- Comment count badge
- Image indicator
- Submission timestamp
- Approver name (if approved)

### 3. Permissions
- **Admins/Owners**: Full access - can approve, reject, move to review, add comments
- **Contributors**: Can view their own interventions and add public comments
- **Observers**: Read-only access to their own interventions

### 4. Modals

#### Intervention Details Modal
- Full intervention information with image display
- Intervention metadata (creator, dates, tree count, area)
- Approval history timeline with action badges
- Quick action buttons (Approve/Reject/Review)
- Comment form with internal/public toggle

### 5. Status Flow
```
New Request → In Review → Approved
                ↓
             Rejected
```
- Contributors' interventions start as "new_request"
- Admins' interventions are auto-approved
- Admins can move interventions between any status
- Rejected interventions can be moved back to "in_review"

## Files Created

### Shared Core (Packages)
**Types:**
- `packages/shared-core/types/approval.types.ts` - TypeScript interfaces

**API Layer:**
- `packages/shared-core/fetchApi/api.url.ts` - Updated with approval endpoints
- `packages/shared-core/fetchApi/api.fetch.ts` - API function implementations

**State Management:**
- `packages/shared-core/store/useApprovalStore.ts` - Zustand store for approvals

### Web Dashboard (apps/web)
**Page:**
- `apps/web/src/app/dashboard/approvals/page.tsx` - Main approval board page

**Components:**
- `apps/web/src/app/dashboard/approvals/component/ApprovalBoard.tsx` - Main board layout
- `apps/web/src/app/dashboard/approvals/component/ApprovalColumn.tsx` - Kanban column
- `apps/web/src/app/dashboard/approvals/component/ApprovalCard.tsx` - Individual intervention card
- `apps/web/src/app/dashboard/approvals/component/ApprovalModal.tsx` - Details modal
- `apps/web/src/app/dashboard/approvals/component/ApprovalFilters.tsx` - Search and filters

**Navigation:**
- `apps/web/src/component/header/LabelTabs.tsx` - Updated with Approvals tab

## Technology Stack

### UI Components
- **Shadcn UI**: Pre-built accessible components
  - Dialog (modal)
  - Button
  - Card
  - Badge
  - Input
  - Select
  - Textarea
  - Checkbox
  - Label
  - Alert

### Icons
- **Lucide React**: Icon library
  - CheckCircle2, XCircle, Eye, MessageSquare
  - User, Calendar, ImageIcon, Search
  - Loader2, AlertCircle, Info, RotateCcw

### Styling
- **Tailwind CSS v4**: Utility-first CSS
- **Color Palette**:
  - Primary Green: `#007A49`
  - Status Colors: Amber, Blue, Green, Red

### State Management
- **Zustand**: Lightweight state management
- **React Hooks**: useState, useEffect for local state

### Date Formatting
- **date-fns**: Date formatting utilities

## API Endpoints Used

### GET Endpoints
```typescript
GET /interventions/approval/board?projectId={id}&status={status}&userId={id}
GET /interventions/approval/projects/{projectId}/requires-approval
```

### POST Endpoints
```typescript
POST /interventions/approval/move-status
Body: { interventionId, newStatus, comment?, isInternal? }

POST /interventions/approval/comment
Body: { interventionId, comment, isInternal? }
```

## Component Structure

```
apps/web/src/app/dashboard/approvals/
├── page.tsx                         # Main page with project check
├── component/
│   ├── ApprovalBoard.tsx            # Board container with API calls
│   ├── ApprovalColumn.tsx           # Column with interventions
│   ├── ApprovalCard.tsx             # Card UI component
│   ├── ApprovalModal.tsx            # Details and actions modal
│   └── ApprovalFilters.tsx          # Search and filter controls
```

## How to Use

### For Users
1. Navigate to the dashboard
2. Select a project
3. Click "Approvals" tab
4. View interventions organized by status
5. Click a card to view details

### For Admins
1. Click intervention card to open details modal
2. Review intervention information and history
3. Use action buttons:
   - **Review**: Move to "In Review" status
   - **Approve**: Approve the intervention
   - **Reject**: Reject with required comment
4. Add comments (toggle "Internal Comment" for admin-only notes)
5. View full audit trail in history section

### Project Setup
- Projects need to enable approval workflow via backend
- When disabled, page shows "Approval workflow not enabled" message
- Contributors automatically see only their own interventions

## Zustand Store API

```typescript
interface ApprovalStore {
  approvals: InterventionApprovalData[]
  selectedApproval: InterventionApprovalData | null
  loading: boolean
  error: string | null
  requiresApproval: boolean

  setApprovals: (approvals) => void
  selectApproval: (approval) => void
  updateApprovalStatus: (id, newStatus) => void
  updateApproval: (approval) => void
  setLoading: (loading) => void
  setError: (error) => void
  setRequiresApproval: (requires) => void
  clearApprovals: () => void
}
```

## Workflow Examples

### Approving an Intervention
1. Click intervention card
2. Modal opens with full details
3. Click "Approve" button
4. Optionally add comment
5. Toggle "Internal Comment" if needed
6. Click "Submit"
7. Status updates immediately (optimistic)
8. Server confirms update

### Rejecting an Intervention
1. Click intervention card
2. Click "Reject" button
3. **Must add comment** explaining rejection
4. Can mark as internal comment
5. Click "Submit"
6. Contributor receives feedback (if public comment)

### Moving to Review
1. Click intervention card
2. Click "Review" button
3. Add optional comment
4. Status moves to "In Review"

## Design Patterns

### Color System
```css
/* Status Colors */
New Request: #F59E0B (Amber)
In Review:   #3B82F6 (Blue)
Approved:    #10B981 (Green)
Rejected:    #EF4444 (Red)

/* UI Colors */
Primary:     #007A49 (TreeMapper Green)
Background:  #F9FAFB (Gray 50)
Border:      #E5E7EB (Gray 200)
Text:        #111827 (Gray 900)
```

### Card Layout
```tsx
<Card className="p-4 mb-3 cursor-pointer hover:shadow-md transition-all">
  <Header /> {/* ID + Badges */}
  <Title />  {/* Intervention Type */}
  <Metrics /> {/* Trees + Area */}
  <Footer /> {/* Creator + Comments */}
  <Badges /> {/* Approver */}
</Card>
```

### Modal Sections
```tsx
<Dialog>
  <Header />        {/* Title */}
  <Image />         {/* Optional intervention image */}
  <Overview />      {/* Metadata grid */}
  <Description />   {/* Text description */}
  <ApprovalInfo />  {/* Approval status banner */}
  <History />       {/* Timeline of changes */}
  <CommentForm />   {/* Conditional form */}
  <Actions />       {/* Button grid */}
</Dialog>
```

## Optimistic Updates

The app uses optimistic UI updates for better UX:

```typescript
// 1. Update local state immediately
updateApprovalStatus(interventionId, newStatus)

// 2. Make API call
const response = await moveInterventionStatus(...)

// 3. Update with server data or revert on error
if (success) {
  updateApproval(response.data)
} else {
  await loadApprovals() // Revert
}
```

## Notes

### Authentication
- Uses Auth0 via `useToken()` context
- Access token passed to all API calls
- Role-based UI rendering

### Project Context
- Uses `useProjectStore` for selected project
- Auto-checks if approval workflow is enabled
- Redirects or shows message if disabled

### Error Handling
- API errors displayed in Alert component
- Failed operations revert to previous state
- Clear error messages for users

### Performance
- Zustand for efficient state updates
- Optimistic updates for instant feedback
- Minimal re-renders with focused selectors

## Future Enhancements

Potential features to add:

### Drag-and-Drop
**Install @dnd-kit:**
```bash
cd apps/web
yarn add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Implementation:**
```tsx
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'

const ApprovalBoard = () => {
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      moveInterventionToColumn(active.id, over.id)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {columns.map(column => (
        <SortableContext key={column.id} items={column.items}>
          <ApprovalColumn column={column} />
        </SortableContext>
      ))}
    </DndContext>
  )
}
```

### Additional Features
- **Bulk Actions**: Select multiple interventions for batch approval/rejection
- **Advanced Filters**: Date range, creator, intervention type
- **Export**: CSV download of approval history
- **Real-time Updates**: WebSocket notifications for status changes
- **Email Notifications**: Notify users of status changes
- **Data Editing**: Allow admins to edit intervention data
- **Revision Workflow**: Add "Needs Revision" status with revision requests
- **Analytics**: Dashboard showing approval metrics and trends
- **Comments**: Threaded replies and @mentions
- **Attachments**: File uploads in comments

## Dependencies

All dependencies are already installed:
- **react**: UI framework
- **next**: Next.js framework
- **zustand**: State management
- **date-fns**: Date formatting
- **lucide-react**: Icons
- **@radix-ui**: Headless UI components (via Shadcn)
- **tailwindcss**: Styling

## Troubleshooting

### "Approval workflow not enabled"
- Check project settings in backend
- Ensure `requiresInterventionApproval` is true
- Admin must enable via API or settings page

### Cards not loading
- Check browser console for errors
- Verify API endpoint is accessible
- Check authentication token is valid

### Status changes not working
- Verify user has admin/owner role
- Check network tab for API errors
- Ensure backend approval endpoints are working

### Modal not opening
- Check if intervention data is loaded
- Verify `selectedApproval` state is set
- Look for console errors

## Browser Support

Tested and optimized for:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

**Not optimized for:**
- Mobile browsers (as requested)
- Small screens (<768px)

## Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Focus management in modals
- Color contrast meets WCAG AA standards
- Screen reader friendly

## Summary

The Web Approval Board is a complete, production-ready feature that:
- ✅ Integrates seamlessly with existing dashboard
- ✅ Uses established patterns and components
- ✅ Provides excellent UX with optimistic updates
- ✅ Supports role-based access control
- ✅ Includes comprehensive error handling
- ✅ Ready for drag-and-drop enhancement
- ✅ Desktop-optimized (no mobile responsiveness)

Navigate to `/dashboard/approvals` to view the board!

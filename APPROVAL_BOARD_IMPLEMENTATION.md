# Approval Board Implementation Guide

## Overview
A complete Jira-style approval board has been implemented for the TreeMapper mobile app. The board allows admins to manage intervention approvals with drag-and-drop functionality, comments, and full audit trails.

## Features Implemented

### 1. Board UI (Jira-Style)
- **4 Columns**: New Request → In Review → Approved → Rejected
- **Drag & Drop**: Cards can be dragged between columns (visual only, actual updates via API)
- **Real-time Updates**: Optimistic UI updates with server confirmation
- **Pull to Refresh**: Swipe down to reload board data

### 2. Intervention Cards
Each card displays:
- Intervention ID (#HID)
- Intervention type
- Tree count and area
- Creator name
- Submission timestamp
- Comment count
- Image indicator
- Approver name (if approved)

### 3. Permissions
- **Admins/Owners**: Full access - can approve, reject, move to review, add comments
- **Contributors**: Can view their own interventions and add public comments
- **Observers**: Read-only access to their own interventions

### 4. Modals

#### Intervention Details Modal
- Full intervention information
- Image display (if available)
- Intervention metadata
- Approval history timeline
- Quick action buttons (Approve/Reject/Review)

#### Comment Modal
- Add comments when changing status
- Toggle for internal comments (admin only)
- Required comment when rejecting
- View previous comments with internal/public indicators
- Full comment history

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

### API Layer
- `src/api/approval.api.ts` - API integration functions
- `src/api/api.url.ts` - Updated with approval endpoints

### State Management
- `src/store/slice/approvalBoardSlice.ts` - Redux slice for approval board
- `src/store/index.ts` - Updated to include approval board reducer

### Types
- `src/types/type/approval.type.ts` - TypeScript interfaces for approval data

### Components
- `src/components/approvalBoard/ApprovalBoardCard.tsx` - Individual intervention card
- `src/components/approvalBoard/ApprovalBoardColumn.tsx` - Kanban-style column with drag-drop
- `src/components/approvalBoard/CommentModal.tsx` - Comment and status change modal
- `src/components/approvalBoard/InterventionDetailsModal.tsx` - Full intervention details

### Screens
- `src/screens/ApprovalBoardView.tsx` - Main approval board screen

### Navigation
- `src/navigation/BottomTabStack.tsx` - Updated with ApprovalBoard tab
- `src/types/type/navigation.type.ts` - Updated navigation types
- `src/components/bottomTab/BottomTabIcon.tsx` - Updated for 5 tabs
- `assets/images/svg/ApprovalTabIcon.svg` - New tab icon

## API Endpoints Used

### GET Endpoints
```
GET /interventions/approval/board?projectId={id}&status={status}&userId={id}
GET /interventions/approval/projects/{projectId}/requires-approval
```

### POST Endpoints
```
POST /interventions/approval/move-status
Body: { interventionId, newStatus, comment?, isInternal? }

POST /interventions/approval/comment
Body: { interventionId, comment, isInternal? }
```

## Backend Schema Changes
The backend has the following fields in the intervention table:
- `approvalStatus` - Current approval state (enum)
- `approvedById` - Who approved it
- `approvedAt` - Approval timestamp
- `rejectedAt` - Rejection timestamp
- `submittedForReviewAt` - Review submission timestamp
- `approvalComments` - JSONB array of comments
- `approvalHistory` - JSONB array of status changes

## How to Use

### For Users
1. Open the TreeMapper app
2. Tap on the "Approvals" tab (4th tab from left)
3. View all interventions organized by status
4. Tap a card to view details
5. Long press a card to drag it (visual feedback only)

### For Admins
1. Tap a card to open details
2. Use quick action buttons or drag cards
3. Add comments when changing status
4. Toggle "Internal Comment" for admin-only notes
5. View full history timeline

### Project Setup
Projects need to enable approval workflow:
- Admins can enable via backend API
- When disabled, board shows "Approval workflow not enabled"

## Workflow Examples

### Approving an Intervention
1. Tap intervention card
2. Review details and images
3. Tap "Approve" button
4. Optionally add comment
5. Status updates immediately (optimistic)
6. Server confirms update

### Rejecting an Intervention
1. Tap intervention card
2. Tap "Reject" button
3. **Must add comment** explaining rejection
4. Can mark as internal comment
5. Contributor receives feedback

### Moving to Review
1. Tap "Review" button on new request
2. Add optional comment
3. Status moves to "In Review"

## Notes

### Optimistic Updates
The app uses optimistic UI updates:
- Status changes happen immediately in the UI
- Server request happens in background
- If server fails, board reloads to show correct state

### Comment System
- Public comments visible to all project members
- Internal comments only visible to admins/owners
- Comments attached to status changes
- Full history preserved

### Performance
- Board loads all interventions for current project
- Can filter by status using query params
- Contributors automatically filtered to their own interventions
- Pull-to-refresh for manual updates

### Accessibility
- All buttons have proper labels
- Color coding for status (Orange/Blue/Green/Red)
- Clear visual hierarchy
- Touch targets meet accessibility guidelines

## Dependencies
- `react-native-draggable-flatlist` (v4.0.3) - Already installed
- `date-fns` - For date formatting
- `@reduxjs/toolkit` - State management
- React Navigation - Tab navigation

## Future Enhancements
Potential features to add:
- Push notifications for status changes
- Batch approval/rejection
- Advanced filters (date range, user, type)
- Export approval reports
- Email notifications
- Revision workflow (needs_revision status)
- Data editing for admins
- Image annotation for feedback

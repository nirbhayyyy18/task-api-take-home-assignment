# Submission Notes

## What I Tested

### Service Layer
- Task creation with required and optional fields
- Default values
- ID and timestamp generation
- Finding tasks by ID
- Getting all tasks
- Filtering tasks by status
- Pagination
- Task statistics
- Overdue task calculation
- Updating tasks
- Removing tasks
- Completing tasks
- Assigning tasks

### API Layer
- GET /tasks
- GET /tasks/stats
- GET /tasks?status=...
- GET /tasks?page=...&limit=...
- POST /tasks
- PUT /tasks/:id
- DELETE /tasks/:id
- PATCH /tasks/:id/complete
- PATCH /tasks/:id/assign

### Edge Cases
- Non-existent task IDs
- Missing title
- Invalid status
- Empty assignee
- Whitespace-only assignee
- Pagination beyond available tasks
- Non-existent task updates/deletions/completion
- Empty task collection

## Bugs Found and Fixed

1. Status filtering used partial matching instead of exact matching.
2. Pagination skipped the first page because of an incorrect offset calculation.
3. Completing a task unexpectedly changed its priority to `medium`.

All three bugs were exposed through automated tests and fixed.

## Coverage

Coverage command:

`npm run coverage`

Final result:

```text
Test Suites: 2 passed, 2 total
Tests:       45 passed, 45 total
Snapshots:   0 total

% Stmts: 94.03
% Branch: 84.33
% Funcs: 93.10
% Lines: 93.43

The project meets the required 80%+ coverage target.


## What I Would Test Next

- Invalid pagination values such as negative page numbers and limits
- Very large pagination limits
- Invalid date formats
- Additional validation for task fields
- Concurrent requests
- API behavior with malformed JSON
- Unexpected server/service errors
- Duplicate or repeated task assignments

## Surprises / Observations

The existing service implementation had several logic issues that were not immediately obvious from the API surface. Writing focused unit tests helped expose incorrect status filtering, pagination behavior, and an unexpected priority change during task completion.

The API also had no existing automated tests initially, so integration tests were added to verify both successful requests and error responses.

## Questions Before Production

- Should pagination reject invalid or negative page/limit values instead of falling back to defaults?
- Should assigning a task that is already assigned be allowed?
- Should an assignee be represented by a user ID rather than a plain string?
- What authentication and authorization rules should be applied to task operations?
- What database should replace the current in-memory task storage?
- What logging and monitoring should be added for production errors?
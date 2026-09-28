# Bug Report

## Bug 1 — Status filtering uses partial matching

### Location

`src/services/taskService.js`

Function: `getByStatus()`

### Expected behavior

The status filter should return only tasks whose status exactly matches the requested status.

For example:

- `status=todo` should return only `todo` tasks.
- `status=done` should return only `done` tasks.
- `status=do` should not match either `todo` or `done`.

### Actual behavior

The implementation uses:

```js
t.status.includes(status)

This performs a partial string match instead of an exact status comparison.

As a result, requesting status=do returns both todo and done tasks.

How I discovered it

I wrote a unit test that creates one todo task and one done task, then calls:

taskService.getByStatus('do')

The test expected an empty array, but both tasks were returned.

Why it is a bug

The API defines status values as discrete values:

todo
in_progress
done

A status filter should therefore perform an exact comparison rather than a substring comparison.

Suggested fix

Change:

const getByStatus = (status) => tasks.filter((t) => t.status.includes(status));

to:

const getByStatus = (status) => tasks.filter((t) => t.status === status);
Test that exposed the bug
test('should match the exact status value', () => {
  taskService.create({
    title: 'Todo task',
    status: 'todo',
  });

  taskService.create({
    title: 'Done task',
    status: 'done',
  });

  const tasks = taskService.getByStatus('do');

  expect(tasks).toEqual([]);
});


## Bug 2 — Pagination skips the first page

### Location

`src/services/taskService.js`

Function: `getPaginated()`

### Expected behavior

Pagination uses 1-based page numbers.

For example, with 5 tasks and a limit of 2:

- `Page 1` should return Task 1 and Task 2.
- `Page 2` should return Task 3 and Task 4.
- `Page 3` should return Task 5.

### Actual behavior

The implementation calculates the offset as:

```js
const offset = page * limit;

This causes page 1 to start from index 2 instead of index 0 when the limit is 2.

As a result:

Page 1 returns Task 3 and Task 4.
Page 2 returns only Task 5.
How I discovered it

I wrote pagination tests for the first and second pages.

The first-page test expected Task 1 and Task 2 but received Task 3 and Task 4.

The second-page test expected Task 3 and Task 4 but received only Task 5.

Why it is a bug

The API uses 1-based page numbers, while JavaScript arrays use 0-based indexes.

The offset should therefore subtract one page before multiplying by the limit.

Suggested fix

Change:

const offset = page * limit;

to:

const offset = (page - 1) * limit;
Tests that exposed the bug
test('should return the first page correctly', () => {
  taskService.create({ title: 'Task 1' });
  taskService.create({ title: 'Task 2' });
  taskService.create({ title: 'Task 3' });
  taskService.create({ title: 'Task 4' });
  taskService.create({ title: 'Task 5' });

  const tasks = taskService.getPaginated(1, 2);

  expect(tasks).toHaveLength(2);
  expect(tasks[0].title).toBe('Task 1');
  expect(tasks[1].title).toBe('Task 2');
});

test('should return the second page correctly', () => {
  taskService.create({ title: 'Task 1' });
  taskService.create({ title: 'Task 2' });
  taskService.create({ title: 'Task 3' });
  taskService.create({ title: 'Task 4' });
  taskService.create({ title: 'Task 5' });

  const tasks = taskService.getPaginated(2, 2);

  expect(tasks).toHaveLength(2);
  expect(tasks[0].title).toBe('Task 3');
  expect(tasks[1].title).toBe('Task 4');
});

## Bug 3 — Completing a task unexpectedly changes its priority

### Location

`src/services/taskService.js`

Function: `completeTask()`

### Expected behavior

Completing a task should change its status to `done` and set `completedAt`, while preserving the task's existing priority.

For example, a task with:

```text
priority = high

should still have:

priority = high

after completion.

Actual behavior

The original implementation explicitly changed the priority to medium:

const updated = {
  ...task,
  priority: 'medium',
  status: 'done',
  completedAt: new Date().toISOString(),
};

As a result, completing a high-priority task changed its priority from high to medium.

How I discovered it

I wrote a unit test that creates a task with priority: 'high', completes the task, and checks that the priority remains high.

The test initially failed:

Expected: "high"
Received: "medium"
Why it is a bug

The complete operation is responsible for changing the task's completion state. It should not unexpectedly overwrite an existing priority value.

Suggested fix

Change:

const updated = {
  ...task,
  priority: 'medium',
  status: 'done',
  completedAt: new Date().toISOString(),
};

to:

const updated = {
  ...task,
  status: 'done',
  completedAt: new Date().toISOString(),
};
Test that exposed the bug
test('should preserve the task priority when completing it', () => {
  const task = taskService.create({
    title: 'High priority task',
    priority: 'high',
  });

  const completedTask = taskService.completeTask(task.id);

  expect(completedTask.priority).toBe('high');
});
const taskService = require('../src/services/taskService');

describe('taskService.create', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('should create a task with the provided title', () => {
    const task = taskService.create({
      title: 'Write tests',
    });

    expect(task.title).toBe('Write tests');
  });

  test('should apply default values when optional fields are not provided', () => {
    const task = taskService.create({
      title: 'Write tests',
    });

    expect(task.description).toBe('');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.dueDate).toBeNull();
    expect(task.completedAt).toBeNull();
  });

  test('should generate an id and createdAt for a new task', () => {
  const task = taskService.create({
    title: 'Write tests',
  });

  expect(task.id).toEqual(expect.any(String));
  expect(task.id).not.toBe('');

  expect(task.createdAt).toEqual(expect.any(String));
  expect(new Date(task.createdAt).toString()).not.toBe('Invalid Date');
  });
});

describe('taskService.findById', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('should return a task when the id exists', () => {
    const createdTask = taskService.create({
      title: 'Find this task',
    });

    const task = taskService.findById(createdTask.id);

    expect(task).toEqual(createdTask);
  });

  test('should return undefined when the id does not exist', () => {
    const task = taskService.findById('non-existent-id');

    expect(task).toBeUndefined();
  });
});

describe('taskService.getAll', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('should return all created tasks', () => {
    const task1 = taskService.create({
      title: 'Task 1',
    });

    const task2 = taskService.create({
      title: 'Task 2',
    });

    const tasks = taskService.getAll();

    expect(tasks).toHaveLength(2);
    expect(tasks).toEqual([task1, task2]);
  });

  test('should return an empty array when there are no tasks', () => {
    const tasks = taskService.getAll();

    expect(tasks).toEqual([]);
  });
});

describe('taskService.getByStatus', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('should return tasks matching the given status', () => {
    const todoTask = taskService.create({
      title: 'Todo task',
      status: 'todo',
    });

    taskService.create({
      title: 'Done task',
      status: 'done',
    });

    const tasks = taskService.getByStatus('todo');

    expect(tasks).toEqual([todoTask]);
  });

  test('should return an empty array when no task matches the status', () => {
    taskService.create({
      title: 'Todo task',
      status: 'todo',
    });

    const tasks = taskService.getByStatus('done');

    expect(tasks).toEqual([]);
  });

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
});

describe('taskService.getPaginated', () => {
  beforeEach(() => {
    taskService._reset();
  });

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

  test('should return an empty array when the page is beyond the available tasks', () => {
    taskService.create({ title: 'Task 1' });
    taskService.create({ title: 'Task 2' });

    const tasks = taskService.getPaginated(3, 2);

    expect(tasks).toEqual([]);
  });
});

describe('taskService.getStats', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('should return zero counts when there are no tasks', () => {
    const stats = taskService.getStats();

    expect(stats).toEqual({
      todo: 0,
      in_progress: 0,
      done: 0,
      overdue: 0,
    });
  });

  test('should count tasks by status', () => {
    taskService.create({
      title: 'Todo 1',
      status: 'todo',
    });

    taskService.create({
      title: 'Todo 2',
      status: 'todo',
    });

    taskService.create({
      title: 'In progress',
      status: 'in_progress',
    });

    taskService.create({
      title: 'Done',
      status: 'done',
    });

    const stats = taskService.getStats();

    expect(stats.todo).toBe(2);
    expect(stats.in_progress).toBe(1);
    expect(stats.done).toBe(1);
  });

  test('should count overdue incomplete tasks', () => {
    taskService.create({
      title: 'Overdue task',
      status: 'todo',
      dueDate: '2020-01-01T00:00:00.000Z',
    });

    const stats = taskService.getStats();

    expect(stats.overdue).toBe(1);
  });

  test('should not count completed overdue tasks as overdue', () => {
    taskService.create({
      title: 'Completed overdue task',
      status: 'done',
      dueDate: '2020-01-01T00:00:00.000Z',
    });

    const stats = taskService.getStats();

    expect(stats.overdue).toBe(0);
  });

  test('should not count future due dates as overdue', () => {
    taskService.create({
      title: 'Future task',
      status: 'todo',
      dueDate: '2099-01-01T00:00:00.000Z',
    });

    const stats = taskService.getStats();

    expect(stats.overdue).toBe(0);
  });
});

describe('taskService.update', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('should update an existing task', () => {
    const task = taskService.create({
      title: 'Old title',
      priority: 'low',
    });

    const updatedTask = taskService.update(task.id, {
      title: 'New title',
      priority: 'high',
    });

    expect(updatedTask.title).toBe('New title');
    expect(updatedTask.priority).toBe('high');
    expect(updatedTask.id).toBe(task.id);
  });

  test('should preserve fields that are not updated', () => {
    const task = taskService.create({
      title: 'Original title',
      description: 'Original description',
      priority: 'high',
    });

    const updatedTask = taskService.update(task.id, {
      title: 'Updated title',
    });

    expect(updatedTask.title).toBe('Updated title');
    expect(updatedTask.description).toBe('Original description');
    expect(updatedTask.priority).toBe('high');
  });

  test('should return null when the task does not exist', () => {
    const updatedTask = taskService.update('non-existent-id', {
      title: 'Updated title',
    });

    expect(updatedTask).toBeNull();
  });
});

describe('taskService.remove', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('should remove an existing task', () => {
    const task = taskService.create({
      title: 'Task to remove',
    });

    const result = taskService.remove(task.id);

    expect(result).toBe(true);
    expect(taskService.findById(task.id)).toBeUndefined();
  });

  test('should return false when the task does not exist', () => {
    const result = taskService.remove('non-existent-id');

    expect(result).toBe(false);
  });
});


describe('taskService.completeTask', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('should mark an existing task as completed', () => {
    const task = taskService.create({
      title: 'Complete this task',
      status: 'todo',
    });

    const completedTask = taskService.completeTask(task.id);

    expect(completedTask.status).toBe('done');
    expect(completedTask.completedAt).toEqual(expect.any(String));
  });

  test('should return null when the task does not exist', () => {
    const result = taskService.completeTask('non-existent-id');

    expect(result).toBeNull();
  });

  test('should preserve the task priority when completing it', () => {
    const task = taskService.create({
      title: 'High priority task',
      priority: 'high',
    });

    const completedTask = taskService.completeTask(task.id);

    expect(completedTask.priority).toBe('high');
  });
});
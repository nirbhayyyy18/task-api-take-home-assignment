const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    test('should return all tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const response = await request(app)
        .get('/tasks');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test('should return empty array when there are no tasks', async () => {
      const response = await request(app)
        .get('/tasks');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should filter tasks by status', async () => {
      taskService.create({
        title: 'Todo task',
        status: 'todo',
      });

      taskService.create({
        title: 'Done task',
        status: 'done',
      });

      const response = await request(app)
        .get('/tasks?status=todo');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('todo');
    });

    test('should return paginated tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService.create({ title: 'Task 3' });

      const response = await request(app)
        .get('/tasks?page=1&limit=2');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Task 1');
      expect(response.body[1].title).toBe('Task 2');
    });
  });


  describe('GET /tasks/stats', () => {
    test('should return task statistics', async () => {
      taskService.create({ title: 'Todo', status: 'todo' });
      taskService.create({ title: 'Done', status: 'done' });

      const response = await request(app)
        .get('/tasks/stats');

      expect(response.statusCode).toBe(200);
      expect(response.body.todo).toBe(1);
      expect(response.body.done).toBe(1);
      expect(response.body.in_progress).toBe(0);
      expect(response.body.overdue).toBe(0);
    });
  });


  describe('POST /tasks', () => {
    test('should create a new task', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'New task',
          description: 'Test description',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.title).toBe('New task');
      expect(response.body.id).toEqual(expect.any(String));
    });

    test('should reject request when title is missing', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          description: 'No title',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });

    test('should reject invalid status', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Invalid task',
          status: 'invalid',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });
  });


  describe('PUT /tasks/:id', () => {
    test('should update an existing task', async () => {
      const task = taskService.create({
        title: 'Old title',
      });

      const response = await request(app)
        .put(`/tasks/${task.id}`)
        .send({
          title: 'Updated title',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.title).toBe('Updated title');
      expect(response.body.id).toBe(task.id);
    });

    test('should return 404 for a non-existent task', async () => {
      const response = await request(app)
        .put('/tasks/non-existent-id')
        .send({
          title: 'Updated title',
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('should reject invalid update data', async () => {
      const task = taskService.create({
        title: 'Existing task',
      });

      const response = await request(app)
        .put(`/tasks/${task.id}`)
        .send({
          status: 'invalid',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
    });
  });


  describe('DELETE /tasks/:id', () => {
    test('should delete an existing task', async () => {
      const task = taskService.create({
        title: 'Delete me',
      });

      const response = await request(app)
        .delete(`/tasks/${task.id}`);

      expect(response.statusCode).toBe(204);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    test('should return 404 when task does not exist', async () => {
      const response = await request(app)
        .delete('/tasks/non-existent-id');

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });


  describe('PATCH /tasks/:id/complete', () => {
    test('should complete an existing task', async () => {
      const task = taskService.create({
        title: 'Complete me',
        status: 'todo',
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}/complete`);

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('done');
      expect(response.body.completedAt).toEqual(expect.any(String));
    });

    test('should return 404 when task does not exist', async () => {
      const response = await request(app)
        .patch('/tasks/non-existent-id/complete');

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });
});

describe('PATCH /tasks/:id/assign', () => {
  test('should assign a task to an assignee', async () => {
    const task = taskService.create({
      title: 'Assign this task',
    });

    const response = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({
        assignee: 'Nirbhay',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(task.id);
    expect(response.body.assignee).toBe('Nirbhay');
  });

  test('should return 404 when task does not exist', async () => {
    const response = await request(app)
      .patch('/tasks/non-existent-id/assign')
      .send({
        assignee: 'Nirbhay',
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  test('should reject an empty assignee', async () => {
    const task = taskService.create({
      title: 'Assign this task',
    });

    const response = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({
        assignee: '',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Assignee is required');
  });

  test('should reject a whitespace-only assignee', async () => {
    const task = taskService.create({
      title: 'Assign this task',
    });

    const response = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({
        assignee: '   ',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Assignee is required');
  });
});
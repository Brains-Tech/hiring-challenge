import { TaskService } from '../services/TaskService';
import { Task, TaskStatus, TaskPriority, RecurrenceType } from '../models/Task';
import { DatabaseContext } from '../config/database-context';
import { TaskNotFoundError } from '../errors/TaskNotFoundError';
import { InvalidDataError } from '../errors/InvalidDataError';
import { Repository, QueryFailedError, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import dayjs from 'dayjs';

// Mock dependencies
jest.mock('../config/database-context');
jest.mock('typeorm');

describe('TaskService', () => {
  let taskService: TaskService;
  let mockTaskRepository: jest.Mocked<Repository<Task>>;
  
  // Sample task data for tests
  const sampleTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    dueDate: new Date('2025-05-15'),
    recurrenceType: RecurrenceType.NONE,
    recurrenceDates: ['2025-05-15'],
    createdAt: new Date('2025-05-01'),
    updatedAt: new Date('2025-05-01')
  };
  
  const sampleRecurringTask: Task = {
    id: '2',
    title: 'Recurring Task',
    description: 'Weekly Task',
    priority: TaskPriority.HIGH,
    status: TaskStatus.TODO,
    dueDate: new Date('2025-05-15'),
    recurrenceType: RecurrenceType.WEEKLY,
    recurrenceInterval: 1,
    recurrenceDates: ['2025-05-15', '2025-05-22', '2025-05-29'],
    createdAt: new Date('2025-05-01'),
    updatedAt: new Date('2025-05-01')
  };
  
  beforeEach(() => {
    // Setup mocks
    mockTaskRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      update: jest.fn()
    } as unknown as jest.Mocked<Repository<Task>>;
    
    // Mock the DatabaseContext.getInstance().getRepository to return our mock repository
    (DatabaseContext.getInstance as jest.Mock).mockReturnValue({
      getRepository: jest.fn().mockReturnValue(mockTaskRepository)
    });
    
    // Create the service instance
    taskService = new TaskService();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('findAll', () => {
    it('should return all tasks when no filters are provided', async () => {
      const tasks = [sampleTask, sampleRecurringTask];
      mockTaskRepository.find.mockResolvedValue(tasks);
      
      const result = await taskService.findAll();
      
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: {},
        order: {
          dueDate: 'ASC',
          createdAt: 'DESC'
        }
      });
      expect(result).toEqual(tasks);
    });
    
    it('should filter tasks by status', async () => {
      mockTaskRepository.find.mockResolvedValue([sampleTask]);
      
      await taskService.findAll({ status: TaskStatus.TODO });
      
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { status: TaskStatus.TODO },
        order: {
          dueDate: 'ASC',
          createdAt: 'DESC'
        }
      });
    });
    
    it('should filter tasks by priority', async () => {
      mockTaskRepository.find.mockResolvedValue([sampleRecurringTask]);
      
      await taskService.findAll({ priority: TaskPriority.HIGH });
      
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { priority: TaskPriority.HIGH },
        order: {
          dueDate: 'ASC',
          createdAt: 'DESC'
        }
      });
    });
    
    it('should filter tasks by date range', async () => {
      mockTaskRepository.find.mockResolvedValue([sampleTask, sampleRecurringTask]);
      const fromDate = new Date('2025-05-10');
      const toDate = new Date('2025-05-20');
      
      await taskService.findAll({ dueFrom: fromDate, dueTo: toDate });
      
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { dueDate: Between(fromDate, toDate) },
        order: {
          dueDate: 'ASC',
          createdAt: 'DESC'
        }
      });
    });
    
    it('should filter tasks by date from', async () => {
      mockTaskRepository.find.mockResolvedValue([sampleTask, sampleRecurringTask]);
      const fromDate = new Date('2025-05-10');
      
      await taskService.findAll({ dueFrom: fromDate });
      
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { dueDate: MoreThanOrEqual(fromDate) },
        order: {
          dueDate: 'ASC',
          createdAt: 'DESC'
        }
      });
    });
    
    it('should filter tasks by date to', async () => {
      mockTaskRepository.find.mockResolvedValue([sampleTask]);
      const toDate = new Date('2025-05-20');
      
      await taskService.findAll({ dueTo: toDate });
      
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { dueDate: LessThanOrEqual(toDate) },
        order: {
          dueDate: 'ASC',
          createdAt: 'DESC'
        }
      });
    });
  });
  
  describe('findById', () => {
    it('should return a task when it exists', async () => {
      mockTaskRepository.findOne.mockResolvedValue(sampleTask);
      
      const result = await taskService.findById('1');
      
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' }
      });
      expect(result).toEqual(sampleTask);
    });
    
    it('should throw TaskNotFoundError when task does not exist', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);
      
      await expect(taskService.findById('999')).rejects.toThrow(TaskNotFoundError);
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: '999' }
      });
    });
  });
  
  describe('create', () => {
    it('should create a non-recurring task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'New Description',
        priority: TaskPriority.LOW,
        status: TaskStatus.TODO,
        dueDate: new Date('2025-06-01'),
        recurrenceType: RecurrenceType.NONE
      };
      
      const createdTask = { ...taskData, id: '3', createdAt: new Date(), updatedAt: new Date() };
      
      mockTaskRepository.create.mockReturnValue(createdTask as Task);
      mockTaskRepository.save.mockResolvedValue(createdTask as Task);
      
      const result = await taskService.create(taskData);
      
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        ...taskData,
        recurrenceDates: ['2025-06-01']
      });
      expect(mockTaskRepository.save).toHaveBeenCalledWith(createdTask);
      expect(result).toEqual(createdTask);
    });
    
    it('should create a recurring task with occurrences', async () => {
      const taskData = {
        title: 'New Recurring Task',
        description: 'Weekly Task',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: new Date('2025-06-01'),
        recurrenceType: RecurrenceType.WEEKLY,
        recurrenceInterval: 1
      };
      
      const expectedDates = [
        '2025-06-01', '2025-06-08', '2025-06-15', 
        '2025-06-22', '2025-06-29', '2025-07-06'
      ];
      
      const createdTask = { 
        ...taskData, 
        id: '4', 
        recurrenceDates: expectedDates,
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      
      mockTaskRepository.create.mockReturnValue(createdTask as Task);
      mockTaskRepository.save.mockResolvedValue(createdTask as Task);
      
      // Mock for recurring task occurrences
      mockTaskRepository.find.mockResolvedValue([]);
      
      const result = await taskService.create(taskData);
      
      expect(mockTaskRepository.create).toHaveBeenCalled();
      expect(mockTaskRepository.save).toHaveBeenCalled();
      expect(result).toEqual(createdTask);
    });
    
    it('should handle errors during task creation', async () => {
      const taskData = {
        title: 'Invalid Task',
        status: TaskStatus.TODO
      };
      
      const error = new QueryFailedError('query', [], new Error('DB error'));
      mockTaskRepository.save.mockRejectedValue(error);
      
      await expect(taskService.create(taskData as any)).rejects.toThrow(InvalidDataError);
    });
  });
  
  describe('update', () => {
    it('should update a task', async () => {
      mockTaskRepository.findOne.mockResolvedValue(sampleTask);
      
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description'
      };
      
      const updatedTask = {
        ...sampleTask,
        ...updateData,
        updatedAt: expect.any(Date)
      };
      
      mockTaskRepository.save.mockResolvedValue(updatedTask as Task);
      
      const result = await taskService.update('1', updateData);
      
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' }
      });
      expect(mockTaskRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...sampleTask,
        ...updateData,
        updatedAt: expect.any(Date)
      }));
      expect(result).toEqual(updatedTask);
    });
    
    it('should recalculate recurrence dates when changing recurrence type', async () => {
      mockTaskRepository.findOne.mockResolvedValue(sampleTask);
      
      const updateData = {
        recurrenceType: RecurrenceType.WEEKLY,
        recurrenceInterval: 1
      };
      
      mockTaskRepository.save.mockImplementation(task => Promise.resolve(task as Task));
      
      const result = await taskService.update('1', updateData);
      
      expect(result.recurrenceDates).toBeDefined();
      expect(result.recurrenceDates!.length).toBeGreaterThan(1);
      expect(result.recurrenceType).toBe(RecurrenceType.WEEKLY);
    });
    
    it('should update future occurrences of a recurring task', async () => {
      mockTaskRepository.findOne.mockResolvedValue(sampleRecurringTask);
      
      const updateData = {
        title: 'Updated Recurring Task',
        recurrenceType: RecurrenceType.WEEKLY
      };
      
      const futureOccurrences = [
        { id: '2-1', title: 'Recurring Task', parentTaskId: '2', status: TaskStatus.TODO } as Task,
        { id: '2-2', title: 'Recurring Task', parentTaskId: '2', status: TaskStatus.TODO } as Task
      ];
      
      mockTaskRepository.find.mockResolvedValue(futureOccurrences);
      mockTaskRepository.save.mockImplementation(task => Promise.resolve(task as Task));
      
      await taskService.update('2', updateData);
      
      // Should update the main task
      expect(mockTaskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...sampleRecurringTask,
          title: 'Updated Recurring Task',
          updatedAt: expect.any(Date)
        })
      );
      
      // Should find and update future occurrences
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { 
          parentTaskId: '2',
          status: TaskStatus.TODO
        }
      });
      
      // Should save the updated occurrences
      expect(mockTaskRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '2-1',
            title: 'Updated Recurring Task',
          }),
          expect.objectContaining({
            id: '2-2',
            title: 'Updated Recurring Task',
          })
        ])
      );
    });
    
    it('should handle errors during task update', async () => {
      mockTaskRepository.findOne.mockResolvedValue(sampleTask);
      
      const error = new QueryFailedError('query', [], new Error('DB error'));
      mockTaskRepository.save.mockRejectedValue(error);
      
      await expect(taskService.update('1', { title: 'Error Task' })).rejects.toThrow(InvalidDataError);
    });
  });
  
  describe('delete', () => {
    it('should delete a non-recurring task', async () => {
      mockTaskRepository.findOne.mockResolvedValue(sampleTask);
      mockTaskRepository.remove.mockResolvedValue(sampleTask);
      
      await taskService.delete('1');
      
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' }
      });
      expect(mockTaskRepository.remove).toHaveBeenCalledWith(sampleTask);
      // Should not try to find future occurrences
      expect(mockTaskRepository.find).not.toHaveBeenCalled();
    });
    
    it('should delete a recurring task and its future occurrences', async () => {
      mockTaskRepository.findOne.mockResolvedValue(sampleRecurringTask);
      
      const futureOccurrences = [
        { id: '2-1', parentTaskId: '2' } as Task,
        { id: '2-2', parentTaskId: '2' } as Task
      ];
      
      mockTaskRepository.find.mockResolvedValue(futureOccurrences);
      mockTaskRepository.remove.mockResolvedValue(sampleRecurringTask);
      
      await taskService.delete('2');
      
      // Should find future occurrences
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { parentTaskId: '2' }
      });
      
      // Should remove future occurrences
      expect(mockTaskRepository.remove).toHaveBeenCalledWith(futureOccurrences);
      
      // Should remove the main task
      expect(mockTaskRepository.remove).toHaveBeenCalledWith(sampleRecurringTask);
    });
    
    it('should handle errors during task deletion', async () => {
      mockTaskRepository.findOne.mockResolvedValue(sampleTask);
      
      const error = new Error('Deletion error');
      mockTaskRepository.remove.mockRejectedValue(error);
      
      await expect(taskService.delete('1')).rejects.toThrow(InvalidDataError);
    });
  });
  
  describe('status change methods', () => {
    beforeEach(() => {
      // Mock update method
      jest.spyOn(taskService, 'update').mockImplementation((id, data) => {
        return Promise.resolve({
          ...sampleTask,
          ...data,
          id,
          updatedAt: new Date()
        } as Task);
      });
    });
    
    it('should complete a task', async () => {
      const result = await taskService.completeTask('1');
      
      expect(taskService.update).toHaveBeenCalledWith('1', { status: TaskStatus.COMPLETED });
      expect(result.status).toBe(TaskStatus.COMPLETED);
    });
    
    it('should start a task', async () => {
      const result = await taskService.startTask('1');
      
      expect(taskService.update).toHaveBeenCalledWith('1', { status: TaskStatus.IN_PROGRESS });
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });
    
    it('should cancel a task', async () => {
      const result = await taskService.cancelTask('1');
      
      expect(taskService.update).toHaveBeenCalledWith('1', { status: TaskStatus.CANCELED });
      expect(result.status).toBe(TaskStatus.CANCELED);
    });
  });
  
  describe('getRecurrenceDates', () => {
    it('should return recurrence dates for a task', async () => {
      mockTaskRepository.findOne.mockResolvedValue(sampleRecurringTask);
      
      const result = await taskService.getRecurrenceDates('2');
      
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: '2' }
      });
      expect(result).toEqual(sampleRecurringTask.recurrenceDates);
    });
    
    it('should return empty array if task has no recurrence dates', async () => {
      const taskWithoutDates = { ...sampleTask, recurrenceDates: undefined };
      mockTaskRepository.findOne.mockResolvedValue(taskWithoutDates);
      
      const result = await taskService.getRecurrenceDates('1');
      
      expect(result).toEqual([]);
    });
  });
  
  describe('private methods', () => {
    describe('generateOccurrenceDates', () => {
      it('should generate dates for daily recurrence', () => {
        const startDate = new Date('2025-05-01');
        
        // Access private method using any type
        const service = taskService as any;
        const result = service.generateOccurrenceDates(
          startDate, 
          RecurrenceType.DAILY, 
          1, 
          new Date('2025-05-05'),
          10
        );
        
        expect(result).toEqual([
          '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05'
        ]);
      });
      
      it('should generate dates for weekly recurrence', () => {
        const startDate = new Date('2025-05-01');
        
        const service = taskService as any;
        const result = service.generateOccurrenceDates(
          startDate, 
          RecurrenceType.WEEKLY, 
          1,
          undefined,
          3
        );
        
        expect(result).toEqual([
          '2025-05-01', '2025-05-08', '2025-05-15', '2025-05-22'
        ]);
      });
      
      it('should generate dates for monthly recurrence', () => {
        const startDate = new Date('2025-05-01');
        
        const service = taskService as any;
        const result = service.generateOccurrenceDates(
          startDate, 
          RecurrenceType.MONTHLY, 
          1,
          undefined,
          3
        );
        
        expect(result).toEqual([
          '2025-05-01', '2025-06-01', '2025-07-01', '2025-08-01'
        ]);
      });
      
      it('should generate dates for yearly recurrence', () => {
        const startDate = new Date('2025-05-01');
        
        const service = taskService as any;
        const result = service.generateOccurrenceDates(
          startDate, 
          RecurrenceType.YEARLY, 
          1,
          undefined,
          3
        );
        
        expect(result).toEqual([
          '2025-05-01', '2026-05-01', '2027-05-01', '2028-05-01'
        ]);
      });
      
      it('should return only start date for non-recurring tasks', () => {
        const startDate = new Date('2025-05-01');
        
        const service = taskService as any;
        const result = service.generateOccurrenceDates(
          startDate, 
          RecurrenceType.NONE
        );
        
        expect(result).toEqual(['2025-05-01']);
      });
      
      it('should respect maximum occurrences limit', () => {
        const startDate = new Date('2025-05-01');
        
        const service = taskService as any;
        const result = service.generateOccurrenceDates(
          startDate, 
          RecurrenceType.DAILY, 
          1,
          undefined,
          3
        );
        
        expect(result.length).toBe(4); // start date + 3 occurrences
      });
    });
    
    describe('shouldRecalculateRecurrenceDates', () => {
      it('should return true when recurrence type changes', () => {
        const service = taskService as any;
        const result = service.shouldRecalculateRecurrenceDates(
          { recurrenceType: RecurrenceType.NONE },
          { recurrenceType: RecurrenceType.WEEKLY }
        );
        
        expect(result).toBe(true);
      });
      
      it('should return true when recurrence interval changes', () => {
        const service = taskService as any;
        const result = service.shouldRecalculateRecurrenceDates(
          { recurrenceType: RecurrenceType.WEEKLY, recurrenceInterval: 1 },
          { recurrenceInterval: 2 }
        );
        
        expect(result).toBe(true);
      });
      
      it('should return true when end date is added', () => {
        const service = taskService as any;
        const result = service.shouldRecalculateRecurrenceDates(
          { recurrenceType: RecurrenceType.WEEKLY, recurrenceEndDate: undefined },
          { recurrenceEndDate: new Date('2025-06-01') }
        );
        
        expect(result).toBe(true);
      });
      
      it('should return true when end date changes', () => {
        const service = taskService as any;
        const result = service.shouldRecalculateRecurrenceDates(
          { 
            recurrenceType: RecurrenceType.WEEKLY, 
            recurrenceEndDate: new Date('2025-06-01') 
          },
          { recurrenceEndDate: new Date('2025-07-01') }
        );
        
        expect(result).toBe(true);
      });
      
      it('should return true when due date changes', () => {
        const service = taskService as any;
        const result = service.shouldRecalculateRecurrenceDates(
          { dueDate: new Date('2025-05-01') },
          { dueDate: new Date('2025-05-15') }
        );
        
        expect(result).toBe(true);
      });
      
      it('should return false when no relevant changes', () => {
        const service = taskService as any;
        const result = service.shouldRecalculateRecurrenceDates(
          { 
            recurrenceType: RecurrenceType.WEEKLY, 
            recurrenceInterval: 1,
            dueDate: new Date('2025-05-01')
          },
          { title: 'Updated Title', description: 'Updated description' }
        );
        
        expect(result).toBe(false);
      });
    });
    
    describe('shouldUpdateFutureOccurrences', () => {
      it('should return true when conditions are met', () => {
        const service = taskService as any;
        const result = service.shouldUpdateFutureOccurrences(
          { recurrenceType: RecurrenceType.WEEKLY },
          { recurrenceType: RecurrenceType.WEEKLY, title: 'New title' }
        );
        
        expect(result).toBe(true);
      });
      
      it('should return false when task is not recurring', () => {
        const service = taskService as any;
        const result = service.shouldUpdateFutureOccurrences(
          { recurrenceType: RecurrenceType.NONE },
          { recurrenceType: RecurrenceType.NONE, title: 'New title' }
        );
        
        expect(result).toBe(false);
      });
      
      it('should return false when recurrence type is not being modified', () => {
        const service = taskService as any;
        const result = service.shouldUpdateFutureOccurrences(
          { recurrenceType: RecurrenceType.WEEKLY },
          { title: 'New title' }
        );
        
        expect(result).toBe(false);
      });
      
      it('should return false when no relevant changes', () => {
        const service = taskService as any;
        const result = service.shouldUpdateFutureOccurrences(
          { recurrenceType: RecurrenceType.WEEKLY },
          { recurrenceType: RecurrenceType.WEEKLY, dueDate: new Date() }
        );
        
        expect(result).toBe(false);
      });
    });
  });
});
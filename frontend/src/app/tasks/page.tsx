"use client";

import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Row, 
  Col, 
  DatePicker, 
  Select, 
  Space, 
  Modal, 
  Tabs,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined,
  InfoCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { taskApi, TaskStatus, TaskPriority, Task } from '@/services/api';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';
import TaskCalendar from '@/components/TaskCalendar';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

export default function TasksPage() {
  // States
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filters, setFilters] = useState<{
    status?: TaskStatus;
    priority?: TaskPriority;
    dueFrom?: string;
    dueTo?: string;
  }>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Task operations
  const taskOperations = useTaskOperations();

  // Load tasks with filters
  const { data: tasks = [], isLoading } = useQuery(
    ['tasks', filters],
    () => taskApi.getAll(filters).then((res: { data: any; }) => res.data),
    { keepPreviousData: true }
  );

  // Handlers for filters
  const handleStatusChange = (status?: TaskStatus) => {
    setFilters((prev: any) => ({ ...prev, status }));
  };

  const handlePriorityChange = (priority?: TaskPriority) => {
    setFilters((prev: any) => ({ ...prev, priority }));
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters((prev: any) => ({
        ...prev,
        dueFrom: dates[0].format('YYYY-MM-DD'),
        dueTo: dates[1].format('YYYY-MM-DD')
      }));
    } else {
      setFilters((prev: any) => ({
        ...prev,
        dueFrom: undefined,
        dueTo: undefined
      }));
    }
  };

  const handleClearFilters = () => {
    setFilters({});
  };
  
  // Handler to toggle between list and calendar view
  const toggleViewMode = () => {
    setViewMode((prev: string) => prev === 'list' ? 'calendar' : 'list');
  };

  // Calculations for statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task: { status: TaskStatus; }) => task.status === TaskStatus.COMPLETED).length;
  const pendingTasks = tasks.filter((task: { status: TaskStatus; }) => task.status === TaskStatus.TODO).length;
  const inProgressTasks = tasks.filter((task: { status: TaskStatus; }) => task.status === TaskStatus.IN_PROGRESS).length;
  const canceledTasks = tasks.filter((task: { status: TaskStatus; }) => task.status === TaskStatus.CANCELED).length;

  // Handlers for tabs
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    
    if (key === 'all') {
      handleStatusChange(undefined);
    } else if (key === 'todo') {
      handleStatusChange(TaskStatus.TODO);
    } else if (key === 'in_progress') {
      handleStatusChange(TaskStatus.IN_PROGRESS);
    } else if (key === 'completed') {
      handleStatusChange(TaskStatus.COMPLETED);
    } else if (key === 'canceled') {
      handleStatusChange(TaskStatus.CANCELED);
    }
  };
  
  // Handler for task selection in calendar
  const handleTaskSelected = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div style={{ padding: 24, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Task Management</Title>
        <Space>
          <Button
            icon={viewMode === 'list' ? <CalendarOutlined /> : <InfoCircleOutlined />}
            onClick={toggleViewMode}
          >
            View as {viewMode === 'list' ? 'Calendar' : 'List'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={taskOperations.openCreateModal}
            size="large"
          >
            New Task
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="Total Tasks" 
              value={totalTasks} 
              prefix={<InfoCircleOutlined />} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="Completed" 
              value={completedTasks} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="In Progress" 
              value={inProgressTasks} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
                          <Statistic 
              title="Canceled" 
              value={canceledTasks} 
              valueStyle={{ color: canceledTasks > 0 ? '#f5222d' : undefined }}
              prefix={<CloseCircleOutlined />} 
            />
          </Col>
        </Row>
      </Card>

      {viewMode === 'list' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Select
                  placeholder="Filter by Status"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.status}
                  onChange={handleStatusChange}
                >
                  <Select.Option value={TaskStatus.TODO}>To Do</Select.Option>
                  <Select.Option value={TaskStatus.IN_PROGRESS}>In Progress</Select.Option>
                  <Select.Option value={TaskStatus.COMPLETED}>Completed</Select.Option>
                  <Select.Option value={TaskStatus.CANCELED}>Canceled</Select.Option>
                </Select>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Select
                  placeholder="Filter by Priority"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.priority}
                  onChange={handlePriorityChange}
                >
                  <Select.Option value={TaskPriority.HIGH}>High</Select.Option>
                  <Select.Option value={TaskPriority.MEDIUM}>Medium</Select.Option>
                  <Select.Option value={TaskPriority.LOW}>Low</Select.Option>
                </Select>
              </Col>
              
              <Col xs={24} sm={24} md={8} lg={8}>
                <RangePicker 
                  style={{ width: '100%' }}
                  placeholder={['Start Date', 'End Date']}
                  onChange={handleDateRangeChange}
                  allowClear
                />
              </Col>
              
              <Col xs={24} sm={24} md={24} lg={4}>
                <Button 
                  onClick={handleClearFilters}
                  style={{ width: '100%' }}
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>
          </div>

          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab="All Tasks" key="all">
              <TaskList 
                tasks={tasks} 
                loading={isLoading} 
                onEdit={taskOperations.openEditModal}
              />
            </TabPane>
            <TabPane tab="To Do" key="todo">
              <TaskList 
                tasks={tasks.filter((task: { status: TaskStatus; }) => task.status === TaskStatus.TODO)} 
                loading={isLoading} 
                onEdit={taskOperations.openEditModal}
              />
            </TabPane>
            <TabPane tab="In Progress" key="in_progress">
              <TaskList 
                tasks={tasks.filter((task: { status: TaskStatus; }) => task.status === TaskStatus.IN_PROGRESS)} 
                loading={isLoading} 
                onEdit={taskOperations.openEditModal}
              />
            </TabPane>
            <TabPane tab="Completed" key="completed">
              <TaskList 
                tasks={tasks.filter((task: { status: TaskStatus; }) => task.status === TaskStatus.COMPLETED)} 
                loading={isLoading} 
                onEdit={taskOperations.openEditModal}
              />
            </TabPane>
            <TabPane tab="Canceled" key="canceled">
              <TaskList 
                tasks={tasks} 
                loading={isLoading} 
                onEdit={taskOperations.openEditModal}
              />
            </TabPane>
          </Tabs>
        </>
      )}

      {viewMode === 'calendar' && (
        <div style={{ marginTop: 16 }}>
          <TaskCalendar onTaskSelected={handleTaskSelected} />
        </div>
      )}

      {/* Modal for creating/editing tasks */}
      <Modal
        title={taskOperations.editingTask ? "Edit Task" : "New Task"}
        open={taskOperations.modalVisible}
        onCancel={taskOperations.closeModal}
        footer={null}
        destroyOnClose
      >
        <TaskForm
          initialValues={taskOperations.editingTask ?? undefined}
          onFinish={(values: any) => {
            if (taskOperations.editingTask) {
              taskOperations.updateTask.mutate({ 
                id: taskOperations.editingTask.id, 
                data: values 
              });
            } else {
              taskOperations.createTask.mutate(values);
            }
          }}
          onCancel={taskOperations.closeModal}
          loading={taskOperations.createTask.isLoading || taskOperations.updateTask.isLoading}
        />
      </Modal>
    </div>
  );
}
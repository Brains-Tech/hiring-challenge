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
  InfoCircleOutlined
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { taskApi, TaskStatus, TaskPriority } from '@/services/api';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

export default function TasksPage() {
  // Estados
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<{
    status?: TaskStatus;
    priority?: TaskPriority;
    dueFrom?: string;
    dueTo?: string;
  }>({});

  // Operações de tarefas
  const taskOperations = useTaskOperations();

  // Carregar tarefas com filtros
  const { data: tasks = [], isLoading } = useQuery(
    ['tasks', filters],
    () => taskApi.getAll(filters).then(res => res.data),
    { keepPreviousData: true }
  );

  // Handlers para filtros
  const handleStatusChange = (status?: TaskStatus) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handlePriorityChange = (priority?: TaskPriority) => {
    setFilters(prev => ({ ...prev, priority }));
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters(prev => ({
        ...prev,
        dueFrom: dates[0].format('YYYY-MM-DD'),
        dueTo: dates[1].format('YYYY-MM-DD')
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        dueFrom: undefined,
        dueTo: undefined
      }));
    }
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // Cálculos para estatísticas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
  const pendingTasks = tasks.filter(task => task.status === TaskStatus.TODO).length;
  const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
  const canceledTasks = tasks.filter(task => task.status === TaskStatus.CANCELED).length;
  
  const overdueTasksCount = tasks.filter(task => 
    (task.status === TaskStatus.TODO || task.status === TaskStatus.IN_PROGRESS) && 
    task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day')
  ).length;

  // Handlers para tabs
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
    } else if (key === 'overdue') {
      setFilters(prev => ({
        ...prev,
        status: undefined,
        dueTo: dayjs().format('YYYY-MM-DD')
      }));
    }
  };

  return (
    <div style={{ padding: 24, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Gerenciamento de Tarefas</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={taskOperations.openCreateModal}
          size="large"
        >
          Nova Tarefa
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="Total de Tarefas" 
              value={totalTasks} 
              prefix={<InfoCircleOutlined />} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="Concluídas" 
              value={completedTasks} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="Em Andamento" 
              value={inProgressTasks} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />} 
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="Atrasadas" 
              value={overdueTasksCount} 
              valueStyle={{ color: overdueTasksCount > 0 ? '#f5222d' : undefined }}
              prefix={<CloseCircleOutlined />} 
            />
          </Col>
        </Row>
      </Card>

      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filtrar por Status"
              style={{ width: '100%' }}
              allowClear
              value={filters.status}
              onChange={handleStatusChange}
            >
              <Select.Option value={TaskStatus.TODO}>A Fazer</Select.Option>
              <Select.Option value={TaskStatus.IN_PROGRESS}>Em Andamento</Select.Option>
              <Select.Option value={TaskStatus.COMPLETED}>Concluídas</Select.Option>
              <Select.Option value={TaskStatus.CANCELED}>Canceladas</Select.Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filtrar por Prioridade"
              style={{ width: '100%' }}
              allowClear
              value={filters.priority}
              onChange={handlePriorityChange}
            >
              <Select.Option value={TaskPriority.HIGH}>Alta</Select.Option>
              <Select.Option value={TaskPriority.MEDIUM}>Média</Select.Option>
              <Select.Option value={TaskPriority.LOW}>Baixa</Select.Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={24} md={8} lg={8}>
            <RangePicker 
              style={{ width: '100%' }}
              placeholder={['Data Inicial', 'Data Final']}
              onChange={handleDateRangeChange}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={24} md={24} lg={4}>
            <Button 
              onClick={handleClearFilters}
              style={{ width: '100%' }}
            >
              Limpar Filtros
            </Button>
          </Col>
        </Row>
      </div>

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Todas as Tarefas" key="all">
          <TaskList 
            tasks={tasks} 
            loading={isLoading} 
            onEdit={taskOperations.openEditModal}
          />
        </TabPane>
        <TabPane tab="A Fazer" key="todo">
          <TaskList 
            tasks={tasks.filter(task => task.status === TaskStatus.TODO)} 
            loading={isLoading} 
            onEdit={taskOperations.openEditModal}
          />
        </TabPane>
        <TabPane tab="Em Andamento" key="in_progress">
          <TaskList 
            tasks={tasks.filter(task => task.status === TaskStatus.IN_PROGRESS)} 
            loading={isLoading} 
            onEdit={taskOperations.openEditModal}
          />
        </TabPane>
        <TabPane tab="Concluídas" key="completed">
          <TaskList 
            tasks={tasks.filter(task => task.status === TaskStatus.COMPLETED)} 
            loading={isLoading} 
            onEdit={taskOperations.openEditModal}
          />
        </TabPane>
        <TabPane tab={`Atrasadas (${overdueTasksCount})`} key="overdue">
          <TaskList 
            tasks={tasks.filter(task => 
              (task.status === TaskStatus.TODO || task.status === TaskStatus.IN_PROGRESS) && 
              task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day')
            )} 
            loading={isLoading} 
            onEdit={taskOperations.openEditModal}
          />
        </TabPane>
      </Tabs>

      {/* Modal para criar/editar tarefas */}
      <Modal
        title={taskOperations.editingTask ? "Editar Tarefa" : "Nova Tarefa"}
        open={taskOperations.modalVisible}
        onCancel={taskOperations.closeModal}
        footer={null}
        destroyOnClose
      >
        <TaskForm
          initialValues={taskOperations.editingTask ?? undefined}
          onFinish={(values) => {
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
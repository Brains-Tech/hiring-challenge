import React from 'react';
import { Table, Tag, Space, Button, Tooltip, Popconfirm, Badge } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  PlayCircleOutlined, 
  StopOutlined,
  InfoCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { Task, TaskStatus, TaskPriority, RecurrenceType, taskApi } from '@/services/api';
import { useMutation, useQueryClient } from 'react-query';
import dayjs from 'dayjs';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onEdit?: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, loading, onEdit }) => {
  const queryClient = useQueryClient();
  
  const completeTask = useMutation(
    (id: string) => taskApi.complete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
      }
    }
  );
  
  const startTask = useMutation(
    (id: string) => taskApi.start(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
      }
    }
  );
  
  const cancelTask = useMutation(
    (id: string) => taskApi.cancel(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
      }
    }
  );
  
  const deleteTask = useMutation(
    (id: string) => taskApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
      }
    }
  );
  
  // Mapeamento de rótulos de recorrência
  const getRecurrenceLabel = (task: Task) => {
    if (task.recurrenceType === RecurrenceType.NONE) {
      return null;
    }
    
    let label = "";
    
    switch (task.recurrenceType) {
      case RecurrenceType.DAILY:
        label = "Diária";
        break;
      case RecurrenceType.WEEKLY:
        label = "Semanal";
        break;
      case RecurrenceType.MONTHLY:
        label = "Mensal";
        break;
      case RecurrenceType.YEARLY:
        label = "Anual";
        break;
    }
    
    if (task.recurrenceInterval && task.recurrenceInterval > 1) {
      label += ` (${task.recurrenceInterval}x)`;
    }
    
    return label;
  };
  
  // Colunas da tabela
  const columns = [
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Task) => (
        <Tooltip title={record.description}>
          <Space>
            {text}
            {record.description && <InfoCircleOutlined style={{ color: '#1890ff' }} />}
            {record.recurrenceType !== RecurrenceType.NONE && (
              <Tag color="purple" style={{ marginLeft: 4 }}>
                {getRecurrenceLabel(record)}
              </Tag>
            )}
            {record.parentTaskId && (
              <Tag color="cyan" style={{ marginLeft: 4 }}>Recorrente</Tag>
            )}
          </Space>
        </Tooltip>
      ),
      sorter: (a: Task, b: Task) => a.title.localeCompare(b.title),
      ellipsis: true,
    },
    {
      title: 'Prioridade',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: TaskPriority) => {
        const colorMap = {
          [TaskPriority.LOW]: 'green',
          [TaskPriority.MEDIUM]: 'blue',
          [TaskPriority.HIGH]: 'red',
        };
        
        const labelMap = {
          [TaskPriority.LOW]: 'Baixa',
          [TaskPriority.MEDIUM]: 'Média',
          [TaskPriority.HIGH]: 'Alta',
        };
        
        return (
          <Tag color={colorMap[priority]}>
            {labelMap[priority]}
          </Tag>
        );
      },
      filters: [
        { text: 'Alta', value: TaskPriority.HIGH },
        { text: 'Média', value: TaskPriority.MEDIUM },
        { text: 'Baixa', value: TaskPriority.LOW },
      ],
      onFilter: (value: string, record: Task) => record.priority === value,
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => {
        const statusMap = {
          [TaskStatus.TODO]: { color: 'default', label: 'A Fazer' },
          [TaskStatus.IN_PROGRESS]: { color: 'processing', label: 'Em Andamento' },
          [TaskStatus.COMPLETED]: { color: 'success', label: 'Concluída' },
          [TaskStatus.CANCELED]: { color: 'error', label: 'Cancelada' },
        };
        
        return (
          <Badge 
            status={statusMap[status].color as any} 
            text={statusMap[status].label} 
          />
        );
      },
      filters: [
        { text: 'A Fazer', value: TaskStatus.TODO },
        { text: 'Em Andamento', value: TaskStatus.IN_PROGRESS },
        { text: 'Concluída', value: TaskStatus.COMPLETED },
        { text: 'Cancelada', value: TaskStatus.CANCELED },
      ],
      onFilter: (value: string, record: Task) => record.status === value,
      width: 140,
    },
    {
      title: 'Data de Vencimento',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string, record: Task) => {
        if (!date) return '-';
        
        const isOverdue = 
          (record.status === TaskStatus.TODO || record.status === TaskStatus.IN_PROGRESS) && 
          dayjs(date).isBefore(dayjs(), 'day');
        
        return (
          <div style={{ color: isOverdue ? '#f5222d' : 'inherit' }}>
            {dayjs(date).format('DD/MM/YYYY')}
            {record.recurrenceDates && record.recurrenceDates.length > 1 && (
              <Tooltip title="Esta tarefa tem múltiplas datas de execução">
                <CalendarOutlined style={{ marginLeft: 8 }} />
              </Tooltip>
            )}
            {isOverdue && <Tag color="red" style={{ marginLeft: 4 }}>Atrasada</Tag>}
          </div>
        );
      },
      sorter: (a: Task, b: Task) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix();
      },
      width: 180,
    },
    {
      title: 'Recorrência',
      key: 'recurrence',
      render: (_: any, record: Task) => {
        if (record.recurrenceType === RecurrenceType.NONE) {
          return '-';
        }
        
        let recurrenceInfo = getRecurrenceLabel(record);
        
        // Adicionar informação sobre o fim da recorrência
        if (record.recurrenceEndDate) {
          recurrenceInfo += ` até ${dayjs(record.recurrenceEndDate).format('DD/MM/YYYY')}`;
        }
        
        // Informação sobre o número de ocorrências
        const occurrencesCount = record.recurrenceDates?.length || 1;
        
        return (
          <Tooltip title={
            <>
              <div>Tipo: {getRecurrenceLabel(record)}</div>
              {record.recurrenceEndDate && 
                <div>Término: {dayjs(record.recurrenceEndDate).format('DD/MM/YYYY')}</div>}
              <div>Total de ocorrências: {occurrencesCount}</div>
            </>
          }>
            <div>
              {getRecurrenceLabel(record)}
              {record.recurrenceDates && record.recurrenceDates.length > 0 && (
                <Tag style={{ marginLeft: 8 }}>{record.recurrenceDates.length} datas</Tag>
              )}
            </div>
          </Tooltip>
        );
      },
      width: 180,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: Task) => (
        <Space size="small">
          {/* Botão de editar */}
          {onEdit && (
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => onEdit(record)}
              title="Editar"
            />
          )}
          
          {/* Ações baseadas no status atual */}
          {record.status === TaskStatus.TODO && (
            <Button 
              icon={<PlayCircleOutlined />} 
              size="small" 
              type="primary"
              onClick={() => startTask.mutate(record.id)}
              title="Iniciar"
            />
          )}
          
          {record.status === TaskStatus.IN_PROGRESS && (
            <Button 
              icon={<CheckCircleOutlined />} 
              size="small" 
              type="primary"
              onClick={() => completeTask.mutate(record.id)}
              title="Concluir"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            />
          )}
          
          {(record.status === TaskStatus.TODO || record.status === TaskStatus.IN_PROGRESS) && (
            <Button 
              icon={<StopOutlined />} 
              size="small" 
              onClick={() => cancelTask.mutate(record.id)}
              title="Cancelar"
              danger
            />
          )}
          
          <Popconfirm
            title="Tem certeza que deseja excluir esta tarefa?"
            onConfirm={() => deleteTask.mutate(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger
              title="Excluir"
            />
          </Popconfirm>
        </Space>
      ),
      width: 200,
      fixed: 'right' as const,
    },
  ];
  
  return (
    <Table 
      columns={columns} 
      dataSource={tasks} 
      loading={loading}
      rowKey="id"
      pagination={{ 
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} tarefas`
      }}
      scroll={{ x: 1200 }}
    />
  );
};

export default TaskList;
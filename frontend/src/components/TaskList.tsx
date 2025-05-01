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
  
  // Recurrence label mapping
  const getRecurrenceLabel = (task: Task) => {
    if (task.recurrenceType === RecurrenceType.NONE) {
      return null;
    }
    
    let label = "";
    
    switch (task.recurrenceType) {
      case RecurrenceType.DAILY:
        label = "Daily";
        break;
      case RecurrenceType.WEEKLY:
        label = "Weekly";
        break;
      case RecurrenceType.MONTHLY:
        label = "Monthly";
        break;
      case RecurrenceType.YEARLY:
        label = "Yearly";
        break;
    }
    
    if (task.recurrenceInterval && task.recurrenceInterval > 1) {
      label += ` (${task.recurrenceInterval}x)`;
    }
    
    return label;
  };
  
  // Table columns
  const columns = [
    {
      title: 'Title',
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
              <Tag color="cyan" style={{ marginLeft: 4 }}>Recurring</Tag>
            )}
          </Space>
        </Tooltip>
      ),
      sorter: (a: Task, b: Task) => a.title.localeCompare(b.title),
      ellipsis: true,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: TaskPriority) => {
        const colorMap = {
          [TaskPriority.LOW]: 'green',
          [TaskPriority.MEDIUM]: 'blue',
          [TaskPriority.HIGH]: 'red',
        };
        
        const labelMap = {
          [TaskPriority.LOW]: 'Low',
          [TaskPriority.MEDIUM]: 'Medium',
          [TaskPriority.HIGH]: 'High',
        };
        
        return (
          <Tag color={colorMap[priority]}>
            {labelMap[priority]}
          </Tag>
        );
      },
      filters: [
        { text: 'High', value: TaskPriority.HIGH },
        { text: 'Medium', value: TaskPriority.MEDIUM },
        { text: 'Low', value: TaskPriority.LOW },
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
          [TaskStatus.TODO]: { color: 'default', label: 'To Do' },
          [TaskStatus.IN_PROGRESS]: { color: 'processing', label: 'In Progress' },
          [TaskStatus.COMPLETED]: { color: 'success', label: 'Completed' },
          [TaskStatus.CANCELED]: { color: 'error', label: 'Canceled' },
        };
        
        return (
          <Badge 
            status={statusMap[status].color as any} 
            text={statusMap[status].label} 
          />
        );
      },
      filters: [
        { text: 'To Do', value: TaskStatus.TODO },
        { text: 'In Progress', value: TaskStatus.IN_PROGRESS },
        { text: 'Completed', value: TaskStatus.COMPLETED },
        { text: 'Canceled', value: TaskStatus.CANCELED },
      ],
      onFilter: (value: string, record: Task) => record.status === value,
      width: 140,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string, record: Task) => {
        if (!date) return '-';
        
        const isOverdue = 
          (record.status === TaskStatus.TODO || record.status === TaskStatus.IN_PROGRESS) && 
          dayjs(date).isBefore(dayjs(), 'day');
        
        return (
          <div style={{ color: isOverdue ? '#f5222d' : 'inherit' }}>
            {dayjs(date).format('MM/DD/YYYY')}
            {record.recurrenceDates && record.recurrenceDates.length > 1 && (
              <Tooltip title="This task has multiple execution dates">
                <CalendarOutlined style={{ marginLeft: 8 }} />
              </Tooltip>
            )}
            {isOverdue && <Tag color="red" style={{ marginLeft: 4 }}>Overdue</Tag>}
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
      title: 'Recurrence',
      key: 'recurrence',
      render: (_: any, record: Task) => {
        if (record.recurrenceType === RecurrenceType.NONE) {
          return '-';
        }
        
        let recurrenceInfo = getRecurrenceLabel(record);
        
        // Add information about recurrence end
        if (record.recurrenceEndDate) {
          recurrenceInfo += ` until ${dayjs(record.recurrenceEndDate).format('MM/DD/YYYY')}`;
        }
        
        // Information about number of occurrences
        const occurrencesCount = record.recurrenceDates?.length || 1;
        
        return (
          <Tooltip title={
            <>
              <div>Type: {getRecurrenceLabel(record)}</div>
              {record.recurrenceEndDate && 
                <div>End: {dayjs(record.recurrenceEndDate).format('MM/DD/YYYY')}</div>}
              <div>Total occurrences: {occurrencesCount}</div>
            </>
          }>
            <div>
              {getRecurrenceLabel(record)}
              {record.recurrenceDates && record.recurrenceDates.length > 0 && (
                <Tag style={{ marginLeft: 8 }}>{record.recurrenceDates.length} dates</Tag>
              )}
            </div>
          </Tooltip>
        );
      },
      width: 180,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Task) => (
        <Space size="small">
          {/* Edit button */}
          {onEdit && (
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => onEdit(record)}
              title="Edit"
            />
          )}
          
          {/* Actions based on current status */}
          {record.status === TaskStatus.TODO && (
            <Button 
              icon={<PlayCircleOutlined />} 
              size="small" 
              type="primary"
              onClick={() => startTask.mutate(record.id)}
              title="Start"
            />
          )}
          
          {record.status === TaskStatus.IN_PROGRESS && (
            <Button 
              icon={<CheckCircleOutlined />} 
              size="small" 
              type="primary"
              onClick={() => completeTask.mutate(record.id)}
              title="Complete"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            />
          )}
          
          {(record.status === TaskStatus.TODO || record.status === TaskStatus.IN_PROGRESS) && (
            <Button 
              icon={<StopOutlined />} 
              size="small" 
              onClick={() => cancelTask.mutate(record.id)}
              title="Cancel"
              danger
            />
          )}
          
          <Popconfirm
            title="Are you sure you want to delete this task?"
            onConfirm={() => deleteTask.mutate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger
              title="Delete"
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
        showTotal: (total) => `Total ${total} tasks`
      }}
      scroll={{ x: 1200 }}
    />
  );
};

export default TaskList;
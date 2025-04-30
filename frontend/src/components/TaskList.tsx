import React from 'react';
import { Table, Tag, Button, Space, Dropdown, Modal, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  PlayCircleOutlined,
  CloseCircleOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Task, TaskStatus, TaskPriority } from '@/services/api';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, loading, onEdit }) => {
  const operations = useTaskOperations();

  // Status tag renderer
  const getStatusTag = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <Tag color="success">Concluída</Tag>;
      case TaskStatus.IN_PROGRESS:
        return <Tag color="processing">Em Andamento</Tag>;
      case TaskStatus.TODO:
        return <Tag color="default">A Fazer</Tag>;
      case TaskStatus.CANCELED:
        return <Tag color="error">Cancelada</Tag>;
      default:
        return <Tag>Desconhecido</Tag>;
    }
  };

  // Priority tag renderer
  const getPriorityTag = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return <Tag color="red">Alta</Tag>;
      case TaskPriority.MEDIUM:
        return <Tag color="orange">Média</Tag>;
      case TaskPriority.LOW:
        return <Tag color="blue">Baixa</Tag>;
      default:
        return <Tag>Desconhecida</Tag>;
    }
  };

  // Action handlers
  const handleComplete = (id: string) => {
    operations.completeTask.mutate(id);
  };

  const handleStart = (id: string) => {
    operations.startTask.mutate(id);
  };

  const handleCancel = (id: string) => {
    Modal.confirm({
      title: 'Cancelar Tarefa',
      icon: <ExclamationCircleOutlined />,
      content: 'Tem certeza que deseja cancelar esta tarefa?',
      onOk: () => operations.cancelTask.mutate(id),
    });
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Excluir Tarefa',
      icon: <ExclamationCircleOutlined />,
      content: 'Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.',
      okType: 'danger',
      onOk: () => operations.deleteTask.mutate(id),
    });
  };

  // Table column configuration
  const columns: ColumnsType<Task> = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => getStatusTag(status),
      filters: [
        { text: 'A Fazer', value: TaskStatus.TODO },
        { text: 'Em Andamento', value: TaskStatus.IN_PROGRESS },
        { text: 'Concluída', value: TaskStatus.COMPLETED },
        { text: 'Cancelada', value: TaskStatus.CANCELED },
      ],
      onFilter: (value, record) => record.status === value,
      width: 120,
    },
    {
      title: 'Prioridade',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: TaskPriority) => getPriorityTag(priority),
      filters: [
        { text: 'Alta', value: TaskPriority.HIGH },
        { text: 'Média', value: TaskPriority.MEDIUM },
        { text: 'Baixa', value: TaskPriority.LOW },
      ],
      onFilter: (value, record) => record.priority === value,
      width: 100,
    },
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Task) => (
        <Tooltip title={record.description}>
          <Space>
            {text}
            {record.description && <InfoCircleOutlined style={{ color: '#1890ff' }} />}
          </Space>
        </Tooltip>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Data de Vencimento',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
      sorter: (a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
      },
      defaultSortOrder: 'ascend',
      width: 150,
    },
    {
      title: 'Criado em',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      width: 120,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record: Task) => {
        // Menu items for dropdown
        // Criamos um array vazio com o tipo correto
        const items: MenuProps['items'] = [];
        
        // Adicionamos os itens condicionalmente
        if (record.status === TaskStatus.TODO) {
          items.push({
            key: 'start',
            label: 'Iniciar',
            icon: <PlayCircleOutlined />,
            onClick: () => handleStart(record.id)
          });
        }
        
        if (record.status === TaskStatus.TODO || record.status === TaskStatus.IN_PROGRESS) {
          items.push({
            key: 'complete',
            label: 'Concluir',
            icon: <CheckCircleOutlined />,
            onClick: () => handleComplete(record.id)
          });
          
          items.push({
            key: 'cancel',
            label: 'Cancelar',
            icon: <CloseCircleOutlined />,
            onClick: () => handleCancel(record.id)
          });
        }
        
        // Estes itens sempre estão presentes
        items.push({
          key: 'edit',
          label: 'Editar',
          icon: <EditOutlined />,
          onClick: () => onEdit(record)
        });
        
        items.push({
          key: 'delete',
          label: 'Excluir',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDelete(record.id)
        });

        return (
          <Space>
            {record.status === TaskStatus.TODO && (
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStart(record.id)}
                loading={operations.startTask.isLoading && operations.startTask.variables === record.id}
              >
                Iniciar
              </Button>
            )}
            
            {(record.status === TaskStatus.TODO || record.status === TaskStatus.IN_PROGRESS) && (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleComplete(record.id)}
                loading={operations.completeTask.isLoading && operations.completeTask.variables === record.id}
              >
                Concluir
              </Button>
            )}
            
            <Dropdown menu={{ items }}>
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
      width: 200,
      fixed: 'right'
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={tasks}
      rowKey="id"
      loading={loading}
      pagination={{ 
        defaultPageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        showTotal: (total) => `Total ${total} tarefas`
      }}
      scroll={{ x: 1000 }}
    />
  );
};

export default TaskList;
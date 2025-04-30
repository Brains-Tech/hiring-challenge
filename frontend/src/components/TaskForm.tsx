import React from 'react';
import { Form, Input, Select, DatePicker, Button, Space } from 'antd';
import { TaskPriority, TaskStatus, Task } from '@/services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface TaskFormProps {
  initialValues?: Task;
  onFinish: (values: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  initialValues,
  onFinish,
  onCancel,
  loading = false
}) => {
  const [form] = Form.useForm();

  // Inicializar o formulário com os valores iniciais, se houver
  React.useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        dueDate: initialValues.dueDate ? dayjs(initialValues.dueDate) : undefined
      });
    } else {
      // Valores padrão para um novo formulário
      form.setFieldsValue({
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM
      });
    }
  }, [initialValues, form]);

  const handleSubmit = (values: any) => {
    // Processar dados do formulário
    const processedValues = { ...values };
    
    // Converter data para string formato ISO
    if (processedValues.dueDate) {
      processedValues.dueDate = processedValues.dueDate.format('YYYY-MM-DD');
    }
    
    onFinish(processedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        name="title"
        label="Título"
        rules={[{ required: true, message: 'Por favor insira o título da tarefa' }]}
      >
        <Input placeholder="Título da tarefa" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Descrição"
      >
        <TextArea 
          rows={4} 
          placeholder="Descrição detalhada da tarefa (opcional)"
        />
      </Form.Item>

      <Form.Item
        name="priority"
        label="Prioridade"
        rules={[{ required: true, message: 'Por favor selecione a prioridade' }]}
      >
        <Select>
          <Option value={TaskPriority.LOW}>Baixa</Option>
          <Option value={TaskPriority.MEDIUM}>Média</Option>
          <Option value={TaskPriority.HIGH}>Alta</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: 'Por favor selecione o status' }]}
      >
        <Select>
          <Option value={TaskStatus.TODO}>A Fazer</Option>
          <Option value={TaskStatus.IN_PROGRESS}>Em Andamento</Option>
          <Option value={TaskStatus.COMPLETED}>Concluída</Option>
          <Option value={TaskStatus.CANCELED}>Cancelada</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="dueDate"
        label="Data de Vencimento"
      >
        <DatePicker 
          style={{ width: '100%' }} 
          placeholder="Selecione uma data (opcional)"
        />
      </Form.Item>

      <Form.Item>
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
          >
            {initialValues ? 'Atualizar' : 'Criar'} Tarefa
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default TaskForm;
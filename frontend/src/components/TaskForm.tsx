import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Divider, InputNumber, Switch, Row, Col, Alert } from 'antd';
import { TaskPriority, TaskStatus, RecurrenceType, Task } from '@/services/api';
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
  const [isRecurring, setIsRecurring] = useState(
    initialValues ? initialValues.recurrenceType !== RecurrenceType.NONE : false
  );
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    initialValues?.recurrenceType || RecurrenceType.NONE
  );

  // Inicializar o formulário com os valores iniciais, se houver
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        dueDate: initialValues.dueDate ? dayjs(initialValues.dueDate) : undefined,
        recurrenceEndDate: initialValues.recurrenceEndDate ? dayjs(initialValues.recurrenceEndDate) : undefined,
        isRecurring: initialValues.recurrenceType !== RecurrenceType.NONE
      });
      setIsRecurring(initialValues.recurrenceType !== RecurrenceType.NONE);
      setRecurrenceType(initialValues.recurrenceType);
    } else {
      // Valores padrão para um novo formulário
      form.setFieldsValue({
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        recurrenceType: RecurrenceType.NONE,
        isRecurring: false,
        dueDate: dayjs()
      });
    }
  }, [initialValues, form]);

  const handleRecurrenceToggle = (checked: boolean) => {
    setIsRecurring(checked);
    
    if (!checked) {
      form.setFieldsValue({
        recurrenceType: RecurrenceType.NONE,
        recurrenceInterval: undefined,
        recurrenceEndDate: undefined
      });
      setRecurrenceType(RecurrenceType.NONE);
    } else if (checked && recurrenceType === RecurrenceType.NONE) {
      form.setFieldsValue({
        recurrenceType: RecurrenceType.WEEKLY,
        recurrenceInterval: 1
      });
      setRecurrenceType(RecurrenceType.WEEKLY);
    }
  };

  const handleRecurrenceTypeChange = (value: RecurrenceType) => {
    setRecurrenceType(value);
  };

  const handleSubmit = (values: any) => {
    const processedValues = { ...values };
    
    if (processedValues.dueDate) {
      processedValues.dueDate = processedValues.dueDate.format('YYYY-MM-DD');
    }
    
    if (processedValues.recurrenceEndDate) {
      processedValues.recurrenceEndDate = processedValues.recurrenceEndDate.format('YYYY-MM-DD');
    }
    
    if (!processedValues.isRecurring) {
      processedValues.recurrenceType = RecurrenceType.NONE;
      processedValues.recurrenceInterval = undefined;
      processedValues.recurrenceEndDate = undefined;
    }
    
    delete processedValues.isRecurring;
    
    onFinish(processedValues);
  };

  // Função para obter o texto de intervalo com base no tipo de recorrência
  const getIntervalText = (type: RecurrenceType) => {
    switch (type) {
      case RecurrenceType.DAILY:
        return 'dias';
      case RecurrenceType.WEEKLY:
        return 'semanas';
      case RecurrenceType.MONTHLY:
        return 'meses';
      case RecurrenceType.YEARLY:
        return 'anos';
      default:
        return 'intervalo';
    }
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

      <Row gutter={16}>
        <Col span={12}>
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
        </Col>
        <Col span={12}>
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
        </Col>
      </Row>

      <Form.Item
        name="dueDate"
        label="Data de Vencimento"
        rules={[{ required: true, message: 'Por favor selecione a data de vencimento' }]}
        help="A data de vencimento é necessária para exibir a tarefa no calendário"
      >
        <DatePicker 
          style={{ width: '100%' }} 
          placeholder="Selecione uma data"
        />
      </Form.Item>
      
      <Divider>Recorrência</Divider>
      
      <Form.Item
        name="isRecurring"
        valuePropName="checked"
        label="Tarefa Recorrente"
      >
        <Switch 
          checkedChildren="Sim" 
          unCheckedChildren="Não" 
          onChange={handleRecurrenceToggle}
        />
      </Form.Item>
      
      {isRecurring && (
        <>
          <Form.Item
            name="recurrenceType"
            label="Frequência"
            rules={[{ required: isRecurring, message: 'Por favor selecione a frequência' }]}
          >
            <Select onChange={handleRecurrenceTypeChange}>
              <Option value={RecurrenceType.DAILY}>Diariamente</Option>
              <Option value={RecurrenceType.WEEKLY}>Semanalmente</Option>
              <Option value={RecurrenceType.MONTHLY}>Mensalmente</Option>
              <Option value={RecurrenceType.YEARLY}>Anualmente</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="recurrenceInterval"
            label="Intervalo de Repetição"
            rules={[{ required: isRecurring, message: 'Por favor defina o intervalo' }]}
            extra={`A tarefa será repetida a cada ${form.getFieldValue('recurrenceInterval') || 1} ${getIntervalText(recurrenceType)}`}
          >
            <InputNumber min={1} defaultValue={1} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="recurrenceEndDate"
            label="Data Final (opcional)"
          >
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="Selecione uma data de término da recorrência"
            />
          </Form.Item>
          
          <Alert
            message="Informação"
            description="As tarefas recorrentes serão exibidas em todas as datas aplicáveis no calendário."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </>
      )}

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
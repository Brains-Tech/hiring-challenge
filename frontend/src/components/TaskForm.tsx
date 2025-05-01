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

  // Initialize the form with initial values if provided
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
      // Default values for a new form
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

  // Function to get interval text based on recurrence type
  const getIntervalText = (type: RecurrenceType) => {
    switch (type) {
      case RecurrenceType.DAILY:
        return 'days';
      case RecurrenceType.WEEKLY:
        return 'weeks';
      case RecurrenceType.MONTHLY:
        return 'months';
      case RecurrenceType.YEARLY:
        return 'years';
      default:
        return 'interval';
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
        label="Title"
        rules={[{ required: true, message: 'Please enter the task title' }]}
      >
        <Input placeholder="Task title" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <TextArea 
          rows={4} 
          placeholder="Detailed task description (optional)"
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select a priority' }]}
          >
            <Select>
              <Option value={TaskPriority.LOW}>Low</Option>
              <Option value={TaskPriority.MEDIUM}>Medium</Option>
              <Option value={TaskPriority.HIGH}>High</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select>
              <Option value={TaskStatus.TODO}>To Do</Option>
              <Option value={TaskStatus.IN_PROGRESS}>In Progress</Option>
              <Option value={TaskStatus.COMPLETED}>Completed</Option>
              <Option value={TaskStatus.CANCELED}>Canceled</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="dueDate"
        label="Due Date"
        rules={[{ required: true, message: 'Please select a due date' }]}
        help="Due date is required to display the task on the calendar"
      >
        <DatePicker 
          style={{ width: '100%' }} 
          placeholder="Select a date"
        />
      </Form.Item>
      
      <Divider>Recurrence</Divider>
      
      <Form.Item
        name="isRecurring"
        valuePropName="checked"
        label="Recurring Task"
      >
        <Switch 
          checkedChildren="Yes" 
          unCheckedChildren="No" 
          onChange={handleRecurrenceToggle}
        />
      </Form.Item>
      
      {isRecurring && (
        <>
          <Form.Item
            name="recurrenceType"
            label="Frequency"
            rules={[{ required: isRecurring, message: 'Please select a frequency' }]}
          >
            <Select onChange={handleRecurrenceTypeChange}>
              <Option value={RecurrenceType.DAILY}>Daily</Option>
              <Option value={RecurrenceType.WEEKLY}>Weekly</Option>
              <Option value={RecurrenceType.MONTHLY}>Monthly</Option>
              <Option value={RecurrenceType.YEARLY}>Yearly</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="recurrenceInterval"
            label="Repeat Interval"
            rules={[{ required: isRecurring, message: 'Please set the interval' }]}
            extra={`The task will repeat every ${form.getFieldValue('recurrenceInterval') || 1} ${getIntervalText(recurrenceType)}`}
          >
            <InputNumber min={1} defaultValue={1} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="recurrenceEndDate"
            label="End Date (optional)"
          >
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="Select an end date for recurrence"
            />
          </Form.Item>
          
          <Alert
            message="Information"
            description="Recurring tasks will be displayed on all applicable dates in the calendar."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      <Form.Item>
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
          >
            {initialValues ? 'Update' : 'Create'} Task
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default TaskForm;
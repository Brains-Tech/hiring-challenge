import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Typography, Modal, Button, Tooltip } from 'antd';
import type { CalendarMode } from 'antd/es/calendar/generateCalendar';
import { useQuery } from 'react-query';
import { taskApi, Task, TaskStatus, TaskPriority, RecurrenceType } from '@/services/api';
import dayjs, { Dayjs } from 'dayjs';
import { useTaskOperations } from '@/hooks/useTaskOperations';

const { Text } = Typography;

// Mapeamento de prioridades para cores
const priorityColors = {
  [TaskPriority.LOW]: 'green',
  [TaskPriority.MEDIUM]: 'blue',
  [TaskPriority.HIGH]: 'red'
};

const statusMap = {
  [TaskStatus.TODO]: 'default',
  [TaskStatus.IN_PROGRESS]: 'processing',
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.CANCELED]: 'error'
};

interface TaskCalendarProps {
  onTaskSelected?: (task: Task) => void;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ onTaskSelected }) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [taskDetailsVisible, setTaskDetailsVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
  
  // Usar o hook de operações de tarefas
  const taskOperations = useTaskOperations();
  
  // Buscar todas as tarefas
  const { data: tasks = [], isLoading } = useQuery(
    'tasks',
    () => taskApi.getAll().then(res => res.data)
  );
  
  // Organizar tarefas por data
  const tasksByDate = React.useMemo(() => {
    if (!tasks || tasks.length === 0) return {};
    
    const taskMap: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      if (task.recurrenceDates && task.recurrenceDates.length > 0) {
        task.recurrenceDates.forEach(date => {
          if (!taskMap[date]) {
            taskMap[date] = [];
          }
          // Adicionamos uma cópia da tarefa com a data ajustada
          const taskCopy = { ...task, dueDate: date };
          taskMap[date].push(taskCopy);
        });
      } 
      else if (task.dueDate) {
        const dateStr = dayjs(task.dueDate).format('YYYY-MM-DD');
        if (!taskMap[dateStr]) {
          taskMap[dateStr] = [];
        }
        taskMap[dateStr].push(task);
      }
    });
    
    return taskMap;
  }, [tasks]);
  
  const getTasksForDate = (date: Dayjs): Task[] => {
    if (!tasks || tasks.length === 0) return [];
    
    const dateStr = date.format('YYYY-MM-DD');
    return tasksByDate[dateStr] || [];
  };
  
  const dateCellRender = (value: Dayjs) => {
    const dayTasks = getTasksForDate(value);
    
    const displayLimit = 3;
    const tasksToShow = dayTasks.slice(0, displayLimit);
    const extraTasks = dayTasks.length > displayLimit ? dayTasks.length - displayLimit : 0;
    
    return (
      <div className="task-cell">
        {tasksToShow.map(task => (
          <div
            key={`${task.id}-${value.format('YYYY-MM-DD')}`}
            className="task-item"
            onClick={(e) => {
              e.stopPropagation();
              handleTaskClick(task);
            }}
            style={{ cursor: 'pointer', marginBottom: 4 }}
          >
            <Badge
              status={statusMap[task.status] as any}
              color={priorityColors[task.priority]}
              text={
                <Tooltip title={task.description || task.title}>
                  <Text
                    ellipsis={{ tooltip: true }}
                    style={{ 
                      maxWidth: '100%', 
                      fontSize: '12px',
                      textDecoration: task.status === TaskStatus.COMPLETED ? 'line-through' : 'none'
                    }}
                  >
                    {task.title}
                    {task.recurrenceType !== RecurrenceType.NONE && (
                      <span style={{ marginLeft: 4, fontSize: '10px', color: '#8c8c8c' }}>↻</span>
                    )}
                  </Text>
                </Tooltip>
              }
            />
          </div>
        ))}
        {extraTasks > 0 && (
          <div
            className="more-tasks"
            onClick={(e) => {
              e.stopPropagation();
              handleDateClick(value);
            }}
            style={{ fontSize: '12px', color: '#1890ff', cursor: 'pointer' }}
          >
            +{extraTasks} mais...
          </div>
        )}
      </div>
    );
  };
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailsVisible(true);
    if (onTaskSelected) {
      onTaskSelected(task);
    }
  };
  
  // Manipular clique em uma data
  const handleDateClick = (date: Dayjs) => {
    setSelectedDate(date);
    // Aqui poderíamos mostrar um modal com todas as tarefas do dia
    // ou navegar para uma página de lista de tarefas filtrada por data
  };

  // Manipular mudança de modo de visualização (mês/ano)
  const handleModeChange = (mode: CalendarMode) => {
    setCalendarMode(mode);
  };
  
  // Manipular seleção de uma célula do calendário (uma data)
  const handleSelect = (date: Dayjs) => {
    setSelectedDate(date);
    
    taskOperations.openCreateModal();
    
    setTimeout(() => {
      // Preencher a data selecionada no formulário
      const form = document.querySelector('form');
      if (form) {
        const dateInput = form.querySelector('input[placeholder="Selecione uma data (opcional)"]');
        if (dateInput) {
          const datePickerInput = dateInput as HTMLInputElement;
          datePickerInput.click(); // Abrir o picker
          setTimeout(() => {
            document.body.click(); // Fechar o picker
            const event = new Event('change', { bubbles: true });
            datePickerInput.value = date.format('YYYY-MM-DD');
            datePickerInput.dispatchEvent(event);
          }, 10);
        }
      }
    }, 100);
  };
  
  return (
    <div className="task-calendar">
      <Calendar 
        dateCellRender={dateCellRender}
        onSelect={handleSelect}
        onPanelChange={handleModeChange}
        loading={isLoading}
      />
      
      {/* Modal de detalhes da tarefa */}
      <Modal
        title="Detalhes da Tarefa"
        open={taskDetailsVisible}
        onCancel={() => setTaskDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTaskDetailsVisible(false)}>
            Fechar
          </Button>,
          <Button 
            key="edit" 
            type="primary" 
            onClick={() => {
              setTaskDetailsVisible(false);
              if (selectedTask) {
                taskOperations.openEditModal(selectedTask);
              }
            }}
          >
            Editar
          </Button>
        ]}
      >
        {selectedTask && (
          <div>
            <h3>{selectedTask.title}</h3>
            <p><strong>Prioridade:</strong> {selectedTask.priority}</p>
            <p><strong>Status:</strong> {selectedTask.status}</p>
            {selectedTask.dueDate && (
              <p><strong>Data de Vencimento:</strong> {dayjs(selectedTask.dueDate).format('DD/MM/YYYY')}</p>
            )}
            {selectedTask.description && (
              <div>
                <p><strong>Descrição:</strong></p>
                <p>{selectedTask.description}</p>
              </div>
            )}
            {selectedTask.recurrenceType !== RecurrenceType.NONE && (
              <div>
                <p><strong>Recorrência:</strong> {selectedTask.recurrenceType} 
                  {selectedTask.recurrenceInterval && selectedTask.recurrenceInterval > 1 ? 
                    ` (a cada ${selectedTask.recurrenceInterval} ${selectedTask.recurrenceType === RecurrenceType.DAILY ? 'dias' : 
                    selectedTask.recurrenceType === RecurrenceType.WEEKLY ? 'semanas' : 
                    selectedTask.recurrenceType === RecurrenceType.MONTHLY ? 'meses' : 'anos'})` : ''}
                </p>
                {selectedTask.recurrenceEndDate && (
                  <p><strong>Término da Recorrência:</strong> {dayjs(selectedTask.recurrenceEndDate).format('DD/MM/YYYY')}</p>
                )}
                {selectedTask.recurrenceDates && selectedTask.recurrenceDates.length > 0 && (
                  <p><strong>Total de Ocorrências:</strong> {selectedTask.recurrenceDates.length}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaskCalendar;
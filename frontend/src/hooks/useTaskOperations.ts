import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { message } from 'antd';
import { taskApi, Task, TaskStatus } from '@/services/api';

export function useTaskOperations() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Mutação para criar tarefa
  const createTask = useMutation(
    (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => 
      taskApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        message.success('Tarefa criada com sucesso');
        setModalVisible(false);
        setEditingTask(null);
      },
      onError: (error: any) => {
        message.error(`Erro ao criar tarefa: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutação para atualizar tarefa
  const updateTask = useMutation(
    ({ id, data }: { 
      id: string, 
      data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> 
    }) => taskApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        message.success('Tarefa atualizada com sucesso');
        setModalVisible(false);
        setEditingTask(null);
      },
      onError: (error: any) => {
        message.error(`Erro ao atualizar tarefa: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutação para completar tarefa
  const completeTask = useMutation(
    (id: string) => taskApi.complete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        message.success('Tarefa concluída com sucesso');
      },
      onError: (error: any) => {
        message.error(`Erro ao concluir tarefa: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutação para iniciar tarefa
  const startTask = useMutation(
    (id: string) => taskApi.start(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        message.success('Tarefa iniciada com sucesso');
      },
      onError: (error: any) => {
        message.error(`Erro ao iniciar tarefa: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutação para cancelar tarefa
  const cancelTask = useMutation(
    (id: string) => taskApi.cancel(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        message.success('Tarefa cancelada com sucesso');
      },
      onError: (error: any) => {
        message.error(`Erro ao cancelar tarefa: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutação para excluir tarefa
  const deleteTask = useMutation(
    (id: string) => taskApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        message.success('Tarefa excluída com sucesso');
      },
      onError: (error: any) => {
        message.error(`Erro ao excluir tarefa: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Funções para gestão do modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTask(null);
  };

  return {
    // Mutações
    createTask,
    updateTask,
    completeTask,
    startTask,
    cancelTask,
    deleteTask,

    // Estados e ações de modal
    modalVisible,
    editingTask,
    openEditModal,
    openCreateModal,
    closeModal
  };
}
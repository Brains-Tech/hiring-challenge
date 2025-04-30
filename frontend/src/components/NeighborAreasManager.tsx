import { Card, Button, Table, Modal, Form, Select, Input, message, Popconfirm } from "antd";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Area, areaApi } from "@/services/api";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

interface NeighborAreasManagerProps {
  areaId: string;
  plantId: string;
}

// Componente para gerenciar áreas vizinhas
const NeighborAreasManager: React.FC<NeighborAreasManagerProps> = ({ areaId, plantId }) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const queryClient = useQueryClient();

  // Carregar áreas vizinhas
  const { data: neighbors, isLoading: neighborsLoading } = useQuery(
    ['area-neighbors', areaId],
    () => areaApi.getAreaNeighbors(areaId).then(res => res.data),
    { enabled: !!areaId }
  );

  // Carregar áreas disponíveis (mesma planta, não vizinhas e não a própria)
  const { data: allAreas, isLoading: areasLoading } = useQuery(
    ['areas', plantId],
    () => areaApi.getAll().then(res => res.data.filter(area => area.plantId === plantId)),
    { enabled: !!plantId }
  );

  // Filtrar áreas que podem ser adicionadas como vizinhas
  const availableAreas = allAreas?.filter(area => 
    area.id !== areaId && 
    !neighbors?.some(neighbor => neighbor.id === area.id)
  ) || [];

  // Mutação para adicionar vizinho
  const addNeighborMutation = useMutation(
    (values: { neighborId: string; connectionType?: string; notes?: string }) => 
      areaApi.addNeighbor(areaId, values.neighborId, {
        connectionType: values.connectionType,
        notes: values.notes
      }),
    {
      onSuccess: () => {
        // Invalidar as consultas específicas
        queryClient.invalidateQueries(['area-neighbors', areaId]);
        
        // CORREÇÃO: Invalidar a consulta principal de áreas para atualizar contagem de vizinhos
        queryClient.invalidateQueries('areas');
        
        message.success('Área vizinha adicionada com sucesso');
        setIsModalVisible(false);
        form.resetFields();
      },
      onError: (error: any) => {
        message.error(`Erro ao adicionar área vizinha: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutação para remover vizinho
  const removeNeighborMutation = useMutation(
    (neighborId: string) => areaApi.removeNeighbor(areaId, neighborId),
    {
      onSuccess: () => {
        // Invalidar as consultas específicas
        queryClient.invalidateQueries(['area-neighbors', areaId]);
        
        // CORREÇÃO: Invalidar a consulta principal de áreas para atualizar contagem de vizinhos
        queryClient.invalidateQueries('areas');
        
        message.success('Vizinhança removida com sucesso');
      },
      onError: (error: any) => {
        message.error(`Erro ao remover vizinhança: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Configuração das colunas da tabela
  const columnsConfig = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Localização',
      dataIndex: 'locationDescription',
      key: 'locationDescription',
      ellipsis: true,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: Area) => (
        <Popconfirm
          title="Remover vizinhança"
          description="Tem certeza que deseja remover esta área vizinha? Isso pode afetar equipamentos compartilhados."
          onConfirm={() => removeNeighborMutation.mutate(record.id)}
          okText="Sim"
          cancelText="Não"
        >
          <Button 
            danger 
            icon={<DeleteOutlined />}
            loading={removeNeighborMutation.isLoading}
          />
        </Popconfirm>
      ),
    },
  ];

  const handleAddNeighbor = (values: any) => {
    addNeighborMutation.mutate(values);
  };

  return (
    <Card 
      title="Áreas Vizinhas" 
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          disabled={availableAreas.length === 0}
        >
          Adicionar
        </Button>
      }
      loading={neighborsLoading}
    >
      <Table 
        dataSource={neighbors || []} 
        columns={columnsConfig}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: "Nenhuma área vizinha" }}
      />
      
      <Modal
        title="Adicionar Área Vizinha"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddNeighbor}
        >
          <Form.Item
            name="neighborId"
            label="Área"
            rules={[{ required: true, message: 'Por favor, selecione uma área' }]}
          >
            <Select
              placeholder="Selecione uma área"
              loading={areasLoading}
              disabled={areasLoading || availableAreas.length === 0}
            >
              {availableAreas.map(area => (
                <Select.Option key={area.id} value={area.id}>
                  {area.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="connectionType"
            label="Tipo de Conexão"
          >
            <Select placeholder="Selecione o tipo de conexão">
              <Select.Option value="door">Porta</Select.Option>
              <Select.Option value="hallway">Corredor</Select.Option>
              <Select.Option value="pipeline">Tubulação</Select.Option>
              <Select.Option value="adjacente">Áreas Adjacentes</Select.Option>
              <Select.Option value="other">Outro</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Observações"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={addNeighborMutation.isLoading}
                disabled={areasLoading || availableAreas.length === 0}
              >
                Adicionar
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default NeighborAreasManager;
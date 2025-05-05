import { useState, useEffect, useMemo } from "react";
import { Form, Select, Button, Alert, Space, message, Card, Tag } from "antd";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Area, areaApi, equipmentApi } from "@/services/api";
import { Loading3QuartersOutlined } from "@ant-design/icons";

interface EquipmentAreasManagerProps {
  equipmentId: string;
  onSaved?: () => void;
}

type NeighborGraph = Record<string, Set<string>>;
type ValidationResult = {
  valid: boolean;
  errors: string[];
};

const EquipmentAreasManager: React.FC<EquipmentAreasManagerProps> = ({ 
  equipmentId, 
  onSaved 
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [primaryArea, setPrimaryArea] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const { 
    data: allAreas = [], 
    isLoading: areasLoading 
  } = useQuery<Area[]>(
    "all-areas",
    () => areaApi.getAll().then(res => res.data)
  );
  
  const {
    data: currentAreas = [],
    isLoading: currentAreasLoading
  } = useQuery<Area[]>(
    ["equipment-areas", equipmentId],
    () => equipmentApi.getEquipmentAreas(equipmentId).then(res => res.data),
    { enabled: !!equipmentId }
  );
  
  const {
    data: primaryAreaData,
    isLoading: primaryAreaLoading
  } = useQuery(
    ["equipment-primary-area", equipmentId],
    () => equipmentApi.getPrimaryArea(equipmentId).then(res => res.data),
    { enabled: !!equipmentId }
  );
  
  const {
    data: neighborGraph = {},
    isLoading: graphLoading
  } = useQuery<NeighborGraph>(
    "area-neighbor-graph",
    async () => {
      const graph: NeighborGraph = {};
      
      const batchSize = 5;
      const areas = await areaApi.getAll().then(res => res.data);
      
      for (let i = 0; i < areas.length; i += batchSize) {
        const batch = areas.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (area) => {
            try {
              const neighbors = await areaApi.getAreaNeighbors(area.id);
              graph[area.id] = new Set(neighbors.data.map(n => n.id));
            } catch (error) {
              console.error(`Erro ao carregar vizinhos da área ${area.id}:`, error);
              graph[area.id] = new Set();
            }
          })
        );
      }
      
      return graph;
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000
    }
  );
  
  // Mutação para salvar áreas
  const assignAreasMutation = useMutation(
    (values: { areaIds: string[]; primaryAreaId?: string }) => 
      equipmentApi.assignToAreas(equipmentId, values.areaIds, values.primaryAreaId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["equipment-areas", equipmentId]);
        queryClient.invalidateQueries(["equipment-primary-area", equipmentId]);
        queryClient.invalidateQueries(["equipment", equipmentId]);
        message.success("Áreas atualizadas com sucesso");
        onSaved?.();
      },
      onError: (error: any) => {
        message.error(`Erro ao atualizar áreas: ${error.response?.data?.message || error.message}`);
      }
    }
  );
  
  const areaNames = useMemo(() => {
    const namesMap: Record<string, string> = {};
    allAreas.forEach(area => {
      namesMap[area.id] = area.name;
    });
    return namesMap;
  }, [allAreas]);
  
  useEffect(() => {
    if (currentAreas.length > 0 && primaryAreaData) {
      const areaIds = currentAreas.map(area => area.id);
      setSelectedAreas(areaIds);
      setPrimaryArea(primaryAreaData.id);
      
      form.setFieldsValue({
        areaIds,
        primaryAreaId: primaryAreaData.id
      });
    }
  }, [currentAreas, primaryAreaData, form]);
  
  const validateConnectedGroup = (areaIds: string[]): ValidationResult => {
    if (areaIds.length <= 1) return { valid: true, errors: [] };
    
    if (Object.keys(neighborGraph).length === 0) {
      return { valid: true, errors: [] }; 
    }
    
    const errors: string[] = [];
    const processedPairs = new Set<string>();
    
    for (let i = 0; i < areaIds.length; i++) {
      for (let j = i + 1; j < areaIds.length; j++) {
        const area1 = areaIds[i];
        const area2 = areaIds[j];
        
        const pairKey = [area1, area2].sort().join('_');
    
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);
        
        if (!neighborGraph[area1]?.has(area2)) {
          errors.push(`As áreas "${areaNames[area1] || area1}" e "${areaNames[area2] || area2}" não são vizinhas`);
        }
      }
    }
    
    return { 
      valid: errors.length === 0,
      errors 
    };
  };
  
  const handleAreaChange = (areaIds: string[]) => {
    setSelectedAreas(areaIds);
    
    if (primaryArea && !areaIds.includes(primaryArea)) {
      setPrimaryArea(areaIds.length > 0 ? areaIds[0] : null);
      form.setFieldsValue({ primaryAreaId: areaIds.length > 0 ? areaIds[0] : undefined });
    }
    
    const { errors } = validateConnectedGroup(areaIds);
    setValidationErrors(errors);
  };
  
  const handleSubmit = (values: { areaIds: string[]; primaryAreaId?: string }) => {
    const { valid, errors } = validateConnectedGroup(values.areaIds);
    
    if (!valid) {
      setValidationErrors(errors);
      return;
    }
    
    assignAreasMutation.mutate(values);
  };
  
  const isLoading = areasLoading || currentAreasLoading || primaryAreaLoading || graphLoading;
  
  return (
    <Card 
      title="Gerenciar Áreas" 
      loading={isLoading}
    >
      {currentAreas && currentAreas.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div><strong>Áreas Atuais:</strong></div>
          <Space style={{ marginTop: 8 }}>
            {currentAreas.map(area => (
              <Tag 
                key={area.id} 
                color={area.id === primaryAreaData?.id ? "blue" : undefined}
              >
                {area.name} {area.id === primaryAreaData?.id ? "(Principal)" : ""}
              </Tag>
            ))}
          </Space>
        </div>
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="areaIds"
          label="Áreas"
          validateStatus={validationErrors.length > 0 ? "error" : undefined}
          help={validationErrors.length > 0 && (
            <Space direction="vertical" style={{ width: '100%' }}>
              {validationErrors.map((error, index) => (
                <Alert 
                  key={index} 
                  message={error} 
                  type="error" 
                  showIcon 
                  style={{ padding: '4px 8px' }} 
                />
              ))}
              <div>Selecione apenas áreas que sejam vizinhas entre si.</div>
            </Space>
          )}
          rules={[{ required: true, message: 'Selecione pelo menos uma área' }]}
        >
          <Select
            mode="multiple"
            placeholder="Selecione as áreas"
            value={selectedAreas}
            onChange={handleAreaChange}
            loading={isLoading}
            optionFilterProp="children"
          >
            {allAreas.map(area => (
              <Select.Option key={area.id} value={area.id}>
                {area.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="primaryAreaId"
          label="Área Principal"
          rules={[{ required: true, message: 'Selecione a área principal' }]}
        >
          <Select
            placeholder="Selecione a área principal"
            value={primaryArea}
            onChange={setPrimaryArea}
            disabled={selectedAreas.length === 0}
          >
            {selectedAreas.map(areaId => {
              const area = allAreas.find(a => a.id === areaId);
              return area ? (
                <Select.Option key={areaId} value={areaId}>
                  {area.name}
                </Select.Option>
              ) : null;
            })}
          </Select>
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit"
            disabled={validationErrors.length > 0 || selectedAreas.length === 0}
            loading={assignAreasMutation.isLoading}
            icon={isLoading ? <Loading3QuartersOutlined spin /> : undefined}
          >
            Salvar
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EquipmentAreasManager;
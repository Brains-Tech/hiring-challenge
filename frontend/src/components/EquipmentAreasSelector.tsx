import { Form, Select, Button, Alert, Spin } from "antd";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "react-query";
import { areaApi, equipmentApi, Area } from "@/services/api";

interface EquipmentAreasSelectorProps {
  equipmentId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const EquipmentAreasSelector: React.FC<EquipmentAreasSelectorProps> = ({ 
  equipmentId, 
  onSave,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [primaryArea, setPrimaryArea] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidatingAreas, setIsValidatingAreas] = useState(false);
  
  // Get all areas
  const { data: allAreas, isLoading: areasLoading } = useQuery(
    ['all-areas'],
    () => areaApi.getAll().then(res => res.data)
  );

  // Get current equipment areas
  const { data: currentAreas, isLoading: currentAreasLoading } = useQuery(
    ['equipment-areas', equipmentId],
    () => equipmentApi.getEquipmentAreas(equipmentId).then(res => res.data),
    { enabled: !!equipmentId }
  );

  // Get current primary area
  const { data: currentPrimaryArea, isLoading: primaryAreaLoading } = useQuery(
    ['equipment-primary-area', equipmentId],
    () => equipmentApi.getPrimaryArea(equipmentId).then(res => res.data),
    { enabled: !!equipmentId }
  );

  // Mutation to save areas
  const assignAreasMutation = useMutation(
    (values: { areaIds: string[]; primaryAreaId?: string }) => 
      equipmentApi.assignToAreas(equipmentId, values.areaIds, values.primaryAreaId),
    {
      onSuccess: () => {
        if (onSave) onSave();
      }
    }
  );

  // Initialize form with current values
  useEffect(() => {
    if (currentAreas && currentPrimaryArea) {
      const areaIds = currentAreas.map(area => area.id);
      setSelectedAreas(areaIds);
      setPrimaryArea(currentPrimaryArea?.id || null);
      
      form.setFieldsValue({
        areaIds,
        primaryAreaId: currentPrimaryArea?.id
      });
    }
  }, [currentAreas, currentPrimaryArea, form]);

  // Validate that areas are neighbors
  const validateAreaConnections = async (areaIds: string[]) => {
    if (!areaIds || areaIds.length <= 1) {
      return true;
    }
    
    setIsValidatingAreas(true);
    const errors: string[] = [];
    
    try {
      // For each pair of areas, verify they are neighbors
      for (let i = 0; i < areaIds.length; i++) {
        for (let j = i + 1; j < areaIds.length; j++) {
          const result = await areaApi.checkNeighbors(areaIds[i], areaIds[j]);
          
          if (!result.data.areNeighbors) {
            const area1 = allAreas?.find(a => a.id === areaIds[i])?.name || areaIds[i];
            const area2 = allAreas?.find(a => a.id === areaIds[j])?.name || areaIds[j];
            errors.push(`Areas '${area1}' and '${area2}' are not neighbors.`);
          }
        }
      }
      
      setValidationErrors(errors);
      setIsValidatingAreas(false);
      return errors.length === 0;
    } catch (error) {
      setValidationErrors(['Error validating area connections.']);
      setIsValidatingAreas(false);
      return false;
    }
  };

  // Handle area selection change
  const handleAreaChange = async (areaIds: string[]) => {
    setSelectedAreas(areaIds);
    
    // If primary area was deselected, update it
    if (primaryArea && !areaIds.includes(primaryArea)) {
      setPrimaryArea(areaIds.length > 0 ? areaIds[0] : null);
      form.setFieldsValue({ primaryAreaId: areaIds.length > 0 ? areaIds[0] : undefined });
    }
    
    // Validate areas are neighbors
    await validateAreaConnections(areaIds);
  };

  // Handle form submission
  const handleSave = async (values: any) => {
    // Validate areas are neighbors before saving
    const isValid = await validateAreaConnections(values.areaIds);
    
    if (isValid) {
      assignAreasMutation.mutate({
        areaIds: values.areaIds,
        primaryAreaId: values.primaryAreaId
      });
    }
  };
  
  const isLoading = areasLoading || currentAreasLoading || primaryAreaLoading;

  return (
    <Form 
      form={form}
      layout="vertical"
      onFinish={handleSave}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin />
          <p>Loading areas...</p>
        </div>
      ) : (
        <>
          <Form.Item 
            name="areaIds" 
            label="Areas" 
            validateStatus={validationErrors.length > 0 ? "error" : ""}
            extra={isValidatingAreas ? "Validating area connections..." : ""}
            rules={[{ required: true, message: "Please select at least one area" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select areas for this equipment"
              value={selectedAreas}
              onChange={handleAreaChange}
              loading={isValidatingAreas}
              style={{ width: '100%' }}
            >
              {allAreas?.map(area => (
                <Select.Option key={area.id} value={area.id}>
                  {area.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          {validationErrors.length > 0 && (
            <Form.Item>
              <Alert
                message="Validation Errors"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                }
                type="error"
                showIcon
              />
            </Form.Item>
          )}
          
          <Form.Item 
            name="primaryAreaId" 
            label="Primary Area"
            rules={[{ required: selectedAreas.length > 0, message: "Please select a primary area" }]}
          >
            <Select
              placeholder="Select primary area"
              value={primaryArea}
              onChange={setPrimaryArea}
              disabled={selectedAreas.length === 0}
              style={{ width: '100%' }}
            >
              {selectedAreas.map(areaId => {
                const area = allAreas?.find(a => a.id === areaId);
                return (
                  <Select.Option key={areaId} value={areaId}>
                    {area?.name || areaId}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
          
          <Form.Item style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {onCancel && (
                <Button onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button 
                type="primary" 
                htmlType="submit"
                loading={assignAreasMutation.isLoading || isValidatingAreas}
                disabled={validationErrors.length > 0 || selectedAreas.length === 0 || !primaryArea}
              >
                Save
              </Button>
            </div>
          </Form.Item>
        </>
      )}
    </Form>
  );
};

export default EquipmentAreasSelector;
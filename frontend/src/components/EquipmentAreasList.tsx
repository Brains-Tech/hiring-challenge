import { useState, useEffect } from "react";
import { Typography, Tag, Space, Spin } from "antd";
import { useQuery } from "react-query";
import { equipmentApi, Area } from "@/services/api";

interface EquipmentAreasListProps {
  equipmentId: string;
}

const EquipmentAreasList: React.FC<EquipmentAreasListProps> = ({ equipmentId }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [primaryArea, setPrimaryArea] = useState<Area | null>(null);

  // Fetch all areas for the equipment
  const { data: equipmentAreas, isLoading: areasLoading } = useQuery(
    ["equipment-areas", equipmentId],
    () => equipmentApi.getEquipmentAreas(equipmentId).then(res => res.data),
    { enabled: !!equipmentId }
  );

  // Fetch primary area for the equipment
  const { data: primaryAreaData, isLoading: primaryAreaLoading } = useQuery(
    ["equipment-primary-area", equipmentId],
    () => equipmentApi.getPrimaryArea(equipmentId).then(res => res.data),
    { enabled: !!equipmentId }
  );

  // Update state when data is loaded
  useEffect(() => {
    if (equipmentAreas) {
      setAreas(equipmentAreas);
    }
  }, [equipmentAreas]);

  useEffect(() => {
    if (primaryAreaData) {
      setPrimaryArea(primaryAreaData);
    }
  }, [primaryAreaData]);

  if (areasLoading || primaryAreaLoading) {
    return <Spin size="small" />;
  }

  if (!areas || areas.length === 0) {
    return <Typography.Text type="secondary">No areas assigned</Typography.Text>;
  }

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {primaryArea && (
        <div>
          <Typography.Text strong>Primary Area: </Typography.Text>
          <Tag color="blue">{primaryArea.name}</Tag>
        </div>
      )}
      
      {areas.filter(area => area.id !== primaryArea?.id).length > 0 && (
        <div>
          <Typography.Text strong>Other Areas: </Typography.Text>
          <div style={{ marginTop: 4 }}>
            {areas
              .filter(area => area.id !== primaryArea?.id)
              .map(area => (
                <Tag key={area.id}>{area.name}</Tag>
              ))
            }
          </div>
        </div>
      )}
    </Space>
  );
};

export default EquipmentAreasList;
"use client";

import { Input, Select, Button, Space } from "antd";
import { PlusOutlined, CalendarOutlined } from "@ant-design/icons";
import {
  Equipment,
  Area,
  Plant,
  Part,
  MaintenanceRecurrenceEnum,
} from "@/services/api";

type MaintenanceFiltersProps = {
  filters: {
    name: string;
    equipmentId: string;
    type: string;
    areaId: string;
    plantId: string;
    partId: string;
  };
  setFilters: (filters: any) => void;
  equipment?: Equipment[];
  areas?: Area[];
  plants?: Plant[];
  parts?: Part[];
  onAdd?: () => void;
  onCalendar?: () => void;
};

export const MaintenanceFilters = ({
  filters,
  setFilters,
  equipment = [],
  areas = [],
  plants = [],
  parts = [],
  onAdd,
  onCalendar,
}: MaintenanceFiltersProps) => {
  return (
    <Space
      size="large"
      wrap
      style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}
    >
      <Input
        placeholder="Filter by name"
        value={filters.name}
        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        style={{ minWidth: 200 }}
      />
      <Select
        style={{ minWidth: 200 }}
        placeholder="Filter by Recurrence"
        allowClear
        value={filters.type || undefined}
        onChange={(value) => setFilters({ ...filters, type: value })}
      >
        {Object.values(MaintenanceRecurrenceEnum).map((type) => (
          <Select.Option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Select.Option>
        ))}
      </Select>
      <Select
        style={{ minWidth: 200 }}
        placeholder="Filter by equipment"
        allowClear
        value={filters.equipmentId || undefined}
        onChange={(value) => setFilters({ ...filters, equipmentId: value })}
      >
        {equipment.map((eq) => (
          <Select.Option key={eq.id} value={eq.id}>
            {eq.name}
          </Select.Option>
        ))}
      </Select>
      <Select
        style={{ minWidth: 200 }}
        placeholder="Filter by Area"
        allowClear
        value={filters.areaId || undefined}
        onChange={(value) => setFilters({ ...filters, areaId: value })}
      >
        {areas.map((area) => (
          <Select.Option key={area.id} value={area.id}>
            {area.name}
          </Select.Option>
        ))}
      </Select>
      <Select
        style={{ minWidth: 200 }}
        placeholder="Filter by Plant"
        allowClear
        value={filters.plantId || undefined}
        onChange={(value) => setFilters({ ...filters, plantId: value })}
      >
        {plants.map((plant) => (
          <Select.Option key={plant.id} value={plant.id}>
            {plant.name}
          </Select.Option>
        ))}
      </Select>
      <Select
        style={{ minWidth: 200 }}
        placeholder="Filter by Part"
        allowClear
        value={filters.partId || undefined}
        onChange={(value) => setFilters({ ...filters, partId: value })}
      >
        {parts.map((part) => (
          <Select.Option key={part.id} value={part.id}>
            {part.name}
          </Select.Option>
        ))}
      </Select>
      <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
        Add Maintenance
      </Button>
      <Button icon={<CalendarOutlined />} onClick={onCalendar}>
        Calendar
      </Button>
    </Space>
  );
};

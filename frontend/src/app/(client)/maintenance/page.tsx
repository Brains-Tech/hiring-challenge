"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  equipmentApi,
  areaApi,
  Equipment,
  Maintenance,
  maintenanceApi,
  MaintenanceRecurrenceEnum,
  plantApi,
  partApi,
} from "@/services/api";
import {
  PlusOutlined,
  DeleteOutlined,
  RightOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { capitalize } from "@/utils/capitalize";
import { ModalCreateUpdate } from "@/components/maintenance/ModalCreateUpdate";

export default function MaintenancePage() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null
  );

  const [filters, setFilters] = useState({
    name: "",
    equipmentId: "",
    type: "",
    areaId: "",
    plantId: "",
    partId: "",
    maintenanceId: "",
  });
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const partId = searchParams.get("partId");
  const maintenanceId = searchParams.get("maintenanceId");
  const equipmentId = searchParams.get("equipmentId");

  const { data: maintenances, isLoading: maintenanceLoading } = useQuery(
    "maintenance",
    () => maintenanceApi.getAll().then((res) => res.data)
  );

  const { data: plants, isLoading: plantsLoading } = useQuery("plants", () =>
    plantApi.getAll().then((res) => res.data)
  );

  const { data: equipment, isLoading: equipmentLoading } = useQuery(
    "equipment",
    () => equipmentApi.getAll().then((res) => res.data)
  );

  const { data: areas, isLoading: areaLoading } = useQuery("areas", () =>
    areaApi.getAll().then((res) => res.data)
  );

  const { data: parts, isLoading: partsLoading } = useQuery("parts", () =>
    partApi.getAll().then((res) => res.data)
  );

  // Set initial area filter if partId is provided
  useEffect(() => {
    if (partId) {
      setFilters((prev) => ({ ...prev, partId }));
      return;
    }

    if (maintenanceId) {
      setFilters((prev) => ({ ...prev, maintenanceId }));
      return;
    }

    if (equipmentId) {
      setFilters((prev) => ({ ...prev, equipmentId }));
      return;
    }
  }, [partId]);

  const createMutation = useMutation(
    (data: Omit<Equipment, "id" | "createdAt" | "updatedAt">) =>
      equipmentApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("equipment");
        message.success("Equipment created successfully");
        setIsModalVisible(false);
        form.resetFields();
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<Equipment> }) =>
      equipmentApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("equipment");
        message.success("Equipment updated successfully");
        setIsModalVisible(false);
        form.resetFields();
        setEditingEquipment(null);
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => maintenanceApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("equipment");
        message.success("Equipment deleted successfully");
      },
    }
  );

  function matchesFilters(item: Maintenance, filters: any): boolean {
    const titleMatch = item.title
      .toLowerCase()
      .includes(filters.name.toLowerCase());
    const equipmentMatch =
      !filters.equipmentId || item.equipment?.id === filters.equipmentId;
    const recurrenceMatch = !filters.type || item.recurrence === filters.type;
    const areaMatch = !filters.areaId || item.area?.id === filters.areaId;
    const plantMatch = !filters.plantId || item.plant?.id === filters.plantId;
    const maintenanceMatch =
      !filters.maintenanceId || item.id === filters.maintenanceId;
    const partMatch = !filters.partId || item.part?.id === filters.partId;
    return (
      titleMatch &&
      equipmentMatch &&
      recurrenceMatch &&
      areaMatch &&
      plantMatch &&
      maintenanceMatch &&
      partMatch
    );
  }

  const filteredMaintenances = maintenances?.filter((item) =>
    matchesFilters(item, filters)
  );

  const columns: TableProps<Maintenance>["columns"] = [
    {
      title: "Name",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Scheduled Date",
      dataIndex: "scheduledDate",
      key: "scheduledDate",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Recurrence",
      dataIndex: "recurrence",
      key: "recurrence",
      sorter: (a, b) => a.recurrence.localeCompare(b.recurrence),
      render: (value) => capitalize(value),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Part",
      dataIndex: ["part", "name"],
      key: "part",
    },
    {
      title: "Installation Part Date",
      dataIndex: ["part", "installationDate"],
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Equipment",
      dataIndex: ["equipment", "name"],
      key: "equipment",
    },
    {
      title: "Initial Operations Date",
      dataIndex: ["equipment", "initialOperationsDate"],
      key: "initialOperationsDate",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Area",
      dataIndex: ["area", "name"],
      key: "area",
    },
    {
      title: "Plant",
      dataIndex: ["plant", "name"],
      key: "plant",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {/* <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingEquipment(record);
              form.setFieldsValue({
                ...record,
                initialOperationsDate: dayjs(record.initialOperationsDate),
              });
              setIsModalVisible(true);
            }}
          /> */}
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              Modal.confirm({
                title: "Are you sure you want to delete this maintenance?",
                onOk: () => deleteMutation.mutate(record.id),
              });
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#fff" }}>
      <div style={{ marginBottom: 16 }}>
        <Space
          size="large"
          wrap
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <Input
            placeholder="Filter by name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            style={{ width: 200 }}
          />
          <Select
            style={{ width: 200 }}
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
            style={{ width: 200 }}
            placeholder="Filter by equipment"
            allowClear
            value={filters.equipmentId || undefined}
            onChange={(value) => setFilters({ ...filters, equipmentId: value })}
          >
            {equipment?.map((eq) => (
              <Select.Option key={eq.id} value={eq.id}>
                {eq.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            style={{ width: 200 }}
            placeholder="Filter by Area"
            allowClear
            value={filters.type || undefined}
            onChange={(value) => setFilters({ ...filters, areaId: value })}
          >
            {areas?.map((area) => (
              <Select.Option key={area.id} value={area.id}>
                {area.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            style={{ width: 200 }}
            placeholder="Filter by Plant"
            allowClear
            value={filters.plantId || undefined}
            onChange={(value) => setFilters({ ...filters, plantId: value })}
          >
            {plants?.map((plant) => (
              <Select.Option key={plant.id} value={plant.id}>
                {plant.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            style={{ width: 200 }}
            placeholder="Filter by Part"
            allowClear
            value={filters.partId || undefined}
            onChange={(value) => setFilters({ ...filters, partId: value })}
          >
            {parts?.map((part) => (
              <Select.Option key={part.id} value={part.id}>
                {part.name}
              </Select.Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            // onClick={() => {
            //   setEditingPart(null);
            //   form.resetFields();
            //   setIsModalVisible(true);
            // }}
          >
            Add Maintenance
          </Button>
          <Button
            icon={<CalendarOutlined />}
            onClick={() => {
              router.push("/maintenance/calendar");
            }}
          >
            Calendar
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredMaintenances}
        loading={
          maintenanceLoading ||
          equipmentLoading ||
          areaLoading ||
          plantsLoading ||
          partsLoading
        }
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />

      <ModalCreateUpdate />
    </div>
  );
}

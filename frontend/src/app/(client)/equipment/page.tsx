"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Space,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { equipmentApi, areaApi, Equipment, Area } from "@/services/api";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RightOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";

export default function EquipmentPage() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null
  );
  const [filters, setFilters] = useState({
    name: "",
    areaId: "",
    manufacturer: "",
  });
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const areaId = searchParams.get("areaId");

  const { data: equipment, isLoading: equipmentLoading } = useQuery(
    "equipment",
    () => equipmentApi.getAll().then((res) => res.data)
  );

  const { data: areas, isLoading: areasLoading } = useQuery("areas", () =>
    areaApi.getAll().then((res) => res.data)
  );

  // Set initial area filter if areaId is provided
  useEffect(() => {
    if (areaId) {
      setFilters((prev) => ({ ...prev, areaId }));
    }
  }, [areaId]);

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

  const deleteMutation = useMutation((id: string) => equipmentApi.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries("equipment");
      message.success("Equipment deleted successfully");
    },
  });

  const filteredEquipment = equipment?.filter((eq) => {
    const nameMatch = eq.name
      .toLowerCase()
      .includes(filters.name.toLowerCase());
    const areaMatch = !filters.areaId || eq.areaId === filters.areaId;
    const manufacturerMatch = eq.manufacturer
      .toLowerCase()
      .includes(filters.manufacturer.toLowerCase());
    return nameMatch && areaMatch && manufacturerMatch;
  });

  const columns: TableProps<Equipment>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Manufacturer",
      dataIndex: "manufacturer",
      key: "manufacturer",
      sorter: (a, b) => a.manufacturer.localeCompare(b.manufacturer),
    },
    {
      title: "Serial Number",
      dataIndex: "serialNumber",
      key: "serialNumber",
    },
    {
      title: "Initial Operations Date",
      dataIndex: "initialOperationsDate",
      key: "initialOperationsDate",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
      sorter: (a, b) =>
        dayjs(a.initialOperationsDate).unix() -
        dayjs(b.initialOperationsDate).unix(),
    },
    {
      title: "Area",
      dataIndex: ["area", "name"],
      key: "area",
      sorter: (a, b) => (a.area?.name || "").localeCompare(b.area?.name || ""),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingEquipment(record);
              form.setFieldsValue({
                ...record,
                initialOperationsDate: dayjs(record.initialOperationsDate),
              });
              setIsModalVisible(true);
            }}
          />
          <Button
            icon={<RightOutlined />}
            onClick={() => {
              router.push(`/parts?equipmentId=${record.id}`);
            }}
          >
            Parts
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              Modal.confirm({
                title: "Are you sure you want to delete this equipment?",
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
        <Space size="large">
          <Input
            placeholder="Filter by name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            style={{ width: 200 }}
          />
          <Select
            style={{ width: 200 }}
            placeholder="Filter by area"
            allowClear
            value={filters.areaId || undefined}
            onChange={(value) => setFilters({ ...filters, areaId: value })}
          >
            {areas?.map((area) => (
              <Select.Option key={area.id} value={area.id}>
                {area.name}
              </Select.Option>
            ))}
          </Select>
          <Input
            placeholder="Filter by manufacturer"
            value={filters.manufacturer}
            onChange={(e) =>
              setFilters({ ...filters, manufacturer: e.target.value })
            }
            style={{ width: 200 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingEquipment(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Add Equipment
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredEquipment}
        loading={equipmentLoading || areasLoading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />

      <Modal
        title={editingEquipment ? "Edit Equipment" : "Add Equipment"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingEquipment(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={(values) => {
            const data = {
              ...values,
              initialOperationsDate:
                values.initialOperationsDate.format("YYYY-MM-DD"),
            };
            if (editingEquipment) {
              updateMutation.mutate({ id: editingEquipment.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please input the equipment name!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="manufacturer"
            label="Manufacturer"
            rules={[
              { required: true, message: "Please input the manufacturer!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="serialNumber"
            label="Serial Number"
            rules={[
              { required: true, message: "Please input the serial number!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="initialOperationsDate"
            label="Initial Operations Date"
            rules={[
              {
                required: true,
                message: "Please select the initial operations date!",
              },
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="areaId"
            label="Area"
            rules={[{ required: true, message: "Please select an area!" }]}
          >
            <Select>
              {areas?.map((area) => (
                <Select.Option key={area.id} value={area.id}>
                  {area.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingEquipment ? "Update" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

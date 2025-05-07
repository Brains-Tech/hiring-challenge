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
import { partApi, equipmentApi, Part, PartType } from "@/services/api";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";

export default function PartsPage() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [filters, setFilters] = useState({
    name: "",
    equipmentId: "",
    type: "",
  });
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const equipmentId = searchParams.get("equipmentId");

  const { data: parts, isLoading: partsLoading } = useQuery("parts", () =>
    partApi.getAll().then((res) => res.data)
  );

  const { data: equipment, isLoading: equipmentLoading } = useQuery(
    "equipment",
    () => equipmentApi.getAll().then((res) => res.data)
  );

  // Set initial equipment filter if equipmentId is provided
  useEffect(() => {
    if (equipmentId) {
      setFilters((prev) => ({ ...prev, equipmentId }));
    }
  }, [equipmentId]);

  const createMutation = useMutation(
    (data: Omit<Part, "id" | "createdAt" | "updatedAt">) =>
      partApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("parts");
        message.success("Part created successfully");
        setIsModalVisible(false);
        form.resetFields();
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<Part> }) =>
      partApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("parts");
        message.success("Part updated successfully");
        setIsModalVisible(false);
        form.resetFields();
        setEditingPart(null);
      },
    }
  );

  const deleteMutation = useMutation((id: string) => partApi.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries("parts");
      message.success("Part deleted successfully");
    },
  });

  const filteredParts = parts?.filter((part) => {
    const nameMatch = part.name
      .toLowerCase()
      .includes(filters.name.toLowerCase());
    const equipmentMatch =
      !filters.equipmentId || part.equipmentId === filters.equipmentId;
    const typeMatch = !filters.type || part.type === filters.type;
    return nameMatch && equipmentMatch && typeMatch;
  });

  const columns: TableProps<Part>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      sorter: (a, b) => a.type.localeCompare(b.type),
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
      title: "Installation Date",
      dataIndex: "installationDate",
      key: "installationDate",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
      sorter: (a, b) =>
        dayjs(a.installationDate).unix() - dayjs(b.installationDate).unix(),
    },
    {
      title: "Equipment",
      dataIndex: ["equipment", "name"],
      key: "equipment",
      sorter: (a, b) =>
        (a.equipment?.name || "").localeCompare(b.equipment?.name || ""),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingPart(record);
              form.setFieldsValue({
                ...record,
                installationDate: dayjs(record.installationDate),
              });
              setIsModalVisible(true);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              Modal.confirm({
                title: "Are you sure you want to delete this part?",
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
            placeholder="Filter by type"
            allowClear
            value={filters.type || undefined}
            onChange={(value) => setFilters({ ...filters, type: value })}
          >
            {Object.values(PartType).map((type) => (
              <Select.Option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Select.Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingPart(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Add Part
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredParts}
        loading={partsLoading || equipmentLoading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />

      <Modal
        title={editingPart ? "Edit Part" : "Add Part"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingPart(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={(values) => {
            const data = {
              ...values,
              installationDate: values.installationDate.format("YYYY-MM-DD"),
            };
            if (editingPart) {
              updateMutation.mutate({ id: editingPart.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input the part name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: "Please select a type!" }]}
          >
            <Select>
              {Object.values(PartType).map((type) => (
                <Select.Option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Select.Option>
              ))}
            </Select>
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
            name="installationDate"
            label="Installation Date"
            rules={[
              {
                required: true,
                message: "Please select the installation date!",
              },
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="equipmentId"
            label="Equipment"
            rules={[{ required: true, message: "Please select an equipment!" }]}
          >
            <Select>
              {equipment?.map((eq) => (
                <Select.Option key={eq.id} value={eq.id}>
                  {eq.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingPart ? "Update" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

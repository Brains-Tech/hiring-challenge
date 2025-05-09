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
import { areaApi, plantApi, Area, Plant } from "@/services/api";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RightOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import { useSearchParams, useRouter } from "next/navigation";

export default function AreasPage() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [filters, setFilters] = useState({ name: "", plantId: "" });
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const plantId = searchParams.get("plantId");

  const { data: areas, isLoading: areasLoading } = useQuery("areas", () =>
    areaApi.getAll().then((res) => res.data)
  );

  const { data: plants, isLoading: plantsLoading } = useQuery("plants", () =>
    plantApi.getAll().then((res) => res.data)
  );

  // Set initial plant filter if plantId is provided
  useEffect(() => {
    if (plantId) {
      setFilters((prev) => ({ ...prev, plantId }));
    }
  }, [plantId]);

  const createMutation = useMutation(
    (data: Omit<Area, "id" | "createdAt" | "updatedAt">) =>
      areaApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("areas");
        message.success("Area created successfully");
        setIsModalVisible(false);
        form.resetFields();
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<Area> }) =>
      areaApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("areas");
        message.success("Area updated successfully");
        setIsModalVisible(false);
        form.resetFields();
        setEditingArea(null);
      },
    }
  );

  const deleteMutation = useMutation((id: string) => areaApi.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries("areas");
      message.success("Area deleted successfully");
    },
  });

  const filteredAreas = areas?.filter((area) => {
    const nameMatch = area.name
      .toLowerCase()
      .includes(filters.name.toLowerCase());
    const plantMatch = !filters.plantId || area.plantId === filters.plantId;
    return nameMatch && plantMatch;
  });

  const columns: TableProps<Area>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Location Description",
      dataIndex: "locationDescription",
      key: "locationDescription",
    },
    {
      title: "Plant",
      dataIndex: ["plant", "name"],
      key: "plant",
      sorter: (a, b) =>
        (a.plant?.name || "").localeCompare(b.plant?.name || ""),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingArea(record);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          />
          <Button
            icon={<RightOutlined />}
            onClick={() => {
              router.push(`/equipment?areaId=${record.id}`);
            }}
          >
            Equipment
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              Modal.confirm({
                title: "Are you sure you want to delete this area?",
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
            placeholder="Filter by plant"
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingArea(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Add Area
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredAreas}
        loading={areasLoading || plantsLoading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />

      <Modal
        title={editingArea ? "Edit Area" : "Add Area"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingArea(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={(values) => {
            if (editingArea) {
              updateMutation.mutate({ id: editingArea.id, data: values });
            } else {
              createMutation.mutate(values);
            }
          }}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input the area name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="locationDescription"
            label="Location Description"
            rules={[
              {
                required: true,
                message: "Please input the location description!",
              },
            ]}
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item
            name="plantId"
            label="Plant"
            rules={[{ required: true, message: "Please select a plant!" }]}
          >
            <Select>
              {plants?.map((plant) => (
                <Select.Option key={plant.id} value={plant.id}>
                  {plant.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingArea ? "Update" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

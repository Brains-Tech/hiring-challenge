"use client";

import { useState } from "react";
import { Table, Button, Modal, Form, Input, message, Space } from "antd";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { plantApi, Plant } from "@/services/api";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RightOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import { useRouter } from "next/navigation";

export default function PlantsPage() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: plants, isLoading } = useQuery("plants", () =>
    plantApi.getAll().then((res) => res.data)
  );

  const createMutation = useMutation(
    (data: Omit<Plant, "id" | "createdAt" | "updatedAt">) =>
      plantApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("plants");
        message.success("Plant created successfully");
        setIsModalVisible(false);
        form.resetFields();
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<Plant> }) =>
      plantApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("plants");
        message.success("Plant updated successfully");
        setIsModalVisible(false);
        form.resetFields();
        setEditingPlant(null);
      },
    }
  );

  const deleteMutation = useMutation((id: string) => plantApi.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries("plants");
      message.success("Plant deleted successfully");
    },
  });

  const filteredPlants = plants?.filter((plant) =>
    plant.name.toLowerCase().includes(nameFilter.toLowerCase())
  );

  const columns: TableProps<Plant>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingPlant(record);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          />
          <Button
            icon={<RightOutlined />}
            onClick={() => {
              router.push(`/areas?plantId=${record.id}`);
            }}
          >
            Areas
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              Modal.confirm({
                title: "Are you sure you want to delete this plant?",
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
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            style={{ width: 200 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingPlant(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Add Plant
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredPlants}
        loading={isLoading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />

      <Modal
        title={editingPlant ? "Edit Plant" : "Add Plant"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingPlant(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={(values) => {
            if (editingPlant) {
              updateMutation.mutate({ id: editingPlant.id, data: values });
            } else {
              createMutation.mutate(values);
            }
          }}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please input the plant name!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[
              { required: true, message: "Please input the plant address!" },
            ]}
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingPlant ? "Update" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

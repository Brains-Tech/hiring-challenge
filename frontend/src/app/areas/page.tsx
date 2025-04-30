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
  Tabs,
  Card,
  Typography,
  Tag,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { areaApi, plantApi, Area, Plant } from "@/services/api";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RightOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import { useSearchParams, useRouter } from "next/navigation";
import NeighborAreasManager from "@/components/NeighborAreasManager";

const { TabPane } = Tabs;

export default function AreasPage() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
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

  // Fetch area details when selected
  const { data: areaDetails, isLoading: detailsLoading } = useQuery(
    ["area-details", selectedArea?.id],
    () => areaApi.getById(selectedArea?.id || "").then(res => res.data),
    { enabled: !!selectedArea?.id }
  );

  // Fetch neighbor areas
  const { data: neighborAreas, isLoading: neighborsLoading } = useQuery(
    ["area-neighbors", selectedArea?.id],
    () => areaApi.getAreaNeighbors(selectedArea?.id || "").then(res => res.data),
    { enabled: !!selectedArea?.id }
  );

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
      title: "Neighbors",
      key: "neighbors",
      render: (_, record) => {
        // Use apenas neighborRelations para contar (assumindo que é bidirecional)
        const neighborCount = record.neighborRelations?.length || 0;
        
        return neighborCount > 0 ? (
          <Button
            type="link"
            onClick={() => {
              setSelectedArea(record);
              setDetailsModalVisible(true);
            }}
          >
            {neighborCount} neighbor{neighborCount > 1 ? 's' : ''}
          </Button>
        ) : (
          <Tag color="default">No neighbors</Tag>
        );
      }
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
            icon={<LinkOutlined />}
            onClick={() => {
              setSelectedArea(record);
              setDetailsModalVisible(true);
            }}
          >
            Manage
          </Button>
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

      {/* Area Create/Edit Modal */}
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

      {/* Area Details Modal with Neighbors Management */}
      <Modal
        title={`Area Details: ${selectedArea?.name}`}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedArea(null);
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedArea && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="Info" key="1">
              <Card loading={detailsLoading}>
                {areaDetails && (
                  <>
                    <p><strong>Name:</strong> {areaDetails.name}</p>
                    <p><strong>Location Description:</strong> {areaDetails.locationDescription}</p>
                    <p><strong>Plant:</strong> {areaDetails.plant?.name}</p>
                    
                    <div style={{ marginTop: 16 }}>
                      <Typography.Title level={5}>Neighboring Areas</Typography.Title>
                      {neighborsLoading ? (
                        <p>Loading neighbors...</p>
                      ) : (
                        <>
                          {neighborAreas && neighborAreas.length > 0 ? (
                            <div>
                              {neighborAreas.map((area) => (
                                <Tag key={area.id} style={{ margin: '0 8px 8px 0' }}>
                                  {area.name}
                                </Tag>
                              ))}
                            </div>
                          ) : (
                            <p>No neighboring areas defined</p>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </TabPane>
            <TabPane tab="Manage Neighbors" key="2">
              {selectedArea && (
                <NeighborAreasManager 
                  areaId={selectedArea.id} 
                  plantId={selectedArea.plantId} 
                />
              )}
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
}
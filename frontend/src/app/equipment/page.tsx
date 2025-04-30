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
  Tabs,
  Card,
  Tag,
  Typography
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
import EquipmentAreasManager from "@/components/EquipmentAreasManager";

const { TabPane } = Tabs;

export default function EquipmentPage() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
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
      onSuccess: (res) => {
        queryClient.invalidateQueries("equipment");
        message.success("Equipment created successfully");
        setIsModalVisible(false);
        form.resetFields();
        
        // Optionally, open the areas manager for the new equipment
        const newEquipmentId = res.data.id;
        if (newEquipmentId) {
          setSelectedEquipment(res.data);
          setDetailsModalVisible(true);
        }
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
    const areaMatch = !filters.areaId || 
      // Check if this equipment has an area relation with the filtered area
      (eq.areaRelations && 
        eq.areaRelations.some(relation => relation.areaId === filters.areaId));
    const manufacturerMatch = eq.manufacturer
      .toLowerCase()
      .includes(filters.manufacturer.toLowerCase());
    return nameMatch && areaMatch && manufacturerMatch;
  });

  // Fetch equipment details including areas when selected
  const { data: equipmentDetails, isLoading: detailsLoading } = useQuery(
    ["equipment-details", selectedEquipment?.id],
    () => equipmentApi.getById(selectedEquipment?.id || "").then(res => res.data),
    { enabled: !!selectedEquipment?.id }
  );

  // Fetch primary area for the selected equipment
  const { data: primaryArea, isLoading: primaryAreaLoading } = useQuery(
    ["equipment-primary-area", selectedEquipment?.id],
    () => equipmentApi.getPrimaryArea(selectedEquipment?.id || "").then(res => res.data),
    { enabled: !!selectedEquipment?.id }
  );

  // Fetch all areas for the selected equipment
  const { data: equipmentAreas, isLoading: areasForEquipmentLoading } = useQuery(
    ["equipment-areas", selectedEquipment?.id],
    () => equipmentApi.getEquipmentAreas(selectedEquipment?.id || "").then(res => res.data),
    { enabled: !!selectedEquipment?.id }
  );

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
      title: "Areas",
      key: "areas",
      render: (_, record) => {
        if (record.areaRelations && record.areaRelations.length > 0) {
          // Encontramos a área primária
          const primaryArea = record.areaRelations.find(relation => relation.isPrimary);
          const otherAreas = record.areaRelations.filter(relation => !relation.isPrimary);
          
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
              {primaryArea && (
                <Tag color="blue">
                  {primaryArea.area?.name} <small>(Primary)</small>
                </Tag>
              )}
              {otherAreas.map(relation => (
                <Tag key={relation.areaId}>{relation.area?.name}</Tag>
              ))}
            </div>
          );
        } else if (record.area) {
          // Compatibilidade com o formato anterior
          return <Tag>{record.area.name}</Tag>;
        } else {
          return <Tag color="default">No areas</Tag>;
        }
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
              setEditingEquipment(record);
              form.setFieldsValue({
                ...record,
                initialOperationsDate: dayjs(record.initialOperationsDate),
                // No longer need areaId as equipment can be in multiple areas
              });
              setIsModalVisible(true);
            }}
          />
          <Button
            onClick={() => {
              setSelectedEquipment(record);
              setDetailsModalVisible(true);
            }}
          >
            Manage Areas
          </Button>
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

      {/* Equipment Create/Edit Modal */}
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

          {/* Initial area is optional now since areas will be managed separately */}
          <Form.Item
            name="areaId"
            label="Initial Area (Optional)"
            extra="You can manage multiple areas after creating the equipment"
          >
            <Select allowClear>
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

      {/* Equipment Details Modal with Areas Management */}
      <Modal
        title={`Equipment Details: ${selectedEquipment?.name}`}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedEquipment(null);
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedEquipment && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="Info" key="1">
              <Card loading={detailsLoading}>
                {equipmentDetails && (
                  <>
                    <p><strong>Name:</strong> {equipmentDetails.name}</p>
                    <p><strong>Manufacturer:</strong> {equipmentDetails.manufacturer}</p>
                    <p><strong>Serial Number:</strong> {equipmentDetails.serialNumber}</p>
                    <p><strong>Initial Operations Date:</strong> {dayjs(equipmentDetails.initialOperationsDate).format('YYYY-MM-DD')}</p>
                    
                    <div style={{ marginTop: 16 }}>
                      <Typography.Title level={5}>Areas</Typography.Title>
                      {areasForEquipmentLoading ? (
                        <p>Loading areas...</p>
                      ) : (
                        <div>
                          {primaryArea && (
                            <div style={{ marginBottom: 8 }}>
                              <Typography.Text strong>Primary Area: </Typography.Text>
                              <Tag color="blue">{primaryArea.name}</Tag>
                            </div>
                          )}
                          
                          {equipmentAreas && equipmentAreas.length > 0 ? (
                            <div>
                              <Typography.Text strong>All Areas: </Typography.Text>
                              <div style={{ marginTop: 8 }}>
                                {equipmentAreas.map((area) => (
                                  <Tag 
                                    key={area.id} 
                                    color={primaryArea?.id === area.id ? "blue" : undefined}
                                  >
                                    {area.name}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p>No areas assigned</p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </TabPane>
            <TabPane tab="Manage Areas" key="2">
              {selectedEquipment && (
                <EquipmentAreasManager 
                  equipmentId={selectedEquipment.id} 
                  onSaved={() => {
                    // Refresh equipment data
                    queryClient.invalidateQueries("equipment");
                    queryClient.invalidateQueries(["equipment-details", selectedEquipment.id]);
                    queryClient.invalidateQueries(["equipment-areas", selectedEquipment.id]);
                    queryClient.invalidateQueries(["equipment-primary-area", selectedEquipment.id]);
                  }}
                />
              )}
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
}
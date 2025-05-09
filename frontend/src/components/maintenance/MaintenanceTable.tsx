"use client";

import { Table, Button, Modal, Space, FormInstance } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { capitalize } from "@/utils/capitalize";
import {
  sortString,
  sortDate,
  sortNestedString,
  sortNestedDate,
} from "@/utils/sorters";
import { Maintenance } from "@/services/api";
import type { TableProps } from "antd";
import { useMemo } from "react";

type Props = {
  data: Maintenance[];
  filters: any;
  loading: boolean;
  setEditingMaintenance: (maintenance: Maintenance | null) => void;
  setIsModalVisible: (value: boolean) => void;
  deleteMutation: any;
  form: FormInstance;
};

export const MaintenanceTable = ({
  data,
  filters,
  loading,
  setEditingMaintenance,
  setIsModalVisible,
  deleteMutation,
  form,
}: Props) => {
  function matchesFilters(item: Maintenance): boolean {
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

  const filteredData = useMemo(
    () => data.filter((item) => matchesFilters(item)),
    [data, filters]
  );

  const columns: TableProps<Maintenance>["columns"] = [
    {
      title: "Name",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => sortString(a.title, b.title),
    },
    {
      title: "Scheduled Date",
      dataIndex: "scheduledDate",
      key: "scheduledDate",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) => sortDate(a.scheduledDate, b.scheduledDate),
    },
    {
      title: "Recurrence",
      dataIndex: "recurrence",
      key: "recurrence",
      sorter: (a, b) => sortString(a.recurrence, b.recurrence),
      render: (value) => capitalize(value),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) => sortDate(a.dueDate, b.dueDate),
    },
    {
      title: "Part",
      dataIndex: ["part", "name"],
      key: "part",
      sorter: (a, b) => sortNestedString(a, b, ["part", "name"]),
    },
    {
      title: "Installation Part Date",
      dataIndex: ["part", "installationDate"],
      key: "installationDate",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) => sortNestedDate(a, b, ["part", "installationDate"]),
    },
    {
      title: "Equipment",
      dataIndex: ["equipment", "name"],
      key: "equipment",
      sorter: (a, b) => sortNestedString(a, b, ["equipment", "name"]),
    },
    {
      title: "Initial Operations Date",
      dataIndex: ["equipment", "initialOperationsDate"],
      key: "initialOperationsDate",
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) =>
        sortNestedDate(a, b, ["equipment", "initialOperationsDate"]),
    },
    {
      title: "Area",
      dataIndex: ["area", "name"],
      key: "area",
      sorter: (a, b) => sortNestedString(a, b, ["area", "name"]),
    },
    {
      title: "Plant",
      dataIndex: ["plant", "name"],
      key: "plant",
      sorter: (a, b) => sortNestedString(a, b, ["plant", "name"]),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingMaintenance(record);
              form.setFieldsValue({
                ...record,
                scheduledDate: record.scheduledDate
                  ? dayjs(record.scheduledDate)
                  : undefined,
                scheduleType: record.scheduledDate ? "scheduled" : "recurrence",
                partId: record.part?.id,
              });
              setIsModalVisible(true);
            }}
          />
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
    <Table
      columns={columns}
      dataSource={filteredData}
      loading={loading}
      rowKey="id"
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} items`,
      }}
    />
  );
};

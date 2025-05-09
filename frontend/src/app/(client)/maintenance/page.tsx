"use client";

import { useState, useEffect, useMemo } from "react";
import { Table, Button, Modal, Form, message, Space } from "antd";
import { useQuery } from "react-query";
import {
  equipmentApi,
  areaApi,
  Maintenance,
  maintenanceApi,
  plantApi,
  partApi,
  CreateUpdateMaintenanceDTO,
} from "@/services/api";
import {
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { useSearchParams, useRouter } from "next/navigation";
import { capitalize } from "@/utils/capitalize";
import { ModalCreateUpdate } from "@/components/maintenance/ModalCreateUpdate";
import {
  sortString,
  sortDate,
  sortNestedString,
  sortNestedDate,
} from "@/utils/sorters";
import { MaintenanceFilters } from "@/components/maintenance/MaintenanceFilters";
import { useMaintenanceMutations } from "@/hooks/mutations/useMaintenanceMutations";
import { MaintenanceTable } from "@/components/maintenance/MaintenanceTable";

interface Filters {
  name: string;
  equipmentId: string;
  type: string;
  areaId: string;
  plantId: string;
  partId: string;
  maintenanceId: string;
}

export default function MaintenancePage() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMaintenance, setEditingMaintenance] =
    useState<Maintenance | null>(null);

  const [filters, setFilters] = useState<Filters>({
    name: "",
    equipmentId: "",
    type: "",
    areaId: "",
    plantId: "",
    partId: "",
    maintenanceId: "",
  });

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

  useEffect(() => {
    if (partId || maintenanceId || equipmentId) {
      setFilters((prev) => ({
        ...prev,
        ...(partId && { partId }),
        ...(maintenanceId && { maintenanceId }),
        ...(equipmentId && { equipmentId }),
      }));
    }
  }, [partId, maintenanceId, equipmentId]);

  const { createMutation, updateMutation, deleteMutation } =
    useMaintenanceMutations({
      onSuccessCreate: () => {
        setIsModalVisible(false);
        form.resetFields();
      },
      onSuccessUpdate: () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingMaintenance(null);
      },
      onSuccessDelete: () => {
        router.refresh();
      },
    });

  return (
    <div style={{ padding: 24, background: "#fff" }}>
      <div style={{ marginBottom: 16 }}>
        <MaintenanceFilters
          filters={filters}
          setFilters={setFilters}
          equipment={equipment}
          areas={areas}
          plants={plants}
          parts={parts}
          onAdd={() => {
            setEditingMaintenance(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
          onCalendar={() => router.push("/maintenance/calendar")}
        />
      </div>

      <MaintenanceTable
        data={maintenances || []}
        filters={filters}
        loading={
          maintenanceLoading ||
          equipmentLoading ||
          areaLoading ||
          plantsLoading ||
          partsLoading
        }
        setEditingMaintenance={setEditingMaintenance}
        setIsModalVisible={setIsModalVisible}
        deleteMutation={deleteMutation}
        form={form}
      />

      <ModalCreateUpdate
        createMutate={createMutation.mutate}
        updateMutate={updateMutation.mutate}
        isEdit={!!editingMaintenance}
        form={form}
        parts={parts || []}
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        setEditingMaintenance={setEditingMaintenance}
        editingMaintenance={editingMaintenance}
      />
    </div>
  );
}

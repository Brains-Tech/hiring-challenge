"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  DatePicker,
  message,
  FormInstance,
} from "antd";
import {
  MaintenanceRecurrenceEnum,
  CreateUpdateMaintenanceDTO,
  Part,
  Maintenance,
} from "@/services/api";
import dayjs from "dayjs";
import { useWatch } from "antd/es/form/Form";
import { capitalize } from "@/utils/capitalize";

interface ModalCreateUpdateProps {
  isModalVisible: boolean;
  setIsModalVisible: (value: boolean) => void;
  form: FormInstance;
  parts: Part[];
  isEdit: boolean;
  createMutate: (data: CreateUpdateMaintenanceDTO) => void;
  updateMutate: (payload: {
    id: string;
    data: CreateUpdateMaintenanceDTO;
  }) => void;
  setEditingMaintenance: (value: Maintenance | null) => void;
  editingMaintenance: Maintenance | null;
}

export const ModalCreateUpdate = ({
  isModalVisible,
  setIsModalVisible,
  form,
  parts,
  isEdit,
  createMutate,
  updateMutate,
  setEditingMaintenance,
  editingMaintenance,
}: ModalCreateUpdateProps) => {
  const [loading, setLoading] = useState(false);
  const currentScheduleType = useWatch("scheduleType", form);
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const values = await form.validateFields();
      const { scheduleType, ...rest } = values;

      const isScheduled = scheduleType === "scheduled";
      const isRecurring = scheduleType === "recurrence";

      const payload: CreateUpdateMaintenanceDTO = {
        ...rest,
        ...(isScheduled && {
          scheduledDate: dayjs(values.scheduledDate).format("YYYY-MM-DD"),
        }),
        recurrence: isRecurring
          ? values.recurrence
          : MaintenanceRecurrenceEnum.NONE,
      };

      if (isEdit) {
        updateMutate({ id: editingMaintenance?.id || "", data: payload });
      } else {
        createMutate(payload);
      }
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }

      console.error(error);
      message.error(error?.message || "Failed to save maintenance");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setEditingMaintenance(null);
    setIsModalVisible(false);
  };

  return (
    <Modal
      title={isEdit ? "Edit Maintenance" : "Create Maintenance"}
      open={isModalVisible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Save"
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter the title" }]}
        >
          <Input placeholder="Enter maintenance title" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Please enter the description" }]}
        >
          <Input.TextArea placeholder="Enter maintenance description" />
        </Form.Item>

        <Form.Item
          label="Schedule Type"
          name="scheduleType"
          rules={[{ required: true, message: "Please select schedule type" }]}
        >
          <Radio.Group>
            <Radio value="recurrence">Recurring</Radio>
            <Radio value="scheduled">Specific Date</Radio>
          </Radio.Group>
        </Form.Item>

        {currentScheduleType === "recurrence" ? (
          <Form.Item
            label="Recurrence"
            name="recurrence"
            rules={[
              {
                required: true,
                message: "Please select recurrence",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const scheduleType = getFieldValue("scheduleType");
                  if (
                    scheduleType === "recurrence" &&
                    value === MaintenanceRecurrenceEnum.NONE
                  ) {
                    return Promise.reject(
                      new Error("Please select a valid recurrence type")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Select placeholder="Select recurrence">
              {Object.values(MaintenanceRecurrenceEnum)
                .filter((type) => type !== MaintenanceRecurrenceEnum.NONE)
                .map((type) => (
                  <Select.Option key={type} value={type}>
                    {capitalize(type)}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        ) : (
          <Form.Item
            label="Scheduled Date"
            name="scheduledDate"
            rules={[{ required: true, message: "Please select the date" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        )}

        <Form.Item
          label="Part"
          name="partId"
          rules={[{ required: true, message: "Please select a part" }]}
        >
          <Select placeholder="Select part">
            {parts.map((part) => (
              <Select.Option key={part.id} value={part.id}>
                {part.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

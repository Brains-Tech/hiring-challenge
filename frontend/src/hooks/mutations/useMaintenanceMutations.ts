import { useMutation, useQueryClient } from "react-query";
import { maintenanceApi, CreateUpdateMaintenanceDTO } from "@/services/api";
import { message } from "antd";

export const useMaintenanceMutations = ({
    onSuccessCreate,
    onSuccessUpdate,
    onSuccessDelete,
}: {
    onSuccessCreate?: VoidFunction;
    onSuccessUpdate?: VoidFunction;
    onSuccessDelete?: VoidFunction;
}) => {
    const queryClient = useQueryClient();

    const createMutation = useMutation(
        (data: CreateUpdateMaintenanceDTO) => maintenanceApi.create(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries("maintenance");
                message.success("Maintenance created successfully");
                onSuccessCreate?.();
            },
        }
    );

    const updateMutation = useMutation(
        ({ id, data }: { id: string; data: CreateUpdateMaintenanceDTO }) =>
            maintenanceApi.update(id, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries("maintenance");
                message.success("Maintenance updated successfully");
                onSuccessUpdate?.();
            },
        }
    );

    const deleteMutation = useMutation(
        (id: string) => maintenanceApi.delete(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries("maintenance");
                message.success("Maintenance deleted successfully");
                onSuccessDelete?.();
            },
        }
    );

    return {
        createMutation,
        updateMutation,
        deleteMutation,
    };
};

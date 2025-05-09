"use client";

import { Maintenance, maintenanceApi } from "@/services/api";
import { Badge, Calendar, CalendarProps, Skeleton } from "antd";
import { useQuery } from "react-query";
import { useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";

export default function CalendarPage() {
  const router = useRouter();

  const { data: maintenances, isLoading: maintenanceLoading } = useQuery(
    "maintenance",
    () => maintenanceApi.getAll().then((res) => res.data)
  );

  const getListData = (date: Dayjs): Maintenance[] => {
    if (!maintenances) return [];
    return maintenances.filter(
      (item) => item.dueDate && dayjs(item.dueDate).isSame(date, "day")
    );
  };

  const cellRender: CalendarProps<Dayjs>["cellRender"] = (current, info) => {
    if (info.type !== "date") return null;

    const listData = getListData(current);

    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {listData.map((item) => (
          <li key={item.id}>
            <Badge status="processing" text={item.title} />
          </li>
        ))}
      </ul>
    );
  };

  const handleSelectDate = (date: Dayjs) => {
    const match = getListData(date)[0]; // Pega a primeira manutenção do dia
    if (match) {
      router.push(`/maintenance?maintenanceId=${match.id}`);
    }
  };

  return (
    <>
      {maintenanceLoading ? (
        <>
          <Skeleton />
          <Skeleton />
        </>
      ) : (
        <div style={{ padding: "20px" }}>
          <h1>Calendar</h1>
          <Calendar cellRender={cellRender} onSelect={handleSelectDate} />
        </div>
      )}
    </>
  );
}

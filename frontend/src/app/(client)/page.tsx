"use client";

import React from "react";
import { Card, Row, Col, Statistic } from "antd";
import { useQuery } from "react-query";
import { plantApi, areaApi, equipmentApi, partApi } from "@/services/api";
import {
  AppstoreOutlined,
  ToolOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import Link from "next/link";

export default function DashboardPage() {
  const { data: plants } = useQuery("plants", () =>
    plantApi.getAll().then((res) => res.data)
  );
  const { data: areas } = useQuery("areas", () =>
    areaApi.getAll().then((res) => res.data)
  );
  const { data: equipment } = useQuery("equipment", () =>
    equipmentApi.getAll().then((res) => res.data)
  );
  const { data: parts } = useQuery("parts", () =>
    partApi.getAll().then((res) => res.data)
  );

  return (
    <div>
      <h1>Dashboard</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Link href="/plants">
            <Card hoverable>
              <Statistic
                title="Plants"
                value={plants?.length || 0}
                prefix={<AppstoreOutlined />}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Link href="/areas">
            <Card hoverable>
              <Statistic
                title="Areas"
                value={areas?.length || 0}
                prefix={<AppstoreOutlined />}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Link href="/equipment">
            <Card hoverable>
              <Statistic
                title="Equipment"
                value={equipment?.length || 0}
                prefix={<ToolOutlined />}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Link href="/parts">
            <Card hoverable>
              <Statistic
                title="Parts"
                value={parts?.length || 0}
                prefix={<SettingOutlined />}
              />
            </Card>
          </Link>
        </Col>
      </Row>
    </div>
  );
}

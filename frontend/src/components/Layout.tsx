import React from "react";
import { Layout, Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeOutlined,
  AppstoreOutlined,
  ToolOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: "Dashboard",
    },
    {
      key: "/plants",
      icon: <AppstoreOutlined />,
      label: "Plants",
    },
    {
      key: "/areas",
      icon: <AppstoreOutlined />,
      label: "Areas",
    },
    {
      key: "/equipment",
      icon: <ToolOutlined />,
      label: "Equipment",
    },
    {
      key: "/parts",
      icon: <SettingOutlined />,
      label: "Parts",
    },
    {
      key: "/tasks",
      icon: <CheckCircleOutlined />,
      label: "Tasks",
    }
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ padding: 0, background: "#073b67", color: "#fff" }}>
        <div
          style={{
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            height: "100%",
          }}
        >
          <img
            src="/images/logo-opwell.png"
            alt="Opwell Logo"
            style={{ height: "30px", width: "auto" }}
          />
          <span style={{ fontSize: "20px", fontWeight: "bold" }}>
            Asset Management
          </span>
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: "#073b67" }}>
          <Menu
            mode="inline"
            selectedKeys={[pathname || "/"]}
            style={{ height: "100%", borderRight: 0, background: "#073b67" }}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            theme="dark"
          />
        </Sider>
        <Layout style={{ padding: 0 }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: "#fff",
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
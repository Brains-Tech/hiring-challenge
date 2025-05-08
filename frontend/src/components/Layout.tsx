import React, { useEffect, useState } from "react";
import { Avatar, Layout, Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

import {
  HomeOutlined,
  AppstoreOutlined,
  ToolOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { deleteCookie, getCookie } from "cookies-next";
import { User } from "@/services/api";

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User>();

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
      key: "/maintenance",
      icon: <ToolOutlined />,
      label: "Maintenances",
    },
  ];

  function getFirstTwoUppercase(str: string): string {
    return str.slice(0, 2).toUpperCase();
  }

  function logout() {
    deleteCookie("COODEX::TOKEN");
    deleteCookie("COODEX::USER");
    router.push("/auth/signin");
  }

  useEffect(() => {
    const cookie = getCookie("COODEX::USER");
    if (typeof cookie === "string") {
      setUser(JSON.parse(cookie));
    }
  }, []);

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
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img
              src="/images/logo-opwell.png"
              alt="Opwell Logo"
              style={{ height: "30px", width: "auto" }}
            />
            <span style={{ fontSize: "20px", fontWeight: "bold" }}>
              Asset Management
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Avatar
              style={{ backgroundColor: "#325D82", verticalAlign: "middle" }}
              size="large"
            >
              {getFirstTwoUppercase(user?.name || "")}
            </Avatar>

            <LogoutOutlined
              style={{
                color: "#fff",
                fontSize: "20px",
                marginLeft: "16px",
                cursor: "pointer",
              }}
              onClick={logout}
            />
          </div>
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: "#073b67" }}>
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
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

"use client";

import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { KeyboardEvent } from "react";
import Link from "next/link";
import { Form, Button, message, Input } from "antd";
import { useState } from "react";
import { authApi } from "@/services/api";

type Inputs = {
  name: string;
  email: string;
  password: string;
};

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  const handleSubmit = () => {
    setLoading(true);
    form
      .validateFields()
      .then((values: Inputs) => {
        return authApi.register({
          email: values.email,
          password: values.password,
          name: values.name,
        });
      })
      .then((response) => {
        form.resetFields();

        message.success("Registro realizado com sucesso!");
        router.refresh();
        router.push("/signin");
      })
      .catch((error: any) => {
        console.error(error);
        message.error(error?.message || "Erro ao fazer login");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      form.submit();
    }
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          margin: "auto",
          width: "100%",
          borderRadius: "6px",
          backgroundColor: "#ffffff",
          padding: "24px",
          maxWidth: "36rem",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: 500,
            color: "#000000",
          }}
        >
          Cadastro
        </h1>
        <Form form={form} style={{ marginTop: "24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <Form.Item
              name="name"
              rules={[{ required: true, message: "Campo obrigatório" }]}
            >
              <Input
                style={{
                  padding: "10px",
                }}
                type="email"
                placeholder="Digite seu nome"
              />
            </Form.Item>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <Form.Item
              name="email"
              rules={[{ required: true, message: "Campo obrigatório" }]}
            >
              <Input
                style={{
                  padding: "10px",
                }}
                type="email"
                placeholder="Digite seu email"
              />
            </Form.Item>
          </div>
          <div style={{ marginBottom: "8px" }}>
            <Form.Item
              name="password"
              rules={[{ required: true, message: "Campo obrigatório" }]}
            >
              <Input
                onKeyDown={handleKeyPress}
                style={{
                  padding: "10px",
                }}
                type="password"
                placeholder="Digite sua senha"
              />
            </Form.Item>
          </div>

          <div style={{ marginTop: "24px" }}>
            <Button
              style={{
                width: "100%",
                padding: "20px",
                backgroundColor: "#073b67",
              }}
              type="primary"
              onClick={handleSubmit}
              loading={loading}
            >
              Cadastra-se
            </Button>
          </div>
          <div
            style={{
              marginTop: "15px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <p style={{ color: "#6b7280" }}>
              Já tem uma conta?{" "}
              <Link href="/auth/signin">
                <span
                  style={{
                    color: "#073b67",
                    textUnderlineOffset: "none",
                  }}
                >
                  Entre Agora
                </span>
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
}

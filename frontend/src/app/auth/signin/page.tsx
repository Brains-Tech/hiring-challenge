"use client";

import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { KeyboardEvent } from "react";
import Link from "next/link";
import { Form, Button, message, Input } from "antd";
import { useState } from "react";
import { authApi } from "@/services/api";

type Inputs = {
  email: string;
  password: string;
};

export default function Signin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  const handleSubmit = () => {
    setLoading(true);
    form
      .validateFields()
      .then((values: Inputs) => {
        return authApi.login({
          email: values.email,
          password: values.password,
        });
      })
      .then((response) => {
        form.resetFields();

        setCookie("COODEX::TOKEN", response.data.token);
        setCookie("COODEX::USER", JSON.stringify(response.data.user));

        router.refresh();
        router.push("/");
        message.success("Login realizado com sucesso!");
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
          Olá, seja bem vindo!
        </h1>
        <Form form={form} style={{ marginTop: "24px" }}>
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
              Entrar
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
              Não tem uma conta?{" "}
              <Link href="/auth/signup">
                <span
                  style={{
                    color: "#073b67",
                  }}
                >
                  Cadastra-se
                </span>
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
}

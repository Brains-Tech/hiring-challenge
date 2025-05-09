import React from "react";
import { Table, Input, Select, Space, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";

interface FilterConfig {
  key: string;
  type: "text" | "select";
  placeholder: string;
  options?: { label: string; value: string | number }[];
  width?: number;
}

interface DataTableProps<T> extends Omit<TableProps<T>, "columns"> {
  title?: string;
  filters?: FilterConfig[];
  onAdd?: () => void;
  onFilterChange?: (filters: Record<string, any>) => void;
}

function DataTable<T extends object>({
  title,
  filters,
  onAdd,
  onFilterChange,
  ...tableProps
}: DataTableProps<T>) {
  const [filterValues, setFilterValues] = React.useState<Record<string, any>>(
    {}
  );

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filterValues, [key]: value };
    setFilterValues(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div>
      {title && <h2 style={{ marginBottom: 16 }}>{title}</h2>}

      <div style={{ marginBottom: 16 }}>
        <Space>
          {filters?.map((filter) => (
            <React.Fragment key={filter.key}>
              {filter.type === "text" && (
                <Input
                  placeholder={filter.placeholder}
                  value={filterValues[filter.key]}
                  onChange={(e) =>
                    handleFilterChange(filter.key, e.target.value)
                  }
                  style={{ width: filter.width || 200 }}
                />
              )}
              {filter.type === "select" && (
                <Select
                  placeholder={filter.placeholder}
                  value={filterValues[filter.key]}
                  onChange={(value) => handleFilterChange(filter.key, value)}
                  style={{ width: filter.width || 200 }}
                  allowClear
                >
                  {filter.options?.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </React.Fragment>
          ))}
          {onAdd && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
              Add New
            </Button>
          )}
        </Space>
      </div>

      <Table
        {...tableProps}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          ...tableProps.pagination,
        }}
      />
    </div>
  );
}

export default DataTable;

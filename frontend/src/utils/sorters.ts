import dayjs from "dayjs";

export const sortString = (a: string, b: string) => a.localeCompare(b);

export const sortDate = (a?: string | Date, b?: string | Date) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return dayjs(a).diff(dayjs(b));
};

export const sortNestedString = (a: any, b: any, path: string[]) =>
    getNestedValue(a, path).localeCompare(getNestedValue(b, path));

export const sortNestedDate = (a: any, b: any, path: string[]) =>
    sortDate(getNestedValue(a, path), getNestedValue(b, path));

const getNestedValue = (obj: any, path: string[]): any =>
    path.reduce((acc, key) => acc?.[key] ?? "", obj);
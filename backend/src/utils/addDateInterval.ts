export function addDateInterval(date: Date, amount: number, unit: 'months' | 'years'): Date {
    const result = new Date(date);

    const handlers = new Map<'months' | 'years', () => void>([
        ['months', () => result.setMonth(result.getMonth() + amount)],
        ['years', () => result.setFullYear(result.getFullYear() + amount)],
    ]);

    const handler = handlers.get(unit);

    if (!handler) {
        throw new Error(`Invalid unit "${unit}" for date operation`);
    }

    handler();
    return result;
}

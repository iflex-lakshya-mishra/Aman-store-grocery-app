const PENDING_ORDER_STORAGE_KEY = "aman-store-pending-orders";

const readPendingOrderIds = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = window.localStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    const parsed = JSON.parse(value || "[]");

    if (!Array.isArray(parsed)) {
      return [];
    }

    return [...new Set(parsed.map((item) => String(item)).filter(Boolean))];
  } catch {
    return [];
  }
};

const writePendingOrderIds = (ids) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!ids.length) {
    window.localStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(ids));
};

export const getPendingOrderIds = () => readPendingOrderIds();

export const rememberPendingOrder = (orderId) => {
  const nextIds = [...new Set([...readPendingOrderIds(), String(orderId)])];
  writePendingOrderIds(nextIds);
  return nextIds;
};

export const forgetPendingOrder = (orderId) => {
  const nextIds = readPendingOrderIds().filter((id) => id !== String(orderId));
  writePendingOrderIds(nextIds);
  return nextIds;
};

export const formatRp = (value) => {
  const num = Number(value) || 0;
  return "Rp" + Math.round(num).toLocaleString("id-ID");
};

export const formatNumber = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString("id-ID");
};

export const formatDate = (isoString) => {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString.includes("T") ? isoString : `${isoString}T00:00:00`);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
};

export const formatDateTime = (isoString) => {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

export const todayISO = () => {
  return new Date().toISOString().slice(0, 10);
};

export const currentMonthISO = () => {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
};

export const uid = (prefix = "id") => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

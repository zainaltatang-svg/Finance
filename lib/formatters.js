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
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const currentMonthISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const uid = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // RFC4122 UUID v4 compliant fallback
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      ((typeof crypto !== "undefined" && crypto.getRandomValues
        ? crypto.getRandomValues(new Uint8Array(1))[0]
        : (Math.random() * 16) | 0) &
        (15 >> (+c / 4)))
    ).toString(16)
  );
};

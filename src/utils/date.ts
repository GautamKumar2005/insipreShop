export function formatDate(dateInput: string | Date): string {
  if (!dateInput) return "-";
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "-";
  
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

export function formatDateShort(dateInput: string | Date): string {
  if (!dateInput) return "-";
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "-";
  
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

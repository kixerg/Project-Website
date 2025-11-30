export function getInitialData() {
  try {
    const raw = localStorage.getItem("student_marketplace_v1");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveData(listings) {
  localStorage.setItem("student_marketplace_v1", JSON.stringify(listings));
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export async function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
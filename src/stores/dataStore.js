export function saveData(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
  
  export function getData(key, defaultValue = null) {
    const storedValue = sessionStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  }
  
  export function removeData(key) {
    sessionStorage.removeItem(key);
  }
  
  export function clearAllData() {
    sessionStorage.clear();
  }

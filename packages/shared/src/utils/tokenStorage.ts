export interface TokenStorage {
  getToken: () => Promise<string | null>;
  setToken: (token: string) => Promise<void>;
  removeToken: () => Promise<void>;
}

let _storage: TokenStorage | null = null;

export const initTokenStorage = (storage: TokenStorage) => {
  _storage = storage;
};

export const getToken = async (): Promise<string | null> => {
  return _storage ? _storage.getToken() : null;
};

export const setToken = async (token: string): Promise<void> => {
  return _storage?.setToken(token);
};

export const removeToken = async (): Promise<void> => {
  return _storage?.removeToken();
};
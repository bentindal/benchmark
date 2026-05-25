import axios from 'axios';

const mockGetItemAsync = jest.fn();
const mockDeleteItemAsync = jest.fn();
const mockSetItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({
  getItemAsync: mockGetItemAsync,
  deleteItemAsync: mockDeleteItemAsync,
  setItemAsync: mockSetItemAsync,
}));

jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  const mockInstance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };

  mockAxios.create.mockReturnValue(mockInstance);
  return mockAxios;
});

describe('api interceptors', () => {
  let requestInterceptor: (config: Record<string, unknown>) => Promise<Record<string, unknown>>;
  let responseErrorHandler: (err: unknown) => Promise<never>;

  beforeEach(() => {
    jest.resetModules();
    mockGetItemAsync.mockReset();
    mockDeleteItemAsync.mockReset();

    const mockAxios = require('axios');
    const mockInstance = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    mockAxios.create.mockReturnValue(mockInstance);

    require('../lib/api');

    const [reqFn] = mockInstance.interceptors.request.use.mock.calls[0];
    requestInterceptor = reqFn;

    const [, errFn] = mockInstance.interceptors.response.use.mock.calls[0];
    responseErrorHandler = errFn;
  });

  it('attaches Bearer token to request when token is stored', async () => {
    mockGetItemAsync.mockResolvedValueOnce('test-jwt-token');
    const config: Record<string, unknown> = { headers: {} };
    const result = await requestInterceptor(config);
    expect((result.headers as Record<string, string>).Authorization).toBe('Bearer test-jwt-token');
  });

  it('does not set Authorization header when no token', async () => {
    mockGetItemAsync.mockResolvedValueOnce(null);
    const config: Record<string, unknown> = { headers: {} };
    const result = await requestInterceptor(config);
    expect((result.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('deletes stored token on 401 response error', async () => {
    const err = { response: { status: 401 } };
    await expect(responseErrorHandler(err)).rejects.toEqual(err);
    expect(mockDeleteItemAsync).toHaveBeenCalledWith('auth_token');
  });

  it('does not delete token on non-401 error', async () => {
    const err = { response: { status: 500 } };
    await expect(responseErrorHandler(err)).rejects.toEqual(err);
    expect(mockDeleteItemAsync).not.toHaveBeenCalled();
  });
});

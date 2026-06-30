import { describe, expect, it, vi } from 'vitest';
import authReducer, {
  setCredentials,
  setUser,
  logout,
  setInitialized,
  selectIsAuthenticated,
  selectCurrentUser,
} from '../authSlice';

vi.mock('../../../utils/tokenStorage', () => ({
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
}));

describe('authSlice', () => {
  const initialState = {
    user: null,
    isAuthenticated: false,
    isInitialized: false,
  };

  it('sets credentials and authenticates user', () => {
    const user = { id: '1', firstName: 'Fleet', lastName: 'Manager', permissions: ['view_trips'] };
    const state = authReducer(
      initialState,
      setCredentials({ user, accessToken: 'token-123' })
    );

    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.isInitialized).toBe(true);
  });

  it('logs out and clears user state', () => {
    const authenticated = {
      user: { id: '1', firstName: 'Fleet' },
      isAuthenticated: true,
      isInitialized: true,
    };

    const state = authReducer(authenticated, logout());
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isInitialized).toBe(true);
  });

  it('updates user via setUser', () => {
    const user = { id: '2', firstName: 'Driver' };
    const state = authReducer(initialState, setUser(user));
    expect(selectCurrentUser({ auth: state })).toEqual(user);
    expect(selectIsAuthenticated({ auth: state })).toBe(true);
  });

  it('marks initialized without changing auth state', () => {
    const state = authReducer(initialState, setInitialized());
    expect(state.isInitialized).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });
});

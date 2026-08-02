import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('useDashboardBack fallback paths', () => {
  const navigate = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    navigate.mockReset();
  });

  afterEach(() => {
    vi.doUnmock('react-router-dom');
  });

  it('navigates back when history is available', async () => {
    vi.doMock('react-router-dom', () => ({ useNavigate: () => navigate }));
    const originalHistory = window.history.length;
    Object.defineProperty(window.history, 'length', { configurable: true, value: 3 });
    const { useDashboardBack } = await import('./useDashboardBack');
    useDashboardBack('/shop')();
    expect(navigate).toHaveBeenCalledWith(-1);
    Object.defineProperty(window.history, 'length', { configurable: true, value: originalHistory });
  });

  it('uses fallback path when history is empty', async () => {
    vi.doMock('react-router-dom', () => ({ useNavigate: () => navigate }));
    Object.defineProperty(window.history, 'length', { configurable: true, value: 1 });
    const { useDashboardBack } = await import('./useDashboardBack');
    useDashboardBack('/shop')();
    expect(navigate).toHaveBeenCalledWith('/shop');
  });
});

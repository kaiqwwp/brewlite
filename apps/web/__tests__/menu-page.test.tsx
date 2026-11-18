import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MenuPage from '@/app/page';
import { api, ApiError } from '@/lib/api';

vi.mock('@/lib/api', async (orig) => {
  const real = await orig<typeof import('@/lib/api')>();
  return { ...real, api: vi.fn() };
});
const mockApi = vi.mocked(api);

const products = [
  { id: 1, name: 'Cà phê sữa', description: '', price: 35000, imageUrl: '/images/ca-phe-sua.svg', stock: 10 },
  { id: 2, name: 'Matcha đá xay', description: '', price: 55000, imageUrl: '/images/matcha.svg', stock: 0 },
];

describe('FE-T01 Màn hình Menu', () => {
  beforeEach(() => mockApi.mockReset());

  it('hiện trạng thái loading khi đang tải', async () => {
    let finish: (v: unknown) => void = () => {};
    mockApi.mockReturnValue(new Promise((r) => { finish = r; }));
    render(<MenuPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Đang tải menu');
    expect(mockApi).toHaveBeenCalledWith('/products');
    finish([]);
    expect(await screen.findByText('Menu đang trống')).toBeInTheDocument();
  });

  it('hiện danh sách sản phẩm với giá VND, đánh dấu sản phẩm hết hàng, liên kết tới chi tiết', async () => {
    mockApi.mockResolvedValue(products);
    render(<MenuPage />);
    const grid = await screen.findByTestId('menu-grid');
    expect(grid.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('Cà phê sữa')).toBeInTheDocument();
    expect(screen.getByText(/35\.000/)).toBeInTheDocument();
    expect(screen.getByText('Hết hàng')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cà phê sữa/ })).toHaveAttribute('href', '/products/1');
  });

  it('hiện trạng thái empty khi menu rỗng', async () => {
    mockApi.mockResolvedValue([]);
    render(<MenuPage />);
    expect(await screen.findByText('Menu đang trống')).toBeInTheDocument();
  });

  it('hiện lỗi khi API lỗi và tải lại được khi bấm Thử lại', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(0, 'Không kết nối được máy chủ. Vui lòng thử lại.'));
    mockApi.mockResolvedValueOnce(products);
    render(<MenuPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không kết nối được máy chủ');
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByTestId('menu-grid')).toBeInTheDocument();
    expect(mockApi).toHaveBeenCalledTimes(2);
  });
});

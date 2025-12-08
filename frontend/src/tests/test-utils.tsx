/**
 * Custom Test Utilities
 * Provides wrapped render function with providers
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '../services/api';

// Create a test store
export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
    preloadedState,
  });
}

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any;
  store?: ReturnType<typeof createTestStore>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Mock user data
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'admin',
  is_active: true,
};

// Mock product data
export const mockProduct = {
  id: 1,
  code: 'TEST-001',
  name: 'Test Product',
  description: 'Test product description',
  category: 'Test Category',
  primary_uom: 'PCS',
  cost: 100.0,
  price: 150.0,
  is_producible: true,
  is_active: true,
};

// Mock BOM data
export const mockBOM = {
  id: 1,
  bom_number: 'BOM-001',
  product_id: 1,
  product_name: 'Test Product',
  version: 1,
  batch_size: 100,
  batch_uom: 'PCS',
  total_cost: 10000,
  is_active: true,
  items: [
    {
      id: 1,
      material_id: 1,
      material_code: 'MAT-001',
      material_name: 'Test Material',
      quantity: 10,
      uom: 'KG',
      scrap_percent: 5,
      unit_cost: 50,
      total_cost: 500,
    },
  ],
};

// Mock sales order data
export const mockSalesOrder = {
  id: 1,
  order_number: 'SO-001',
  customer_id: 1,
  customer_name: 'Test Customer',
  order_date: '2025-11-10',
  delivery_date: '2025-11-20',
  status: 'pending',
  total_amount: 1500,
  items: [
    {
      id: 1,
      product_id: 1,
      product_name: 'Test Product',
      quantity: 10,
      unit_price: 150,
      total: 1500,
    },
  ],
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

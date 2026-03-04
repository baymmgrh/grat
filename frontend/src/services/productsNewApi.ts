import axiosInstance from '../utils/axiosConfig';

// Use axiosInstance which has dynamic baseURL
const API_BASE_URL = '/api';

export interface ProductNew {
  id: number;
  kode_produk: string;
  nama_produk: string;
  gramasi?: number;
  cd?: number;
  md?: number;
  sheet_per_pack?: number;
  pack_per_karton?: number;
  berat_kering?: number;
  ratio?: number;
  ingredient?: number;
  ukuran_batch_vol?: number;
  ukuran_batch_ctn?: number;
  spunlace?: string;
  rayon?: number;
  polyester?: number;
  es?: number;
  slitting_cm?: number;
  lebar_mr_net_cm?: number;
  lebar_mr_gross_cm?: number;
  keterangan_slitting?: string;
  no_mesin_epd?: string;
  speed_epd_pack_menit?: number;
  meter_kain?: number;
  kg_kain?: number;
  kebutuhan_rayon_kg?: number;
  kebutuhan_polyester_kg?: number;
  kebutuhan_es_kg?: number;
  process_produksi?: string;
  kode_jumbo_roll?: string;
  nama_jumbo_roll?: string;
  kode_main_roll?: string;
  nama_main_roll?: string;
  kapasitas_mixing_kg?: number;
  actual_mixing_kg?: number;
  dosing_kg?: number;
  is_active: boolean;
  version: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVersion {
  id: number;
  version: number;
  change_reason: string;
  created_at: string;
  previous_data: ProductNew;
}

export interface DashboardStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  spunlace_distribution: Array<{ type: string; count: number }>;
  process_distribution: Array<{ process: string; count: number }>;
  recent_products: ProductNew[];
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  spunlace?: string;
  process?: string;
  gsm_min?: number;
  gsm_max?: number;
  is_active?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

class ProductsNewApi {
  // Get all products with pagination and filtering
  async getProducts(params: PaginationParams = {}): Promise<PaginatedResponse<ProductNew>> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new`, { params });
    return response.data;
  }

  // Get single product by ID
  async getProduct(id: number): Promise<{ product: ProductNew }> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/${id}`);
    return response.data;
  }

  // Get product by kode_produk
  async getProductByKode(kodeProduk: string): Promise<{ product: ProductNew }> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/kode/${encodeURIComponent(kodeProduk)}`);
    return response.data;
  }

  // Create new product
  async createProduct(productData: Omit<ProductNew, 'id' | 'created_at' | 'updated_at' | 'version'>): Promise<{ message: string; product: ProductNew }> {
    const response = await axiosInstance.post(`${API_BASE_URL}/products-new`, productData);
    return response.data;
  }

  // Update existing product
  async updateProduct(id: number, productData: Partial<ProductNew>): Promise<{ message: string; product: ProductNew }> {
    const response = await axiosInstance.put(`${API_BASE_URL}/products-new/${id}`, productData);
    return response.data;
  }

  // Delete product (soft delete)
  async deleteProduct(id: number): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`${API_BASE_URL}/products-new/${id}`);
    return response.data;
  }

  // Get product version history
  async getProductVersions(id: number): Promise<{ product: ProductNew; versions: ProductVersion[] }> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/${id}/versions`);
    return response.data;
  }

  // Get dashboard statistics
  async getDashboardStats(timeRange?: string): Promise<DashboardStats> {
    const params = timeRange ? { time_range: timeRange } : {};
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/dashboard`, { params });
    return response.data;
  }

  // Advanced product search
  async searchProducts(params: {
    kode_produk?: string;
    nama_produk?: string;
    spunlace?: string;
    process?: string;
    gsm_min?: number;
    gsm_max?: number;
  }): Promise<{ products: ProductNew[]; count: number }> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/search`, { params });
    return response.data;
  }

  // Export products to Excel
  async exportProducts(params: PaginationParams = {}): Promise<Blob> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  // Import products from Excel
  async importProducts(file: File): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(`${API_BASE_URL}/products-new/import/excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get spunlace options (for dropdowns)
  async getSpunlaceOptions(): Promise<string[]> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/options/spunlace`);
    return response.data;
  }

  // Get process options (for dropdowns)
  async getProcessOptions(): Promise<string[]> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/options/process`);
    return response.data;
  }

  // Get machine options (for dropdowns)
  async getMachineOptions(): Promise<string[]> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/options/machines`);
    return response.data;
  }

  // Validate product data before saving
  async validateProduct(productData: Partial<ProductNew>): Promise<{ valid: boolean; errors: Record<string, string> }> {
    const response = await axiosInstance.post(`${API_BASE_URL}/products-new/validate`, productData);
    return response.data;
  }

  // Check if kode_produk is available (for create form)
  async checkKodeAvailability(kodeProduk: string, excludeId?: number): Promise<{ available: boolean }> {
    const params = { kode: kodeProduk };
    if (excludeId) {
      params['exclude_id'] = excludeId;
    }
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/check-kode`, { params });
    return response.data;
  }

  // Get products by spunlace type
  async getProductsBySpunlace(spunlace: string): Promise<ProductNew[]> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/spunlace/${encodeURIComponent(spunlace)}`);
    return response.data;
  }

  // Get products by process type
  async getProductsByProcess(process: string): Promise<ProductNew[]> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/process/${encodeURIComponent(process)}`);
    return response.data;
  }

  // Get product suggestions for autocomplete
  async getProductSuggestions(query: string, limit: number = 10): Promise<ProductNew[]> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/suggestions`, {
      params: { q: query, limit }
    });
    return response.data;
  }

  // Calculate material requirements for a product
  async calculateMaterialRequirements(productId: number, quantity: number): Promise<{
    meter_kain: number;
    kg_kain: number;
    kebutuhan_rayon_kg: number;
    kebutuhan_polyester_kg: number;
    kebutuhan_es_kg: number;
  }> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/${productId}/material-requirements`, {
      params: { quantity }
    });
    return response.data;
  }

  // Get product analytics
  async getProductAnalytics(timeRange: string = '30d'): Promise<{
    total_products: number;
    new_products: number;
    updated_products: number;
    top_spunlace: Array<{ type: string; count: number }>;
    top_processes: Array<{ process: string; count: number }>;
    gsm_distribution: Array<{ range: string; count: number }>;
  }> {
    const response = await axiosInstance.get(`${API_BASE_URL}/products-new/analytics`, {
      params: { time_range: timeRange }
    });
    return response.data;
  }
}

// Create singleton instance
const productsNewApi = new ProductsNewApi();

export default productsNewApi;

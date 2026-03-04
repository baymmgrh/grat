# 🗄️ DATABASE SCHEMA DOCUMENTATION
## PT. GRATIA MAKMUR SENTOSA ERP

---

## 📋 DAFTAR TABEL

### PRODUCTION MODULE

#### 1. `work_orders`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| wo_number | VARCHAR(50) | Nomor Work Order (unique) |
| product_id | INTEGER | FK → products.id |
| machine_id | INTEGER | FK → machines.id |
| quantity | DECIMAL | Target quantity |
| quantity_produced | DECIMAL | Total produced |
| quantity_good | DECIMAL | Good quantity |
| quantity_scrap | DECIMAL | Scrap/reject quantity |
| start_date | DATE | Tanggal mulai |
| end_date | DATE | Tanggal selesai |
| status | VARCHAR(20) | draft/confirmed/in_progress/completed/cancelled |
| priority | VARCHAR(10) | low/medium/high/urgent |
| notes | TEXT | Catatan |
| created_at | DATETIME | Timestamp created |
| created_by | INTEGER | FK → users.id |

#### 2. `shift_productions`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| production_date | DATE | Tanggal produksi |
| shift | VARCHAR(10) | shift_1/shift_2/shift_3 |
| shift_start | TIME | Waktu mulai shift |
| shift_end | TIME | Waktu selesai shift |
| machine_id | INTEGER | FK → machines.id |
| product_id | INTEGER | FK → products.id |
| work_order_id | INTEGER | FK → work_orders.id |
| target_quantity | DECIMAL | Target |
| actual_quantity | DECIMAL | Total produced |
| good_quantity | DECIMAL | Grade A |
| reject_quantity | DECIMAL | Grade C |
| rework_quantity | DECIMAL | Grade B |
| setting_sticker | DECIMAL | Setting sticker loss |
| setting_packaging | DECIMAL | Setting packaging loss |
| uom | VARCHAR(10) | Unit of measure |
| planned_runtime | INTEGER | Planned runtime (menit) |
| actual_runtime | INTEGER | Actual runtime (menit) |
| downtime_minutes | INTEGER | Total downtime |
| downtime_mesin | INTEGER | Downtime mesin |
| downtime_operator | INTEGER | Downtime operator |
| downtime_material | INTEGER | Downtime material |
| downtime_design | INTEGER | Downtime design |
| downtime_others | INTEGER | Downtime lainnya |
| idle_time | INTEGER | Idle time (menit) |
| waktu_tidak_tercatat | INTEGER | Waktu tidak tercatat |
| machine_speed | INTEGER | Kecepatan mesin (pcs/menit) |
| quality_rate | DECIMAL | Quality rate (%) |
| efficiency_rate | DECIMAL | Efficiency rate (%) |
| oee_score | DECIMAL | OEE score (%) |
| operator_id | INTEGER | FK → employees.id |
| issues | TEXT | Downtime notes (parsed for display) |
| notes | TEXT | Catatan umum |
| early_stop | BOOLEAN | Shift berhenti lebih awal |
| early_stop_time | TIME | Waktu berhenti |
| early_stop_reason | VARCHAR(100) | Alasan berhenti |
| early_stop_notes | TEXT | Catatan early stop |
| operator_reassigned | BOOLEAN | Operator dipindah |
| reassignment_task | VARCHAR(100) | Tugas baru |
| status | VARCHAR(20) | Status |
| created_at | DATETIME | Timestamp |
| created_by | INTEGER | FK → users.id |

#### 3. `production_records`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| work_order_id | INTEGER | FK → work_orders.id |
| machine_id | INTEGER | FK → machines.id |
| product_id | INTEGER | FK → products.id |
| production_date | DATETIME | Tanggal produksi |
| shift | VARCHAR(10) | Shift |
| quantity_produced | DECIMAL | Total produced |
| quantity_good | DECIMAL | Good quantity |
| quantity_scrap | DECIMAL | Scrap quantity |
| quantity_rework | DECIMAL | Rework quantity |
| setting_sticker | DECIMAL | Setting sticker |
| setting_packaging | DECIMAL | Setting packaging |
| downtime_minutes | INTEGER | Downtime (menit) |
| operator_id | INTEGER | FK → employees.id |
| notes | TEXT | Catatan |
| created_at | DATETIME | Timestamp |

#### 4. `machines`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| code | VARCHAR(20) | Kode mesin |
| name | VARCHAR(100) | Nama mesin |
| type | VARCHAR(50) | Tipe mesin |
| status | VARCHAR(20) | active/inactive/maintenance |
| location | VARCHAR(100) | Lokasi |
| target_efficiency | DECIMAL | Target efisiensi (%) |
| machine_speed | INTEGER | Kecepatan default (pcs/menit) |
| notes | TEXT | Catatan |

---

### PRODUCTS MODULE

#### 5. `products`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| code | VARCHAR(50) | Kode produk |
| name | VARCHAR(200) | Nama produk |
| category | VARCHAR(50) | Kategori |
| uom | VARCHAR(20) | Unit of measure |
| price | DECIMAL | Harga jual |
| cost | DECIMAL | Harga pokok |
| min_stock | DECIMAL | Minimum stock |
| max_stock | DECIMAL | Maximum stock |
| is_active | BOOLEAN | Status aktif |

#### 6. `products_new`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| kode_barang | VARCHAR(50) | Kode barang |
| nama_barang | VARCHAR(200) | Nama barang |
| kategori | VARCHAR(50) | Kategori |
| satuan | VARCHAR(20) | Satuan |
| pack_per_karton | INTEGER | Pack per karton |
| berat_per_pack | DECIMAL | Berat per pack (gram) |
| harga_jual | DECIMAL | Harga jual |
| is_active | BOOLEAN | Status aktif |

#### 7. `bom` (Bill of Materials)
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| product_id | INTEGER | FK → products.id |
| material_id | INTEGER | FK → materials.id |
| quantity | DECIMAL | Quantity per unit |
| uom | VARCHAR(20) | Unit of measure |
| notes | TEXT | Catatan |

---

### WAREHOUSE MODULE

#### 8. `inventory`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| product_id | INTEGER | FK → products.id |
| warehouse_id | INTEGER | FK → warehouses.id |
| quantity | DECIMAL | Total quantity |
| reserved_quantity | DECIMAL | Reserved quantity |
| available_quantity | DECIMAL | Available quantity |
| unit_cost | DECIMAL | Unit cost |
| last_updated | DATETIME | Last update |

#### 9. `stock_movements`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| product_id | INTEGER | FK → products.id |
| warehouse_id | INTEGER | FK → warehouses.id |
| movement_type | VARCHAR(20) | in/out/transfer/adjustment |
| quantity | DECIMAL | Quantity |
| reference_type | VARCHAR(50) | Tipe referensi |
| reference_id | INTEGER | ID referensi |
| notes | TEXT | Catatan |
| created_at | DATETIME | Timestamp |
| created_by | INTEGER | FK → users.id |

#### 10. `wip_stock`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| product_id | INTEGER | FK → products.id |
| quantity | DECIMAL | Quantity WIP |
| pack_per_carton | INTEGER | Pack per karton |
| last_updated | DATETIME | Last update |

#### 11. `wip_stock_movements`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| wip_stock_id | INTEGER | FK → wip_stock.id |
| movement_type | VARCHAR(20) | in/out/adjustment |
| quantity | DECIMAL | Quantity |
| reference_type | VARCHAR(50) | Tipe referensi |
| reference_id | INTEGER | ID referensi |
| notes | TEXT | Catatan |
| created_at | DATETIME | Timestamp |
| created_by | INTEGER | FK → users.id |

#### 12. `packing_lists`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| packing_number | VARCHAR(50) | Nomor packing list |
| product_id | INTEGER | FK → products.id |
| work_order_id | INTEGER | FK → work_orders.id (optional) |
| total_cartons | INTEGER | Total karton |
| carton_start | INTEGER | Nomor karton awal |
| carton_end | INTEGER | Nomor karton akhir |
| pack_per_carton | INTEGER | Pack per karton |
| total_packs | INTEGER | Total pack |
| status | VARCHAR(20) | draft/weighing/completed/shipped |
| notes | TEXT | Catatan |
| created_at | DATETIME | Timestamp |
| created_by | INTEGER | FK → users.id |

#### 13. `packing_list_cartons`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| packing_list_id | INTEGER | FK → packing_lists.id |
| carton_number | INTEGER | Nomor karton |
| weight | DECIMAL | Berat (kg) |
| weigh_date | DATE | Tanggal timbang |
| notes | TEXT | Catatan |

---

### SALES MODULE

#### 14. `customers`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| code | VARCHAR(20) | Kode customer |
| name | VARCHAR(200) | Nama customer |
| address | TEXT | Alamat |
| city | VARCHAR(100) | Kota |
| phone | VARCHAR(50) | Telepon |
| email | VARCHAR(100) | Email |
| contact_person | VARCHAR(100) | Contact person |
| credit_limit | DECIMAL | Credit limit |
| payment_terms | INTEGER | Payment terms (hari) |
| is_active | BOOLEAN | Status aktif |

#### 15. `sales_orders`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| so_number | VARCHAR(50) | Nomor SO |
| customer_id | INTEGER | FK → customers.id |
| order_date | DATE | Tanggal order |
| delivery_date | DATE | Tanggal delivery |
| subtotal | DECIMAL | Subtotal |
| discount | DECIMAL | Diskon |
| tax | DECIMAL | Pajak |
| total_amount | DECIMAL | Total |
| status | VARCHAR(20) | draft/confirmed/processing/shipped/invoiced/paid/cancelled |
| notes | TEXT | Catatan |
| created_at | DATETIME | Timestamp |
| created_by | INTEGER | FK → users.id |

#### 16. `sales_order_items`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| sales_order_id | INTEGER | FK → sales_orders.id |
| product_id | INTEGER | FK → products.id |
| quantity | DECIMAL | Quantity |
| unit_price | DECIMAL | Harga satuan |
| discount | DECIMAL | Diskon |
| total | DECIMAL | Total |

---

### PURCHASING MODULE

#### 17. `suppliers`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| code | VARCHAR(20) | Kode supplier |
| name | VARCHAR(200) | Nama supplier |
| address | TEXT | Alamat |
| phone | VARCHAR(50) | Telepon |
| email | VARCHAR(100) | Email |
| contact_person | VARCHAR(100) | Contact person |
| payment_terms | INTEGER | Payment terms (hari) |
| is_active | BOOLEAN | Status aktif |

#### 18. `purchase_orders`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| po_number | VARCHAR(50) | Nomor PO |
| supplier_id | INTEGER | FK → suppliers.id |
| order_date | DATE | Tanggal order |
| expected_date | DATE | Tanggal expected |
| subtotal | DECIMAL | Subtotal |
| tax | DECIMAL | Pajak |
| total_amount | DECIMAL | Total |
| status | VARCHAR(20) | draft/approved/ordered/received/invoiced/paid/cancelled |
| notes | TEXT | Catatan |
| created_at | DATETIME | Timestamp |
| created_by | INTEGER | FK → users.id |

#### 19. `goods_receipt_notes`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| grn_number | VARCHAR(50) | Nomor GRN |
| purchase_order_id | INTEGER | FK → purchase_orders.id |
| supplier_id | INTEGER | FK → suppliers.id |
| receipt_date | DATE | Tanggal terima |
| status | VARCHAR(20) | draft/completed |
| notes | TEXT | Catatan |
| created_at | DATETIME | Timestamp |
| created_by | INTEGER | FK → users.id |

---

### FINANCE MODULE

#### 20. `accounts`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| code | VARCHAR(20) | Kode akun |
| name | VARCHAR(200) | Nama akun |
| type | VARCHAR(20) | asset/liability/equity/revenue/expense |
| parent_id | INTEGER | FK → accounts.id (self-reference) |
| is_active | BOOLEAN | Status aktif |
| balance | DECIMAL | Saldo |

#### 21. `journal_entries`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| entry_number | VARCHAR(50) | Nomor jurnal |
| entry_date | DATE | Tanggal jurnal |
| description | TEXT | Deskripsi |
| total_debit | DECIMAL | Total debit |
| total_credit | DECIMAL | Total credit |
| status | VARCHAR(20) | draft/posted/reversed |
| reference_type | VARCHAR(50) | Tipe referensi |
| reference_id | INTEGER | ID referensi |
| created_at | DATETIME | Timestamp |
| created_by | INTEGER | FK → users.id |

#### 22. `journal_lines`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| journal_entry_id | INTEGER | FK → journal_entries.id |
| account_id | INTEGER | FK → accounts.id |
| debit | DECIMAL | Debit amount |
| credit | DECIMAL | Credit amount |
| description | TEXT | Deskripsi |

#### 23. `wip_ledger`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| work_order_id | INTEGER | FK → work_orders.id |
| entry_date | DATE | Tanggal entry |
| entry_type | VARCHAR(20) | material/labor/overhead/transfer |
| amount | DECIMAL | Amount |
| description | TEXT | Deskripsi |
| reference_type | VARCHAR(50) | Tipe referensi |
| reference_id | INTEGER | ID referensi |
| created_at | DATETIME | Timestamp |

---

### HR MODULE

#### 24. `employees`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| employee_id | VARCHAR(20) | NIK |
| name | VARCHAR(200) | Nama |
| department_id | INTEGER | FK → departments.id |
| position | VARCHAR(100) | Jabatan |
| join_date | DATE | Tanggal masuk |
| phone | VARCHAR(50) | Telepon |
| email | VARCHAR(100) | Email |
| address | TEXT | Alamat |
| status | VARCHAR(20) | active/inactive/resigned |
| basic_salary | DECIMAL | Gaji pokok |

#### 25. `attendance`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| employee_id | INTEGER | FK → employees.id |
| date | DATE | Tanggal |
| clock_in | TIME | Jam masuk |
| clock_out | TIME | Jam keluar |
| status | VARCHAR(20) | present/absent/late/leave |
| overtime_hours | DECIMAL | Jam lembur |
| notes | TEXT | Catatan |

#### 26. `work_roster`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| employee_id | INTEGER | FK → employees.id |
| machine_id | INTEGER | FK → machines.id |
| date | DATE | Tanggal |
| shift | VARCHAR(10) | Shift |
| role | VARCHAR(50) | Role (operator/supervisor) |
| notes | TEXT | Catatan |

---

### QUALITY MODULE

#### 27. `quality_inspections`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| inspection_number | VARCHAR(50) | Nomor inspeksi |
| inspection_type | VARCHAR(20) | incoming/in_process/final |
| reference_type | VARCHAR(50) | Tipe referensi |
| reference_id | INTEGER | ID referensi |
| inspection_date | DATE | Tanggal inspeksi |
| inspector_id | INTEGER | FK → employees.id |
| result | VARCHAR(20) | pass/fail/conditional |
| notes | TEXT | Catatan |
| created_at | DATETIME | Timestamp |

#### 28. `machine_monthly_targets`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| machine_id | INTEGER | FK → machines.id |
| year | INTEGER | Tahun |
| month | INTEGER | Bulan |
| target_penyusutan | DECIMAL | Target penyusutan (%) |
| target_maintenance | DECIMAL | Target maintenance (%) |
| notes | TEXT | Catatan |

---

### USER & AUTH MODULE

#### 29. `users`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| username | VARCHAR(50) | Username (unique) |
| email | VARCHAR(100) | Email (unique) |
| password_hash | VARCHAR(255) | Password hash |
| role | VARCHAR(20) | Role |
| employee_id | INTEGER | FK → employees.id |
| is_active | BOOLEAN | Status aktif |
| last_login | DATETIME | Last login |
| created_at | DATETIME | Timestamp |

#### 30. `roles`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary Key |
| name | VARCHAR(50) | Nama role |
| description | TEXT | Deskripsi |
| permissions | JSON | Permissions list |

---

## 📊 ENTITY RELATIONSHIP DIAGRAM

```
                                    ┌─────────────┐
                                    │   users     │
                                    └──────┬──────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ↓                            ↓                            ↓
       ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
       │  customers  │              │  employees  │              │  suppliers  │
       └──────┬──────┘              └──────┬──────┘              └──────┬──────┘
              │                            │                            │
              ↓                            ↓                            ↓
       ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
       │sales_orders │              │ attendance  │              │purchase_ord │
       └──────┬──────┘              │ work_roster │              └──────┬──────┘
              │                     └─────────────┘                     │
              │                                                         │
              │         ┌─────────────┐         ┌─────────────┐        │
              └────────→│  products   │←────────│  materials  │←───────┘
                        └──────┬──────┘         └─────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ↓                ↓                ↓
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │ work_orders │  │  inventory  │  │    bom      │
       └──────┬──────┘  └─────────────┘  └─────────────┘
              │
              ↓
       ┌─────────────┐
       │shift_product│
       │   ions      │
       └──────┬──────┘
              │
              ↓
       ┌─────────────┐
       │  wip_stock  │
       └──────┬──────┘
              │
              ↓
       ┌─────────────┐
       │packing_lists│
       └─────────────┘
```

---

## 🔧 INDEX RECOMMENDATIONS

```sql
-- Production Performance
CREATE INDEX idx_shift_prod_date ON shift_productions(production_date);
CREATE INDEX idx_shift_prod_machine ON shift_productions(machine_id);
CREATE INDEX idx_shift_prod_wo ON shift_productions(work_order_id);

-- Inventory Lookup
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_stock_movement_product ON stock_movements(product_id);

-- Sales Performance
CREATE INDEX idx_so_customer ON sales_orders(customer_id);
CREATE INDEX idx_so_date ON sales_orders(order_date);

-- Finance
CREATE INDEX idx_journal_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_status ON journal_entries(status);
```

---

*Dokumentasi Database Schema - Generated 3 Februari 2026*

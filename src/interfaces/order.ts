

export interface Order {
  id: string | number
  erp_order_id?: string
  status?: string
  created_at?: string
  updated_at?: string
  delivered_at?: string
  last_status_change_at?: string
  surtidor_id?: string | null
  surtidor_name?: string | null
  surtidor_asignado_at?: string
  surtido_at?: string
  packed_at?: string
  facturado_at?: string
  customer_name?: string
  carrier?: string
  guia?: string
  shipped_at?: string
  delivered_by?: string
  delivered_by_name?: string
}


export const FIXED_CARRIERS = ['PMM', 'FLECHA_AMARILLA', 'AFIMEX', 'INBOX', 'SPATMAIL', 'TEAMMEX', 'SALTILLO', 'DOMICILIO'] as const
export const OPTIONAL_CARRIERS = ['DHL', 'Tres_guerras', 'Estafeta', 'PAQUETE_EXPRESS'] as const
export const ALL_CARRIERS_IN_ORDER = [...FIXED_CARRIERS, ...OPTIONAL_CARRIERS] as const


export type FixedCarrier = typeof FIXED_CARRIERS[number]
export type OptionalCarrier = typeof OPTIONAL_CARRIERS[number]
export type Carrier = typeof ALL_CARRIERS_IN_ORDER[number]
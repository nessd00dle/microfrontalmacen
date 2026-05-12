<template>
  <div class="main-container">
    <div v-if="loading" class="loading-header">
      <div class="spinner"></div>
      <p class="loading-text">{{ loadingText }}</p>
    </div>

    <div class="carousel-container">
      <div class="carousel-slides">
        <!-- Slide Fixed - Paqueterías Fijas -->
        <div class="carousel-slide fixed-slide" :class="{ active: currentSlide === 0 }">
          <div class="slide-content">
            <div class="grid-wrapper">
              <div class="grid-container">
                <div
                  v-for="carrier in FIXED_CARRIERS"
                  :key="carrier"
                  class="carrier-column"
                  :data-carrier="carrier"
                >
                  <div class="carrier-header">
                    <div class="carrier-title">{{ carrier }}</div>
                    <div class="stats-wrapper">
                      <div class="stats-pill pill-fila">
                        <span class="stats-label">FILA:</span>
                        <span class="stats-number">{{ getPorSurtirCount(carrier) }}</span>
                      </div>
                      <div class="stats-pill pill-total">
                        <span class="stats-label">TOTAL:</span>
                        <span class="stats-number">{{ getTotalCount(carrier) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="orders-container">
                    <div
                      v-for="order in getPaginatedOrders(carrier, 0)"
                      :key="order.id"
                      class="order-card"
                      :style="{ border: `3px solid ${getBorderColor(order)}` }"
                    >
                      <div class="order-id" :title="`Pedido: ${order.erp_order_id || 'N/A'}`">
                        {{ order.erp_order_id || 'N/A' }}
                      </div>
                      <div v-if="isPendingOverDay(order)" class="pending-pill blink">
                        <span class="pending-dot"></span>
                        PENDIENTE
                      </div>
                      <div class="status-badge-right" :style="{ backgroundColor: getStatusStyle(order.status).backgroundColor, color: getStatusStyle(order.status).color }">
                        <div class="foraneos-marquee">
                          <span>{{ getStatusLabel(order.status) }}</span>
                        </div>
                      </div>
                      <div class="times-container">
                        <div class="time-row">
                          <span style="color: #2d3136;">Hora de creado:</span>
                          <span style="font-weight: 600; color: #2c3e50;">{{ formatTime(order.created_at) }}</span>
                        </div>
                        <div class="time-row">
                          <span style="color: #363a3d;">Tiempo en estatus:</span>
                          <span style="font-weight: 600; color: #2c3e50;">{{ formatTime(getStatusChangeTime(order)) }}</span>
                        </div>
                      </div>
                      <div class="customer-name-container">
                        <div class="customer-label">Cliente</div>
                        <div class="customer-name" :title="order.customer_name || 'No especificado'">
                          {{ order.customer_name || 'No especificado' }}
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Slide Optional - Paqueterías Opcionales -->
        <div class="carousel-slide optional-slide" :class="{ active: currentSlide === 1 }">
          <div class="slide-content">
            <div class="grid-wrapper">
              <div class="grid-container">
                <div
                  v-for="carrier in OPTIONAL_CARRIERS"
                  :key="carrier"
                  class="carrier-column"
                  :data-carrier="carrier"
                >
                  <div class="carrier-header">
                    <div class="carrier-title">{{ carrier }}</div>
                    <div class="stats-wrapper">
                      <div class="stats-pill pill-fila">
                        <span class="stats-label">FILA:</span>
                        <span class="stats-number">{{ getPorSurtirCount(carrier) }}</span>
                      </div>
                      <div class="stats-pill pill-total">
                        <span class="stats-label">TOTAL:</span>
                        <span class="stats-number">{{ getTotalCount(carrier) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="orders-container">
                    <div
                      v-for="order in getPaginatedOrders(carrier, 1)"
                      :key="order.id"
                      class="order-card"
                      :style="{ border: `3px solid ${getBorderColor(order)}` }"
                    >
                      <div class="order-id" :title="`Pedido: ${order.erp_order_id || 'N/A'}`">
                        {{ order.erp_order_id || 'N/A' }}
                      </div>
                      <div v-if="isPendingOverDay(order)" class="pending-pill blink">
                        <span class="pending-dot"></span>
                        PENDIENTE
                      </div>
                      <div class="status-badge-right" :style="{ backgroundColor: getStatusStyle(order.status).backgroundColor, color: getStatusStyle(order.status).color }">
                        <div class="foraneos-marquee">
                          <span>{{ getStatusLabel(order.status) }}</span>
                        </div>
                      </div>
                      <div class="times-container">
                        <div class="time-row">
                          <span style="color: #2d3136;">Hora de creado:</span>
                          <span style="font-weight: 600; color: #2c3e50;">{{ formatTime(order.created_at) }}</span>
                        </div>
                        <div class="time-row">
                          <span style="color: #363a3d;">Tiempo en estatus:</span>
                          <span style="font-weight: 600; color: #2c3e50;">{{ formatTime(getStatusChangeTime(order)) }}</span>
                        </div>
                      </div>
                      <div class="customer-name-container">
                        <div class="customer-label">Cliente</div>
                        <div class="customer-name" :title="order.customer_name || 'No especificado'">
                          {{ order.customer_name || 'No especificado' }}
                        </div>
                      </div>
                    </div>
                 
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { api } from '@/config/axios'


import type { Order } from '@/interfaces/order'
import { FIXED_CARRIERS, OPTIONAL_CARRIERS, ALL_CARRIERS_IN_ORDER } from '@/interfaces/order'

// Constantes
const ITEMS_PER_PAGE = 5

// Estado
const loading = ref(true)
const loadingText = ref('Cargando pedidos...')
const currentSlide = ref(0)
const ordersByCarrier = ref<Record<string, Order[]>>({})
const paginationPages = ref<Record<string, number>>({})

let slideInterval: ReturnType<typeof setInterval> | null = null
let refreshInterval: ReturnType<typeof setInterval> | null = null
const paginationIntervals: Record<string, ReturnType<typeof setInterval>> = {}

const normalizeString = (str: string): string => {
  return (str || '').toString().trim().toLowerCase()
}

const showDeliveredWithinThirtyMinutes = (order: Order, nowTick: number): boolean => {
  const st = String(order?.status || '').toLowerCase()
  if (st !== 'entregado') return true
  const ts = order?.delivered_at || order?.last_status_change_at || order?.updated_at
  if (!ts) return false
  const deliveredMs = new Date(ts).getTime()
  const minutesSinceDelivery = (nowTick - deliveredMs) / (1000 * 60)
  return minutesSinceDelivery < 30
}

const isPorSurtir = (order: Order): boolean => {
  const noSurtidor = !(order.surtidor_id || order.surtidor_name)
  const st = String(order.status || '').toLowerCase()
  const valido = st !== 'cancelado' && st !== 'entregado' && st !== 'surtiendo' && st !== 'surtido' && st !== 'empacando'
  return noSurtidor && valido
}

const shouldShowOrder = (order: Order, nowTick: number): boolean => {
  const st = String(order.status || '').toLowerCase()
  if (st === 'entregado') {
    return showDeliveredWithinThirtyMinutes(order, nowTick)
  }
  if (st === 'cancelado') return false
  return true
}

const isPendingOverDay = (order: Order): boolean => {
  if (!order || !order.created_at) return false
  const st = String(order.status || '').toLowerCase()
  if (st === 'entregado' || st === 'cancelado') return false
  const nowTick = Date.now()
  const hoursDiff = (nowTick - new Date(order.created_at).getTime()) / (1000 * 60 * 60)
  return hoursDiff > 24
}

const formatTime = (dateString?: string): string => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '—'
  const nowTick = Date.now()
  const ms = nowTick - date.getTime()
  if (ms < 0) return '—'
  const totalMin = Math.floor(ms / 60000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return d + 'd ' + h + 'h'
  if (h > 0) return h + 'h ' + m + 'm'
  return m + 'm'
}

const getStatusLabel = (status?: string): string => {
  const s = String(status || '').toLowerCase()
  const labels: Record<string, string> = {
    'facturado': 'Facturado',
    'surtiendo': 'Surtiendo',
    'surtido': 'Surtido',
    'empacando': 'Empacando',
    'enviado': 'Enviado',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado'
  }
  return labels[s] || status || 'Sin estatus'
}

const getStatusStyle = (status?: string): { backgroundColor: string; color: string } => {
  const s = String(status || '').toLowerCase()
  const styles: Record<string, { backgroundColor: string; color: string }> = {
    'facturado': { backgroundColor: '#2196F3', color: '#ffffff' },
    'surtiendo': { backgroundColor: '#ff006f', color: '#ffffff' },
    'surtido': { backgroundColor: '#9C27B0', color: '#ffffff' },
    'empacando': { backgroundColor: '#FF9800', color: '#ffffff' },
    'enviado': { backgroundColor: '#00dd84', color: '#ffffff' },
    'entregado': { backgroundColor: '#11cd17', color: '#ffffff' },
    'cancelado': { backgroundColor: '#f44336', color: '#ffffff' }
  }
  return styles[s] || { backgroundColor: '#9E9E9E', color: '#ffffff' }
}

const getBorderColor = (order: Order): string => {
  if (isPendingOverDay(order)) return '#ff00008d'
  const st = String(order.status || '').toLowerCase()
  const colors: Record<string, string> = {
    'facturado': '#2196F3',
    'surtiendo': '#ff006f',
    'surtido': '#9C27B0',
    'empacando': '#FF9800',
    'enviado': '#00dd84',
    'entregado': '#4CAF50',
    'cancelado': '#f44336'
  }
  return colors[st] || '#9E9E9E'
}

const getStatusChangeTime = (order: Order): string => {
  if (order.last_status_change_at) {
    return order.last_status_change_at
  } else {
    const st = String(order.status || '').toLowerCase()
    if (st === 'surtiendo' && order.surtidor_asignado_at) {
      return order.surtidor_asignado_at
    } else if (st === 'surtido' && order.surtido_at) {
      return order.surtido_at
    } else if (st === 'empacando' && order.packed_at) {
      return order.packed_at
    } else if (st === 'entregado' && order.delivered_at) {
      return order.delivered_at
    } else if (st === 'facturado' && order.facturado_at) {
      return order.facturado_at
    } else {
      return order.updated_at || order.created_at || ''
    }
  }
}

// Funciones de datos
const getOrdersByCarrier = (carrier: string): Order[] => {
  return ordersByCarrier.value[carrier] || []
}

const getPorSurtirCount = (carrier: string): number => {
  const orders = getOrdersByCarrier(carrier)
  return orders.filter(isPorSurtir).length
}

const getTotalCount = (carrier: string): number => {
  return getOrdersByCarrier(carrier).length
}

const getPaginatedOrders = (carrier: string, slideType: number): Order[] => {
  const orders = getOrdersByCarrier(carrier)
  const key = `${carrier}-${slideType}`
  const currentPage = paginationPages.value[key] || 0
  
  const sortedOrders = [...orders].sort((a, b) => {
    const aIsPorSurtir = isPorSurtir(a)
    const bIsPorSurtir = isPorSurtir(b)
    if (aIsPorSurtir !== bIsPorSurtir) return aIsPorSurtir ? -1 : 1
    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  })
  
  const start = currentPage * ITEMS_PER_PAGE
  return sortedOrders.slice(start, start + ITEMS_PER_PAGE)
}

const nextPaginationPage = (carrier: string, slideType: number) => {
  const orders = getOrdersByCarrier(carrier)
  const key = `${carrier}-${slideType}`
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE)
  
  if (totalPages > 1) {
    const currentPage = paginationPages.value[key] || 0
    paginationPages.value[key] = (currentPage + 1) % totalPages
  }
}

// Cargar órdenes desde la API
const loadOrders = async () => {
  try {
    loading.value = true
    loadingText.value = 'Cargando pedidos...'
    
    const response = await api.get('/almacen2/orders')
    const orders = response.data
    
    console.log(`Cargados ${orders.length} pedidos`)
    
    const nowTick = Date.now()
    const validOrders = orders.filter((order: Order) => shouldShowOrder(order, nowTick))
    
    console.log(`Mostrando ${validOrders.length} pedidos después de filtros`)

    const newOrdersByCarrier: Record<string, Order[]> = {}
    ALL_CARRIERS_IN_ORDER.forEach(carrier => {
      newOrdersByCarrier[carrier] = []
    })
    
    validOrders.forEach((order: Order) => {
      const carrierName = order.carrier || 'Sin Carrier'
      const matchedCarrier = ALL_CARRIERS_IN_ORDER.find(c => 
        normalizeString(c) === normalizeString(carrierName)
      )
      
      if (matchedCarrier) {
        newOrdersByCarrier[matchedCarrier].push(order)
      }
    })
    
    ordersByCarrier.value = newOrdersByCarrier
    loading.value = false
    
  } catch (error) {
    console.error('Error loading orders:', error)
    loadingText.value = 'Error al cargar pedidos. Reintentando...'
    loading.value = false
    // Reintentar después de 5 segundos
    setTimeout(loadOrders, 5000)
  }
}

// Funciones del carrusel
const goToSlide = (index: number) => {
  if (index === currentSlide.value) return
  currentSlide.value = index
  resetAutoSlide()
}

const nextSlide = () => {
  const nextIndex = (currentSlide.value + 1) % 2
  goToSlide(nextIndex)
}

const prevSlide = () => {
  const prevIndex = (currentSlide.value - 1 + 2) % 2
  goToSlide(prevIndex)
}

const resetAutoSlide = () => {
  if (slideInterval) {
    clearInterval(slideInterval)
  }
  slideInterval = setInterval(() => {
    nextSlide()
  }, 30000)
}

// Iniciar paginación 
const startPaginationIntervals = () => {

  Object.values(paginationIntervals).forEach(interval => clearInterval(interval))
  
  ALL_CARRIERS_IN_ORDER.forEach(carrier => {
    [0, 1].forEach(slideType => {
      const key = `${carrier}-${slideType}`
      paginationIntervals[key] = setInterval(() => {
        nextPaginationPage(carrier, slideType)
      }, 10000)
    })
  })
}

watch(currentSlide, (newSlide) => {

  ALL_CARRIERS_IN_ORDER.forEach(carrier => {
    const key = `${carrier}-${newSlide}`
    if (!paginationPages.value[key]) {
      paginationPages.value[key] = 0
    }
  })
}) 


onMounted(() => {
  loadOrders()
  startPaginationIntervals()
  resetAutoSlide()
  
 
  refreshInterval = setInterval(() => {
    loadOrders()
  }, 60000)
}) 

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  if (slideInterval) {
    clearInterval(slideInterval)
  }
  Object.values(paginationIntervals).forEach(interval => clearInterval(interval))
}) 
</script>

<style scoped>
@import '@/styles/Almacen.css';
</style>
import { Step } from "react-joyride";
import { TutorialView } from "@/store/useTutorialStore";


export const dashboardSteps: Step[] = [
  {
    target: "[data-tour='sidebar-nav']",
    content: "¡Bienvenido a BUNKER! Este es el menú de navegación. Desde aquí puedes acceder a todas las secciones del sistema: Punto de Venta, Productos, Clientes, Reportes y Configuración.",
    placement: "right",
    disableBeacon: true,
    title: "Navegación Principal",
  },
  {
    target: "[data-tour='dashboard-stats']",
    content: "Aquí puedes ver las estadísticas principales de tu negocio: ventas del día, ingresos, total de productos y productos con stock bajo.",
    placement: "bottom",
    title: "Estadísticas del Día",
  },
  {
    target: "[data-tour='dashboard-chart']",
    content: "Este gráfico muestra la tendencia de ventas de los últimos 7 días. Te ayuda a identificar los días con mayor y menor actividad.",
    placement: "top",
    title: "Gráfico de Ventas",
  },
  {
    target: "[data-tour='dashboard-lowstock']",
    content: "Alerta de productos con stock bajo. Te notifica qué productos necesitan reabastecimiento para evitar quedarte sin inventario.",
    placement: "left",
    title: "Alertas de Stock",
  },
  {
    target: "[data-tour='dashboard-recent']",
    content: "Aquí puedes ver las ventas más recientes realizadas en tu negocio.",
    placement: "top",
    title: "Ventas Recientes",
  },
  {
    target: "[data-tour='dashboard-top']",
    content: "Los productos más vendidos del mes. Identifica cuáles son tus productos estrella.",
    placement: "top",
    title: "Productos Top",
  },
];


export const posSteps: Step[] = [
  {
    target: "[data-tour='pos-search']",
    content: "Busca productos por nombre, SKU o código de barras. Los resultados aparecerán automáticamente mientras escribes.",
    placement: "bottom",
    disableBeacon: true,
    title: "Búsqueda de Productos",
  },
  {
    target: "[data-tour='pos-scan']",
    content: "Usa la cámara de tu dispositivo para escanear códigos de barras y agregar productos rápidamente al carrito.",
    placement: "bottom",
    title: "Escanear Código",
  },
  {
    target: "[data-tour='pos-manual']",
    content: "¿No está el producto en el sistema? Agrégalo manualmente con formato: CANTIDAD NOMBRE PRECIO. Por ejemplo: '2 coca cola 2500'",
    placement: "bottom",
    title: "Carga Manual",
  },
  {
    target: "[data-tour='pos-products']",
    content: "Haz clic en cualquier producto para agregarlo al carrito. Los productos con stock bajo se muestran con una etiqueta roja.",
    placement: "top",
    title: "Catálogo de Productos",
  },
  {
    target: "[data-tour='pos-cart']",
    content: "Aquí se muestran los productos agregados. Puedes modificar cantidades, eliminar productos o activar venta a crédito.",
    placement: "left",
    title: "Carrito de Compra",
  },
  {
    target: "[data-tour='pos-credit']",
    content: "Activa esta opción para registrar una venta a crédito (fiado). Deberás seleccionar un cliente para llevar el control de la deuda.",
    placement: "left",
    title: "Venta a Crédito",
  },
  {
    target: "[data-tour='pos-discount']",
    content: "Aplica descuentos a la venta. Puedes elegir entre porcentaje (%) o monto fijo ($).",
    placement: "left",
    title: "Descuentos",
  },
  {
    target: "[data-tour='pos-payment']",
    content: "Selecciona el método de pago: Efectivo, Tarjeta o Transferencia.",
    placement: "top",
    title: "Método de Pago",
  },
  {
    target: "[data-tour='pos-process']",
    content: "¡Listo! Haz clic aquí para procesar la venta. El sistema actualizará automáticamente el inventario y registrará la transacción.",
    placement: "top",
    title: "Procesar Venta",
  },
];


export const productosSteps: Step[] = [
  {
    target: "[data-tour='productos-tabs']",
    content: "Navega entre las diferentes secciones: Inventario muestra todos tus productos, Catálogo por categorías, y Productos Manuales los ingresados durante ventas.",
    placement: "bottom",
    disableBeacon: true,
    title: "Secciones de Productos",
  },
  {
    target: "[data-tour='productos-search']",
    content: "Busca productos por nombre, SKU o código de barras.",
    placement: "bottom",
    title: "Buscar Producto",
  },
  {
    target: "[data-tour='productos-add']",
    content: "Haz clic aquí para crear un nuevo producto. Podrás agregar nombre, precio, stock inicial, categoría y código de barras.",
    placement: "left",
    title: "Agregar Producto",
  },
  {
    target: "[data-tour='productos-import']",
    content: "Importa múltiples productos desde un archivo Excel o CSV. Ideal para cargar inventarios grandes.",
    placement: "left",
    title: "Importar Productos",
  },
  {
    target: "[data-tour='productos-table']",
    content: "Lista de todos tus productos. Puedes ordenar por columnas y ver el estado del stock de cada uno.",
    placement: "top",
    title: "Tabla de Productos",
  },
  {
    target: "[data-tour='productos-actions']",
    content: "Desde aquí puedes editar el producto, ajustar stock, o desactivarlo temporalmente.",
    placement: "left",
    title: "Acciones del Producto",
  },
];


export const clientesSteps: Step[] = [
  {
    target: "[data-tour='clientes-summary']",
    content: "Resumen de cuentas por cobrar. Ve el total de deuda de todos tus clientes, cuántos tienen deuda pendiente y alertas de deudas vencidas.",
    placement: "bottom",
    disableBeacon: true,
    title: "Resumen de Cuentas",
  },
  {
    target: "[data-tour='clientes-search']",
    content: "Busca clientes por nombre, teléfono o identificador.",
    placement: "bottom",
    title: "Buscar Cliente",
  },
  {
    target: "[data-tour='clientes-add']",
    content: "Crea un nuevo cliente. Solo necesitas un identificador (teléfono o email) y nombre.",
    placement: "left",
    title: "Agregar Cliente",
  },
  {
    target: "[data-tour='clientes-list']",
    content: "Lista de todos tus clientes. Haz clic en cualquiera para ver sus detalles, historial de compras y deudas pendientes.",
    placement: "right",
    title: "Lista de Clientes",
  },
  {
    target: "[data-tour='clientes-detail']",
    content: "Panel de detalles del cliente seleccionado. Aquí puedes ver toda su información y gestionar sus cuentas.",
    placement: "left",
    title: "Detalle del Cliente",
  },
  {
    target: "[data-tour='clientes-metrics']",
    content: "Métricas del cliente: Deuda actual pendiente, total que ha pagado históricamente, promedio de días que tarda en pagar, y cantidad total de cuentas.",
    placement: "bottom",
    title: "Métricas del Cliente",
  },
  {
    target: "[data-tour='clientes-notes']",
    content: "Notas personalizadas sobre el cliente. Usa este espacio para recordar información importante como preferencias o advertencias.",
    placement: "top",
    title: "Notas del Cliente",
  },
  {
    target: "[data-tour='clientes-history']",
    content: "Historial completo de cuentas del cliente organizado por mes. Puedes ver el estado de cada cuenta, registrar pagos y ver los items de cada venta.",
    placement: "top",
    title: "Historial de Cuentas",
  },
];


export const reportesSteps: Step[] = [
  {
    target: "[data-tour='reportes-period']",
    content: "Filtra los reportes por período: Hoy, Ayer, Esta Semana o Este Mes. Los datos se actualizarán según tu selección.",
    placement: "bottom",
    disableBeacon: true,
    title: "Selector de Período",
  },
  {
    target: "[data-tour='reportes-stats']",
    content: "Estadísticas principales: ventas del mes, ingresos totales, ventas de hoy y productos con stock bajo. Los porcentajes muestran el crecimiento respecto al período anterior.",
    placement: "bottom",
    title: "Estadísticas Generales",
  },
  {
    target: "[data-tour='reportes-tabs']",
    content: "Navega entre diferentes vistas: Tendencia de Ventas (gráfico), Top Productos, Métodos de Pago e Historial detallado de todas las ventas.",
    placement: "bottom",
    title: "Tipos de Reportes",
  },
];


export const configuracionSteps: Step[] = [
  {
    target: "[data-tour='config-tabs']",
    content: "Navega entre las secciones de configuración: Suscripción para gestionar tu plan y pagos, y Negocio para actualizar los datos de tu empresa.",
    placement: "bottom",
    disableBeacon: true,
    title: "Secciones de Configuración",
  },
  {
    target: "[data-tour='config-plan']",
    content: "Aquí puedes ver tu plan actual, el precio mensual y todas las características incluidas. El estado puede ser: Activo, Período de Prueba (7 días gratis), Período de Gracia (3 días para pagar después de vencer) o Expirado.",
    placement: "bottom",
    title: "Tu Plan Actual",
  },
  {
    target: "[data-tour='config-status']",
    content: "Información importante: Estado de tu suscripción, días restantes antes del próximo pago, y la fecha exacta del próximo cobro. Cuando queden 7 días o menos, aparecerá un botón para pagar con Mercado Pago.",
    placement: "bottom",
    title: "Estado de Suscripción",
  },
  {
    target: "[data-tour='config-history']",
    content: "Historial completo de todos tus pagos. Aquí puedes verificar fechas, montos y estados de cada transacción. Si tienes un pago pendiente o fallido, podrás ver el detalle aquí.",
    placement: "top",
    title: "Historial de Pagos",
  },
  {
    target: "[data-tour='config-business']",
    content: "En la pestaña Negocio puedes actualizar el nombre y dirección de tu empresa. Esta información aparecerá en tus tickets y documentos.",
    placement: "bottom",
    title: "Información del Negocio",
  },
  {
    target: "[data-tour='config-contact']",
    content: "Datos de contacto opcionales. Si no los configuras, se usarán los datos del responsable de pagos para las comunicaciones.",
    placement: "top",
    title: "Datos de Contacto",
  },
  {
    target: "[data-tour='config-responsible']",
    content: "El responsable de pagos recibe todas las notificaciones importantes: recordatorios de vencimiento (7, 3 y 1 día antes), confirmaciones de pago de Mercado Pago, y alertas si la suscripción está por expirar. Puedes cambiar el responsable en cualquier momento.",
    placement: "top",
    title: "Responsable de Pagos",
  },
];


export const sidebarSteps: Step[] = [
  {
    target: "[data-tour='sidebar-dashboard']",
    content: "Dashboard: Vista general de tu negocio con estadísticas del día.",
    placement: "right",
    disableBeacon: true,
    title: "Dashboard",
  },
  {
    target: "[data-tour='sidebar-pos']",
    content: "Punto de Venta: Aquí realizas las ventas a tus clientes.",
    placement: "right",
    title: "Punto de Venta",
  },
  {
    target: "[data-tour='sidebar-productos']",
    content: "Productos: Gestiona tu inventario, precios y categorías.",
    placement: "right",
    title: "Productos",
  },
  {
    target: "[data-tour='sidebar-clientes']",
    content: "Clientes: Administra tus clientes y sus cuentas por cobrar.",
    placement: "right",
    title: "Clientes",
  },
  {
    target: "[data-tour='sidebar-reportes']",
    content: "Reportes: Analiza el rendimiento de tu negocio con gráficos y estadísticas.",
    placement: "right",
    title: "Reportes",
  },
  {
    target: "[data-tour='sidebar-config']",
    content: "Configuración: Personaliza tu negocio y ajustes del sistema.",
    placement: "right",
    title: "Configuración",
  },
];


export const tutorialStepsMap: Record<TutorialView, Step[]> = {
  dashboard: dashboardSteps,
  pos: posSteps,
  productos: productosSteps,
  clientes: clientesSteps,
  reportes: reportesSteps,
  configuracion: configuracionSteps,
  sidebar: sidebarSteps,
};


export const getStepsForView = (view: TutorialView): Step[] => {
  return tutorialStepsMap[view] || [];
};

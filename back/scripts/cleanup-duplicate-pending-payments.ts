import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicatePendingPayments() {
  console.log('🔍 Iniciando limpieza de pagos pendientes duplicados...\n');

  try {
    // Obtener todos los negocios
    const businesses = await prisma.business.findMany({
      include: {
        paymentHistory: {
          orderBy: { date: 'desc' },
        },
      },
    });

    let totalRemoved = 0;
    let businessesAffected = 0;

    for (const business of businesses) {
      const payments = business.paymentHistory;
      
      // Buscar el último pago exitoso
      const lastPaidPayment = payments.find(p => p.status === 'PAID');
      
      if (!lastPaidPayment) {
        console.log(`⏭️  Negocio ${business.name} (${business.id}): No tiene pagos exitosos, omitiendo...`);
        continue;
      }

      // Buscar pagos PENDING que sean anteriores al último pago exitoso
      const pendingPaymentsToRemove = payments.filter(p => 
        p.status === 'PENDING' && 
        p.date < lastPaidPayment.date
      );

      if (pendingPaymentsToRemove.length > 0) {
        businessesAffected++;
        console.log(`\n🏢 Negocio: ${business.name} (${business.id})`);
        console.log(`   ✅ Último pago exitoso: ${lastPaidPayment.date.toISOString()} - $${lastPaidPayment.amount}`);
        console.log(`   🗑️  Pagos pendientes antiguos a eliminar: ${pendingPaymentsToRemove.length}`);

        for (const payment of pendingPaymentsToRemove) {
          console.log(`      - ID: ${payment.id}`);
          console.log(`        Fecha: ${payment.date.toISOString()}`);
          console.log(`        Monto: $${payment.amount}`);
          console.log(`        MP Payment ID: ${payment.mercadoPagoPaymentId || 'N/A'}`);
          
          // Eliminar el pago
          await prisma.paymentHistory.delete({
            where: { id: payment.id },
          });
          
          totalRemoved++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Limpieza completada');
    console.log(`   📊 Total de pagos eliminados: ${totalRemoved}`);
    console.log(`   🏢 Negocios afectados: ${businessesAffected}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
cleanupDuplicatePendingPayments()
  .then(() => {
    console.log('✨ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

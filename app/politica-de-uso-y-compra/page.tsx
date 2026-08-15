'use client'

import { useRouter } from 'next/navigation'

const PRICE_COP = process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_COP ?? '30000'

export default function PoliticaUsoCompra() {
  const router = useRouter()

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          min-height: 100%;
          background: #000;
        }

        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #f5f5f5;
        }

        .legal-page {
          min-height: 100vh;
          background: #000;
          padding: 5px 24px 70px;
        }

        .legal-container {
          width: min(720px, 100%);
          margin: 0 auto;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          padding: 8px 18px;
          border: 1px solid #333;
          border-radius: 999px;
          background: transparent;
          color: #f5f5f5;
          font-size: 14px;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .back-button:hover {
          border-color: #666;
          background: #111;
        }

        .legal-title {
          margin: 0 0 28px;
          font-size: 36px;
          line-height: 1.15;
          font-weight: 400;
          letter-spacing: -0.8px;
          color: #f5f5f5;
        }

        .legal-domain {
          display: block;
          margin-top: 8px;
          font-size: 30px;
          font-weight: 700;
        }

        .legal-content {
          font-size: 15px;
          line-height: 1.45;
          color: #f1f1f1;
        }

        .legal-content h2 {
          margin: 26px 0 8px;
          font-size: 15px;
          line-height: 1.45;
          font-weight: 700;
          color: #fff;
        }

        .legal-content p {
          margin: 0 0 12px;
        }

        .legal-content ul {
          margin: 0 0 12px;
          padding-left: 20px;
        }

        .legal-content li {
          margin-bottom: 6px;
        }

        .legal-content strong {
          font-weight: 700;
          color: #fff;
        }

        @media (max-width: 700px) {
          .legal-page {
            padding: 5px 18px 50px;
          }

          .legal-title {
            font-size: 30px;
          }

          .legal-domain {
            font-size: 25px;
          }

          .legal-content {
            font-size: 14px;
          }
        }
      `}</style>

      <main className="legal-page">
        <div className="legal-container">
          <button
            type="button"
            className="back-button"
            onClick={() => router.back()}
          >
            <span aria-hidden="true">←</span>
            Volver
          </button>

          <h1 className="legal-title">
            POLÍTICA DE USO Y COMPRA
            <span className="legal-domain">cotifactura</span>
          </h1>

          <article className="legal-content">
            <p>
              <strong>I. OBJETO</strong> La presente Política de Uso y
              Compra regula el acceso, uso del servicio y las condiciones de
              la suscripción paga ofrecida a través de Cotifactura (en
              adelante, la &quot;Plataforma&quot;), operada por Andrés
              Felipe Gómez Jiménez (en adelante, &quot;Cotifactura&quot; o el
              &quot;Prestador del Servicio&quot;). El uso de la Plataforma
              implica la aceptación plena de estas condiciones por parte del
              Usuario.
            </p>

            <h2>Descripción del servicio</h2>

            <p>
              Cotifactura es una plataforma digital de suscripción dirigida a
              contratistas independientes en Colombia, que permite generar
              cotizaciones, cuentas de cobro con firma digital, registrar
              gastos e ingresos con soporte fotográfico, y consultar un
              historial de documentos respaldado en la nube. El servicio se
              presta a través de navegador web y, opcionalmente, como
              aplicación instalable (PWA) en dispositivos móviles y de
              escritorio.
            </p>

            <h2>Registro de cuenta</h2>

            <p>
              Para acceder a las funcionalidades de Cotifactura, el Usuario
              debe crear una cuenta suministrando datos veraces, completos y
              actualizados, incluyendo su nombre completo y correo
              electrónico. El Usuario es responsable de mantener la
              confidencialidad de sus credenciales de acceso y de toda
              actividad realizada desde su cuenta. Cotifactura podrá
              suspender o cancelar cuentas que contengan información falsa o
              que se utilicen de forma contraria a estas condiciones.
            </p>

            <h2>Suscripción y precio</h2>

            <p>
              El acceso completo a Cotifactura requiere una suscripción
              mensual con un valor de ${Number(PRICE_COP).toLocaleString('es-CO')} COP,
              el cual podrá ser actualizado por Cotifactura previa
              notificación al Usuario con antelación razonable. La
              suscripción no tiene permanencia mínima: el Usuario puede
              cancelarla en cualquier momento, sin que ello genere penalidad
              alguna, entendiéndose que el acceso se mantendrá activo hasta
              el vencimiento del período ya pagado.
            </p>

            <h2>Medio de pago y verificación manual</h2>

            <p>
              El pago de la suscripción se realiza mediante transferencia a
              través de Nequi. Debido a que la verificación del pago es
              manual, el Usuario debe: (i) realizar la transferencia por el
              valor indicado a la cuenta Nequi señalada en la Plataforma;
              (ii) cargar el comprobante de pago y el número de referencia
              de la transacción dentro de la Plataforma; y (iii) esperar la
              revisión y aprobación por parte de un administrador de
              Cotifactura, quien activará el acceso una vez verificado el
              pago. Los tiempos de activación pueden variar según la
              disponibilidad del equipo de revisión. Cotifactura se reserva
              el derecho de rechazar comprobantes que no correspondan al
              valor, cuenta o período de la suscripción.
            </p>

            <h2>Renovación y suspensión del servicio</h2>

            <p>
              La suscripción es de carácter mensual y no se renueva de forma
              automática mediante cobro recurrente, dado que el pago se
              procesa manualmente por Nequi. Es responsabilidad del Usuario
              realizar el pago correspondiente antes del vencimiento de su
              período activo para evitar la suspensión del acceso a las
              funcionalidades pagas de la Plataforma. En caso de no
              renovarse la suscripción, Cotifactura podrá restringir el
              acceso a la generación de nuevos documentos, sin perjuicio de
              que el Usuario conserve el acceso a su historial conforme a
              los períodos de conservación de datos aplicables.
            </p>

            <h2>Política de reembolsos</h2>

            <p>
              Dado que el servicio se activa de forma manual tras la
              verificación del pago y otorga acceso inmediato a las
              funcionalidades de la Plataforma, los pagos realizados por
              períodos de suscripción ya activados no son reembolsables,
              salvo error atribuible a Cotifactura (por ejemplo, cobro
              duplicado o activación no realizada pese a la verificación del
              pago), en cuyo caso el Usuario podrá solicitar la corrección o
              el reembolso correspondiente escribiendo a [PENDIENTE]. Esta
              política se establece sin perjuicio de los derechos que la
              normativa colombiana de protección al consumidor reconozca al
              Usuario, incluyendo lo dispuesto en la Ley 1480 de 2011
              (Estatuto del Consumidor) en lo que resulte aplicable a
              servicios digitales contratados a distancia.
            </p>

            <h2>Uso adecuado de la Plataforma</h2>

            <p>El Usuario se compromete a utilizar Cotifactura de forma lícita y, en particular, a:</p>
            <ul>
              <li>No suministrar información falsa, engañosa o que suplante la identidad de terceros.</li>
              <li>No utilizar la Plataforma para generar documentos con fines fraudulentos, de evasión fiscal o cualquier otro propósito ilícito.</li>
              <li>No intentar vulnerar la seguridad, infraestructura o los sistemas de autenticación de la Plataforma.</li>
              <li>No compartir sus credenciales de acceso con terceros no autorizados.</li>
              <li>Ser el único responsable de la exactitud de la información contenida en los documentos (cotizaciones, cuentas de cobro, informes de gastos) que genere a través de la Plataforma.</li>
            </ul>

            <p>
              El incumplimiento de estas condiciones podrá dar lugar a la
              suspensión o cancelación de la cuenta del Usuario, sin
              perjuicio de las acciones legales a que haya lugar.
            </p>

            <h2>Responsabilidad sobre el contenido generado</h2>

            <p>
              Cotifactura es una herramienta de generación y organización de
              documentos. El Usuario es el único responsable del contenido,
              exactitud y validez legal, fiscal o tributaria de las
              cotizaciones, cuentas de cobro e informes que genere y envíe a
              sus propios clientes. Cotifactura no actúa como asesor
              contable, tributario ni legal, y no garantiza que los
              documentos generados cumplan con requisitos fiscales
              específicos que puedan aplicar a cada Usuario según su
              actividad económica.
            </p>

            <h2>Disponibilidad del servicio</h2>

            <p>
              Cotifactura hará sus mejores esfuerzos para mantener la
              Plataforma disponible de forma continua, sin embargo no
              garantiza la disponibilidad ininterrumpida del servicio, y no
              será responsable por interrupciones causadas por
              mantenimiento, fallas de terceros proveedores de
              infraestructura, casos fortuitos o de fuerza mayor.
            </p>

            <h2>Modificaciones a esta política</h2>

            <p>
              Cotifactura podrá modificar esta Política de Uso y Compra en
              cualquier momento, publicando la versión actualizada en la
              Plataforma. Los cambios sustanciales que afecten condiciones
              económicas serán informados a los Usuarios con antelación
              razonable. El uso continuado de la Plataforma tras dichos
              cambios implica su aceptación.
            </p>

            <p>Última actualización: 15/08/2026.</p>
          </article>
        </div>
      </main>
    </>
  );
}
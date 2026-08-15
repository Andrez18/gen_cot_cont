'use client'

import { useRouter } from 'next/navigation'

export default function AvisoLegal() {
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
            AVISO LEGAL
            <span className="legal-domain">cotifactura</span>
          </h1>

          <article className="legal-content">
            <p>
              <strong>I. INFORMACIÓN GENERAL</strong> En cumplimiento del
              deber de información hacia los Usuarios, a continuación se
              detallan los datos identificativos de Cotifactura (en
              adelante, el &quot;Sitio Web&quot; o la &quot;Plataforma&quot;)
              y las condiciones generales de acceso y uso del mismo.
            </p>

            <h2>Titular del sitio web</h2>

            <p>
              Titular: Andrés Felipe Gómez Jiménez, operando bajo el nombre
              comercial Cotifactura.
            </p>

            <h2>Objeto</h2>

            <p>
              Cotifactura es una plataforma digital dirigida a contratistas
              independientes en Colombia, que permite la generación de
              cotizaciones, cuentas de cobro con firma digital, control de
              gastos e ingresos, y consulta de un historial de documentos.
              El acceso a determinadas funcionalidades de la Plataforma
              requiere el registro de una cuenta y el pago de una
              suscripción, en los términos descritos en la Política de Uso y
              Compra.
            </p>

            <h2>Condición de usuario</h2>

            <p>
              El acceso, navegación y uso de Cotifactura confiere la
              condición de Usuario y supone la aceptación plena de todas las
              disposiciones contenidas en este Aviso Legal, así como en la
              Política de Privacidad y la Política de Uso y Compra
              publicadas en la Plataforma. El Usuario declara ser mayor de
              edad y contar con capacidad legal suficiente para contratar
              los servicios ofrecidos por Cotifactura.
            </p>

            <h2>Propiedad intelectual e industrial</h2>

            <p>
              El código fuente, diseño, estructura de navegación, logotipos,
              marcas, textos, gráficos y demás contenidos propios de
              Cotifactura son titularidad de Andrés Felipe Gómez Jiménez o
              cuentan con la debida licencia para su uso, y están protegidos
              por la normativa colombiana e internacional de propiedad
              intelectual, en particular por la Ley 23 de 1982 sobre
              derechos de autor y la Decisión Andina 351 de 1993. Queda
              prohibida la reproducción, distribución, comunicación pública,
              transformación o cualquier otra forma de explotación, total o
              parcial, de los contenidos del Sitio Web sin autorización
              previa y expresa de su titular, salvo en los casos permitidos
              por la ley.
            </p>

            <p>
              El Usuario conserva la titularidad de los datos, textos e
              información propia que ingrese en la Plataforma (por ejemplo,
              el contenido de sus cotizaciones y cuentas de cobro), y
              únicamente otorga a Cotifactura el derecho de almacenar y
              procesar dicha información con el fin de prestar el servicio
              contratado.
            </p>

            <h2>Exclusión de responsabilidad</h2>

            <p>
              Cotifactura no garantiza la ausencia total de errores en el
              acceso al Sitio Web, ni que su contenido se encuentre siempre
              actualizado. Cotifactura no será responsable por daños o
              perjuicios de cualquier naturaleza derivados de la falta de
              disponibilidad o continuidad del funcionamiento del Sitio Web,
              de fallas atribuibles a terceros proveedores de
              infraestructura tecnológica, de la presencia de virus u otros
              elementos lesivos en el contenido, del uso indebido del Sitio
              Web por parte del Usuario, o de la exactitud y validez legal,
              fiscal o tributaria de los documentos generados por el Usuario
              a través de la Plataforma. Cotifactura es una herramienta de
              apoyo administrativo y no sustituye la asesoría contable,
              tributaria o legal profesional.
            </p>

            <h2>Enlaces a terceros</h2>

            <p>
              El Sitio Web puede contener enlaces a páginas web de terceros
              cuyo contenido es ajeno a Cotifactura. La presencia de dichos
              enlaces tiene una finalidad meramente informativa y en ningún
              caso implica una sugerencia, invitación o recomendación sobre
              los mismos. Cotifactura no asume responsabilidad alguna por el
              contenido, políticas de privacidad o prácticas de dichos sitios
              de terceros.
            </p>

            <h2>Legislación aplicable y jurisdicción</h2>

            <p>
              Las presentes condiciones se rigen por la legislación de la
              República de Colombia. Para la resolución de cualquier
              controversia derivada del acceso o uso del Sitio Web, las
              partes se someten a los jueces y tribunales competentes de
              Colombia, sin perjuicio de los mecanismos de protección al
              consumidor y de protección de datos personales establecidos en
              la normativa vigente, incluyendo la Superintendencia de
              Industria y Comercio (SIC).
            </p>

            <h2>Modificaciones</h2>

            <p>
              Cotifactura se reserva el derecho de modificar el presente
              Aviso Legal para adaptarlo a novedades legislativas,
              jurisprudenciales o a cambios en el funcionamiento del Sitio
              Web. Las modificaciones serán publicadas en la Plataforma y se
              recomienda al Usuario consultar esta página periódicamente.
            </p>

            <p>Última actualización: 15/08/2026.</p>
          </article>
        </div>
      </main>
    </>
  );
}
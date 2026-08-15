'use client'

import { useRouter } from 'next/navigation'

export default function PoliticaPrivacidad() {
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
            POLÍTICA DE PRIVACIDAD Y TRATAMIENTO DE DATOS PERSONALES
            <span className="legal-domain">cotifactura</span>
          </h1>

          <article className="legal-content">
            <p>
              <strong>I. MARCO LEGAL Y OBJETO</strong> Cotifactura (en
              adelante, también el &quot;Sitio Web&quot; o la
              &quot;Plataforma&quot;) es una plataforma digital dirigida a
              contratistas independientes en Colombia para la elaboración de
              cotizaciones, cuentas de cobro, control de gastos e ingresos, y
              administración documental. Esta Política de Privacidad regula el
              tratamiento de los datos personales de los Usuarios de
              Cotifactura, en cumplimiento de la Ley 1581 de 2012, el Decreto
              1377 de 2013, el Decreto 1074 de 2015 (Único Reglamentario del
              Sector Comercio, Industria y Turismo) y demás normas que las
              modifiquen, adicionen o sustituyan, así como de lo dispuesto en
              el artículo 15 de la Constitución Política de Colombia sobre el
              derecho al hábeas data.
            </p>

            <h2>Responsable del tratamiento</h2>

            <p>
              El responsable del tratamiento de los datos personales
              recolectados a través de Cotifactura es Andrés Felipe Gómez
              Jiménez, identificado con NIT/documento 1011102934, quien opera
              la Plataforma como persona natural bajo el nombre comercial
              Cotifactura (en adelante, el &quot;Responsable del
              Tratamiento&quot;).
            </p>

            <h2>Datos personales que se recolectan</h2>

            <p>
              Cotifactura recolecta los datos personales que el Usuario
              suministra directamente al registrarse y utilizar la
              Plataforma, entre ellos: nombre completo, correo electrónico,
              número de teléfono, información de contacto de sus propios
              clientes (para la generación de cotizaciones y cuentas de
              cobro), datos bancarios o de pago (como número de cuenta Nequi)
              necesarios para la elaboración de documentos, firma digital,
              fotografías de recibos y comprobantes de gastos, y comprobantes
              de pago de la suscripción. Cotifactura no recolecta ni solicita
              datos sensibles conforme a la definición del artículo 5 de la
              Ley 1581 de 2012, salvo que el propio Usuario decida incluir
              dicha información dentro del contenido de sus documentos, caso
              en el cual actúa bajo su propia responsabilidad como
              tratador de esos datos frente a sus clientes.
            </p>

            <h2>Finalidades del tratamiento</h2>

            <p>Los datos personales recolectados serán tratados para las siguientes finalidades:</p>
            <ul>
              <li>Crear y administrar la cuenta del Usuario en la Plataforma.</li>
              <li>Generar cotizaciones, cuentas de cobro, informes de gastos y demás documentos ofrecidos por Cotifactura.</li>
              <li>Verificar y administrar los pagos de la suscripción mensual realizados por Nequi.</li>
              <li>Almacenar y respaldar el historial de documentos del Usuario en la nube.</li>
              <li>Enviar comunicaciones relacionadas con el servicio, incluyendo confirmaciones de pago, soporte técnico y avisos operativos.</li>
              <li>Cumplir con obligaciones legales o requerimientos de autoridades competentes.</li>
              <li>Mejorar la calidad, seguridad y funcionamiento de la Plataforma.</li>
            </ul>

            <h2>Autorización del titular</h2>

            <p>
              Al registrarse y crear una cuenta en Cotifactura, el Usuario
              otorga su autorización previa, expresa e informada para el
              tratamiento de sus datos personales conforme a esta Política de
              Privacidad, de acuerdo con lo dispuesto en el artículo 9 de la
              Ley 1581 de 2012. El Usuario podrá revocar esta autorización en
              cualquier momento, salvo que exista un deber legal o
              contractual que impida su eliminación inmediata, en cuyo caso
              se informará al Usuario dicha circunstancia.
            </p>

            <h2>Derechos del Titular de los datos</h2>

            <p>
              De conformidad con el artículo 8 de la Ley 1581 de 2012, el
              Usuario, como Titular de sus datos personales, tiene derecho a:
            </p>
            <ul>
              <li>Conocer, actualizar y rectificar sus datos personales frente al Responsable del Tratamiento.</li>
              <li>Solicitar prueba de la autorización otorgada, salvo cuando expresamente se exceptúe como requisito para el tratamiento.</li>
              <li>Ser informado, previa solicitud, respecto del uso que se ha dado a sus datos personales.</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la normativa de protección de datos.</li>
              <li>Revocar la autorización y/o solicitar la supresión de sus datos cuando no exista un deber legal o contractual que impida su eliminación.</li>
              <li>Acceder de forma gratuita a sus datos personales que hayan sido objeto de tratamiento.</li>
            </ul>

            <p>
              El Usuario podrá ejercer estos derechos mediante comunicación
              escrita dirigida al Responsable del Tratamiento, indicando su
              nombre completo, la descripción clara de los hechos que dan
              lugar a la solicitud, sus datos de contacto y los documentos
              que soporten su petición cuando sea necesario. La solicitud
              podrá enviarse al correo electrónico: [PENDIENTE]. Cotifactura
              dará respuesta dentro de los plazos establecidos en la Ley 1581
              de 2012 (máximo 10 días hábiles para consultas y 15 días
              hábiles para reclamos, prorrogables conforme a la ley).
            </p>

            <h2>Almacenamiento, seguridad y transferencia de datos</h2>

            <p>
              Los datos personales de los Usuarios se almacenan de forma
              cifrada en servidores en la nube provistos por proveedores de
              infraestructura tecnológica (encargados del tratamiento), con
              controles de acceso basados en autenticación y aislamiento de
              información por cuenta de usuario. Cotifactura implementa
              medidas técnicas, humanas y administrativas razonables para
              proteger los datos personales contra pérdida, acceso no
              autorizado, uso indebido, alteración o divulgación. En caso de
              que dichos servidores se encuentren ubicados fuera de Colombia,
              dicho tratamiento se realiza en el marco de una relación de
              encargo del tratamiento, en los términos del artículo 10 literal
              f de la Ley 1581 de 2012 y demás normas concordantes sobre
              transferencia y transmisión internacional de datos.
            </p>

            <h2>Datos de menores de edad</h2>

            <p>
              Cotifactura está dirigida a contratistas independientes mayores
              de edad. La Plataforma no está diseñada para ser utilizada por
              menores de edad y no recolecta intencionalmente datos
              personales de menores. Si se tiene conocimiento de que un menor
              de edad ha suministrado datos personales sin la autorización de
              sus padres o representantes legales, dichos datos serán
              eliminados.
            </p>

            <h2>Vigencia y período de conservación</h2>

            <p>
              Los datos personales serán conservados durante el tiempo en que
              el Usuario mantenga activa su cuenta en Cotifactura y, con
              posterioridad a su cancelación, durante el plazo necesario para
              cumplir obligaciones legales, fiscales o contractuales
              aplicables (incluyendo, sin limitarse a ello, la conservación
              de documentos contables y comerciales conforme a la normativa
              colombiana).
            </p>

            <h2>Cambios en la Política de Privacidad</h2>

            <p>
              Cotifactura podrá modificar esta Política de Privacidad para
              adaptarla a novedades legislativas, jurisprudenciales o a
              cambios en el funcionamiento de la Plataforma. Cualquier
              modificación sustancial será informada a los Usuarios a través
              del Sitio Web o de los medios de contacto registrados. Se
              recomienda al Usuario revisar esta página periódicamente.
            </p>

            <p>Última actualización: 15/08/2026.</p>
          </article>
        </div>
      </main>
    </>
  );
}
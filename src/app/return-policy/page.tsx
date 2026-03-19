export default function ReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 lg:px-8 text-gray-800 leading-relaxed min-h-screen">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
        Return Policy
      </h1>
      <p className="text-sm text-gray-500 mb-10 font-medium">
        Effective Date: March {new Date().getFullYear()}
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            1. Standard Implementation
          </h2>
          <p>
            At <strong>InspireShop</strong>, our logistical operations are
            grounded in discipline. The Return framework exists to safeguard
            consumer confidence while preventing systemic abuse. Returns are
            legally permissible within an exact{" "}
            <strong>30-Day execution window</strong> post-delivery confirmation.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            2. Conditions for Authorization
          </h2>
          <p>
            We institute strict conditions upon which a return payload will be
            authorized for processing:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-700">
            <li>
              <strong>Intact State:</strong> Merchandise must arrive back at our
              inspection facilities in unworn, unwashed, and original condition.
              Tags must be mathematically unbroken.
            </li>
            <li>
              <strong>Proof of Action:</strong> Legitimate Order ID protocols
              must be provided to the InspireShop verification network.
            </li>
            <li>
              <strong>Quality Flags:</strong> Items displaying fraudulent
              tampering, extreme neglect, or distinct external wear are
              permanently barred from the return pipeline without refunds.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            3. Excluded Asset Classes
          </h2>
          <p>
            Strict health directives require that the following assets are
            categorically unreturnable once the protective seal algorithm is
            breached: Unsealed electronics, undergarments, food
            products/groceries, and personalized <em>Customise</em> orders.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            4. Disciplinary Processing & Refunds
          </h2>
          <p>
            Once a unit crosses an authorized intake center, it will undergo a
            rigorous validation screening. Approved credits will be
            algorithmically routed to the originating payment gateway within a
            span of 5-7 continuous business days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            5. Resolution Pipeline
          </h2>
          <p>
            If a package breach occurs mid-transit, lodge an instantaneous
            protocol error with <strong>support@inspireshop.com</strong> with
            cryptographic proof (clear photographs). Our response team will
            intercept the issue rapidly.
          </p>
        </section>
      </div>
    </div>
  );
}

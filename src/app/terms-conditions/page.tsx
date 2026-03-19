export default function TermsConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 lg:px-8 text-gray-800 leading-relaxed min-h-screen">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
        Terms & Conditions
      </h1>
      <p className="text-sm text-gray-500 mb-10 font-medium">
        Effective Date: March {new Date().getFullYear()}
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or conducting transactions via{" "}
            <strong>InspireShop</strong>, you are agreeing to absolute
            compliance with these Terms and Conditions. Failure to uphold the
            disciplines established within this doctrine will result in
            immediate termination of operational access. We run a professional
            ecosystem, and non-compliance is not an option.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            2. User Conduct & Obligations
          </h2>
          <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-700">
            <li>
              <strong>Buyers:</strong> Responsible for executing lawful payments
              and providing accurate delivery instructions.
            </li>
            <li>
              <strong>Sellers:</strong> Accountable for meticulous catalog
              management. Misrepresentation of inventory or providing
              counterfeit goods incurs automatic, irreversible platform bans. As
              per our <em>One-Time Edit Policy</em>, listing corrections cannot
              bypass accountability tracking.
            </li>
            <li>
              <strong>Delivery Partners:</strong> Constrained to utmost
              professionalism. Punctuality and protocol adherence are mandatory
              and highly monitored metrics.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            3. Commercial Integrity
          </h2>
          <p>
            Transactions orchestrated under the InspireShop infrastructure
            constitute legally binding agreements. Fraudulent chargebacks,
            abusive language, or systemic abuse compromises InspireShop
            operations and may be escalated to regional law enforcement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            4. Intellectual Property Rights
          </h2>
          <p>
            The branding, software execution, layout algorithms, and trade
            dresses comprising <strong>InspireShop</strong> are strictly
            proprietary property. Unauthorized scraping, replication, or
            distribution of InspireShop logic or brand imagery represents a
            severe infringement globally enforceable by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            5. Liability Limitation
          </h2>
          <p>
            InspireShop functions as a centralized marketplace. We govern the
            infrastructure but accept no sweeping liability for systemic
            failures resulting from forces outside technological boundaries (Act
            of God).
          </p>
        </section>
      </div>
    </div>
  );
}

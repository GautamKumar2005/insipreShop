export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 lg:px-8 text-gray-800 leading-relaxed min-h-screen">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
        Privacy Policy
      </h1>
      <p className="text-sm text-gray-500 mb-10 font-medium">
        Last Updated: March {new Date().getFullYear()}
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            1. Introduction
          </h2>
          <p>
            Welcome to <strong>InspireShop</strong>. Your privacy and digital
            safety are our foremost priorities. This Privacy Policy strictly
            governs how InspireShop collects, uses, maintains, and securely
            discloses information collected from users. By registering an
            account or executing a transaction on InspireShop, you expressly
            consent to this policy. We maintain strict discipline over data
            processing standards and zero-tolerance toward unauthorized
            dissemination.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            2. Data Collection
          </h2>
          <p>
            We mandate the collection only of critical operational data
            including:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-700">
            <li>
              <strong>Personal Credentials</strong> (Name, Email Address, Phone
              Number) for identity resolution.
            </li>
            <li>
              <strong>Logistical Data</strong> (Addresses, Geodetic location)
              solely for delivery task assignments.
            </li>
            <li>
              <strong>Commerce Intelligence</strong> (Order history, browsing
              actions) to optimize platform algorithms.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            3. Utilization of Information
          </h2>
          <p>
            Collected data is channeled strictly toward operational necessity:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-700">
            <li>
              Facilitating immediate processing of financial transactions and
              product delivery.
            </li>
            <li>
              Enforcing InspireShop safety standards to protect users from
              fraudulent activities.
            </li>
            <li>
              Providing regulated customer support and prompt resolution
              processing.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            4. Data Protection Protocol
          </h2>
          <p>
            InspireShop actively engineers state-of-the-art cipher encryption
            protocols to shield sensitive information against unauthorized
            external or internal access. We assert strict internal audits
            restricting data access to authorized personnel functionally
            required to execute their mandate.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            5. Third-Party Sharing
          </h2>
          <p>
            We unequivocally refuse to trade, sell, or rent user credentials.
            Information transfer is strictly permitted to thoroughly vetted
            external infrastructure partners (e.g., payment gateways and
            Cloudinary media servers) inherently required to keep InspireShop
            fully operational.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b pb-2">
            6. Contact Information
          </h2>
          <p>
            For serious inquiries regarding your privacy rights, please direct
            formal escalation to our Data Protection Unit at{" "}
            <strong>support@inspireshop.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}

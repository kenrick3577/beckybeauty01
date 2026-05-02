import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 animate-fade-in">
      <Link to="/" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-8">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Home
      </Link>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

      <div className="prose prose-sm text-gray-700 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Becky Beauty's website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Appointment Booking</h2>
          <p>When booking an appointment, you agree to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Provide accurate and complete information</li>
            <li>Arrive on time for your scheduled appointment</li>
            <li>Provide at least 24 hours notice for cancellations</li>
            <li>Pay for services rendered at the time of your appointment</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Product Orders</h2>
          <p>
            All product sales are final unless the item is defective or damaged upon arrival. Please contact us within 7 days of receiving your order if you have any issues.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Account Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Please notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Limitation of Liability</h2>
          <p>
            Becky Beauty shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of our services after any changes constitutes your acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact Us</h2>
          <p>
            For questions about these Terms of Service, contact us at{' '}
            <a href="mailto:k.beckybeauty@gmail.com" className="text-primary-600 hover:text-primary-500">
              k.beckybeauty@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
